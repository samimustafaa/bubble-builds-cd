'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const {patchArchive,mobileConfig,PRESETS}=require('./patcher.cjs');
async function localBuilder({source,manifest,preset,image}){const output={'neox.xml':mobileConfig(source['neox.xml'])};for(const name of ['model_regular.npk','shader.npk'])output['res/'+name]=preset!=='mobile'?patchArchive(source['res/'+name],name,manifest.archives[name],preset,image):source['res/'+name];return output;}
const TARGETS=['neox.xml','res/model_regular.npk','res/shader.npk'];
async function atomic(file,data){
 await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+crypto.randomUUID()+'.tmp';
 try{const h=await fs.open(tmp,'wx');try{await h.writeFile(data);await h.sync();}finally{await h.close();}await fs.rename(tmp,file);}finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
}
async function optional(file){try{return await fs.readFile(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
class BuildEngine{
 constructor(dataDir,userDir,guard,builder=localBuilder){this.dataDir=dataDir;this.userDir=userDir;this.guard=guard;this.builder=builder;this.busy=false;}
 id(root){return hash(Buffer.from(process.platform==='win32'?root.toLowerCase():root)).slice(0,24);}
 dir(root){return path.join(this.userDir,'backups',this.id(root));}
 async root(input){
  if(typeof input!=='string'||!input.trim())throw Error('Choose the Creative Destruction folder first.');
  let root=await fs.realpath(input);if(path.basename(root).toLowerCase()==='res')root=path.dirname(root);
  for(const rel of TARGETS){
   const file=path.join(root,rel),stat=await fs.lstat(file).catch(e=>{if(e.code==='ENOENT'&&rel==='neox.xml')return null;throw e;});
   if(stat&&(!stat.isFile()||stat.isSymbolicLink()))throw Error('Game files must be regular files, not shortcuts.');
   const parent=await fs.realpath(path.dirname(file));if(parent!==root&&parent!==path.join(root,'res'))throw Error('Game files must be inside the selected folder.');
  }return root;
 }
 async manifest(){if(!this.meta)this.meta=JSON.parse(await fs.readFile(path.join(this.dataDir,'manifest.json'),'utf8'));return this.meta;}
 async record(root){
  const b=await optional(path.join(this.dir(root),'record.json'));if(!b)return null;
  const r=JSON.parse(b);if(r.schema!==1||r.root!==root||!Array.isArray(r.files)||r.files.length!==TARGETS.length||r.files.some((f,i)=>f.path!==TARGETS[i]||typeof f.exists!=='boolean'||(f.exists&&!/^[a-f0-9]{64}$/.test(f.sha256))))throw Error('Backup record is invalid. Your backup files have been kept.');
  return r;
 }
 async save(root,r){await atomic(path.join(this.dir(root),'record.json'),JSON.stringify(r,null,2));}
 async status(input){const root=await this.root(input),r=await this.record(root);return {root,backup:!!r,pending:!!r?.pending,preset:r?.preset||'Not applied',game:await this.guard(root)};}
 async closed(root){const g=await this.guard(root);if(g.state!=='closed')throw Error(g.message||'Close Creative Destruction before changing builds.');}
 async verifyBackups(root,r){for(let i=0;i<TARGETS.length;i++)if(r.files[i].exists){const b=await fs.readFile(path.join(this.dir(root),i+'.bin'));if(hash(b)!==r.files[i].sha256)throw Error('A backup failed verification. No files were changed.');}}
 async createBackup(root){
  let r=await this.record(root);if(r){await this.verifyBackups(root,r);return r;}
  await fs.mkdir(this.dir(root),{recursive:true});r={schema:1,root,created:new Date().toISOString(),preset:'Not applied',pending:false,files:[]};
  for(let i=0;i<TARGETS.length;i++){
   const rel=TARGETS[i],b=await optional(path.join(root,rel));r.files.push({path:rel,exists:b!==null,sha256:b===null?null:hash(b)});
   if(b!==null){const file=path.join(this.dir(root),i+'.bin');try{await fs.writeFile(file,b,{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;if(hash(await fs.readFile(file))!==hash(b))throw Error('An unfinished backup exists with different bytes. Open Backups and keep a copy before resolving it.');}}
  }
  await this.verifyBackups(root,r);await this.save(root,r);return r;
 }
 async compatible(root,r){
  const m=await this.manifest();for(const [name,info]of Object.entries(m.archives)){
   const key='res/'+name,h=hash(await fs.readFile(path.join(root,key)));
   if(h!==info.originalSha256&&h!==info.patchedSha256&&!info.legacyPatchedHashes?.includes(h)&&h!==r?.lastHashes?.[key])throw Error(name+' differs from the supplied game version. Restore the matching originals before applying.');
   if(!r&&h!==info.originalSha256)throw Error('No original backup exists for this patched game. Restore the original '+name+' first.');
   if(r&&r.files.find(f=>f.path===key)?.sha256!==info.originalSha256)throw Error('The first backup for '+name+' is not the original supported archive.');
  }
 }
 async restoreFiles(root,r){
  await this.verifyBackups(root,r);
  for(let i=0;i<TARGETS.length;i++){
   await this.closed(root);const f=r.files[i],target=path.join(root,f.path);
   if(f.exists){await atomic(target,await fs.readFile(path.join(this.dir(root),i+'.bin')));if(hash(await fs.readFile(target))!==f.sha256)throw Error('Restore verification failed.');}
   else await fs.rm(target,{force:true});
  }
  r.pending=false;r.preset='Restored backup';r.lastHashes={};await this.save(root,r);
 }
 async apply(input,preset,progress=()=>{},image=null){
  if(!['mobile','custom',...Object.keys(PRESETS)].includes(preset))throw Error('Choose a supported preset.');if(this.busy)throw Error('Wait for the current operation.');this.busy=true;
  try{
   const root=await this.root(input);await this.closed(root);let r=await this.record(root);
   if(r?.pending)throw Error('An earlier change was interrupted. Restore the backup first.');
   await this.compatible(root,r);const m=await this.manifest(),source={};
   if(r)await this.verifyBackups(root,r);
   for(let i=0;i<TARGETS.length;i++)source[TARGETS[i]]=r?(r.files[i].exists?await fs.readFile(path.join(this.dir(root),i+'.bin')):null):await optional(path.join(root,TARGETS[i]));
   progress('Generating your selected look locally…');const payload=await this.builder({source,manifest:m,preset,image});
   if(!payload||Object.keys(payload).length!==TARGETS.length||TARGETS.some(rel=>!Buffer.isBuffer(payload[rel])))throw Error('The generated patch is incomplete.');
   progress('Saving and verifying your original files…');r=await this.createBackup(root);await this.compatible(root,r);
   r.pending=true;await this.save(root,r);
   try{
    for(const [rel,b]of Object.entries(payload)){await this.closed(root);progress('Applying '+rel+'…');await atomic(path.join(root,rel),b);if(hash(await fs.readFile(path.join(root,rel)))!==hash(b))throw Error('File verification failed.');}
    r.lastHashes=Object.fromEntries(Object.entries(payload).map(([k,b])=>[k,hash(b)]));r.preset=PRESETS[preset]?.name||(preset==='custom'?'Custom image':'Mobile / flat');r.pending=false;r.applied=new Date().toISOString();await this.save(root,r);
   }catch(error){
    progress('Recovering original files…');try{await this.restoreFiles(root,r);}catch(e){throw Error(error.message+' Recovery needs attention: '+e.message+' Use Restore Backup with the game closed.');}throw Error(error.message+' Your original backup was restored.');
   }
   return await this.status(root);
  }finally{this.busy=false;}
 }
 async restore(input,progress=()=>{}){
  if(this.busy)throw Error('Wait for the current operation.');this.busy=true;
  try{const root=await this.root(input);await this.closed(root);const r=await this.record(root);if(!r)throw Error('No backup exists for this game folder.');await this.verifyBackups(root,r);r.pending=true;await this.save(root,r);progress('Restoring and verifying your saved files…');await this.restoreFiles(root,r);return await this.status(root);}finally{this.busy=false;}
 }
}
module.exports={BuildEngine,hash,atomic,TARGETS};
