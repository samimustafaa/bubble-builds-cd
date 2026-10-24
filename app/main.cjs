'use strict';
const {app,BrowserWindow,ipcMain,dialog,shell,screen}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),{execFile}=require('node:child_process'),{promisify}=require('node:util'),{pathToFileURL}=require('node:url');
const {BuildEngine,atomic}=require('./engine.cjs'),{Updates}=require('./updates.cjs'),{autoUpdater}=require('electron-updater');
const {PRESETS}=require('./patcher.cjs');
const run=promisify(execFile),page=pathToFileURL(path.join(__dirname,'index.html')).href;
let win,engine,updates,settings={folder:'',repo:'samimustafaa/bubble-builds-cd'},prefs;
async function gameStatus(root){
 if(process.platform!=='win32')return {state:'unknown',message:'Apply and Restore run on Windows only.'};
 try{
  const script='$ErrorActionPreference="Stop";[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false);@(Get-CimInstance Win32_Process | Select-Object Name,ExecutablePath) | ConvertTo-Json -Compress';
  const {stdout}=await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,timeout:15000,maxBuffer:4*1024*1024});
  const rows=JSON.parse(stdout.replace(/^\uFEFF/,'').trim()||'[]'),prefix=path.resolve(root).toLowerCase()+path.sep;
  const found=(Array.isArray(rows)?rows:[rows]).some(p=>String(p.ExecutablePath||'').toLowerCase().startsWith(prefix)||['client.exe','creativedestruction.exe','creative_destruction.exe','cdclient.exe'].includes(String(p.Name||'').toLowerCase()));
  return found?{state:'running',message:'Close Creative Destruction and its launcher first.'}:{state:'closed'};
 }catch{return {state:'unknown',message:'Windows could not verify the game is closed. Try again.'};}
}
const send=(channel,data)=>{if(win&&!win.isDestroyed())win.webContents.send(channel,data);};
function handle(channel,fn){ipcMain.handle(channel,async(e,...a)=>{
 if(e.sender!==win.webContents||e.senderFrame?.url!==page)throw Error('Invalid request.');
 try{return {ok:true,value:await fn(...a)};}catch(error){return {ok:false,error:['EACCES','EPERM'].includes(error.code)?'Windows denied access. Close the game and check folder permissions; backups are kept.':error.message};}
});}
async function save(){await atomic(prefs,JSON.stringify(settings,null,2));}
async function state(){let status=null;if(settings.folder)try{status=await engine.status(settings.folder);}catch(e){status={error:e.message,root:settings.folder};}return {version:app.getVersion(),windows:process.platform==='win32',folder:settings.folder,repo:settings.repo,animations:settings.animations!==false,presets:[...Object.entries(PRESETS).map(([id,p])=>({id,name:p.name,number:p.number||'',motion:p.motion||'Soft Pearl · subtle bubble shading',quality:p.quality||'bubble',supportsAnimation:id!=='bubble'&&!p.static,poster:p.poster||null,image:p.preview||'assets/'+id+'-sample.png'}))],status};}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.setAppUserModelId('com.sg0hann.bubblebuilds');
 app.whenReady().then(async()=>{
  const user=app.getPath('userData');prefs=path.join(user,'settings.json');try{settings={...settings,...JSON.parse(await fs.readFile(prefs,'utf8'))};}catch(e){if(e.code!=='ENOENT')dialog.showErrorBox('Settings could not be read','Your backups remain in '+user);}
  settings.repo='samimustafaa/bubble-builds-cd';
  engine=new BuildEngine(path.join(__dirname,'data'),user,gameStatus);updates=new Updates(autoUpdater,{packaged:app.isPackaged&&process.platform==='win32',onState:s=>send('update-state',s),canInstall:()=>!engine.busy});
  if(settings.repo)try{updates.configure(settings.repo);}catch{settings.repo='';}
  const workArea=screen.getPrimaryDisplay().workAreaSize;
  win=new BrowserWindow({width:Math.min(940,workArea.width),height:Math.min(850,workArea.height),resizable:false,maximizable:false,show:false,backgroundColor:'#101214',title:'Bubble Builds - sg0hann',icon:path.join(__dirname,'assets/app.png'),autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(e,url)=>{if(url!==page)e.preventDefault();});
  handle('state',state);handle('choose',async()=>{if(engine.busy||updates.busy)throw Error('Wait for the current operation.');const r=await dialog.showOpenDialog(win,{title:'Choose Creative Destruction',defaultPath:settings.folder||'C:\\Creative Destruction',properties:['openDirectory']});if(r.canceled)return state();settings.folder=await engine.root(r.filePaths[0]);await save();return state();});
  handle('apply',async(preset,animated=true)=>{if(updates.busy)throw Error('Wait for the app update.');if(typeof animated!=='boolean')throw Error('Choose a valid animation setting.');await engine.apply(settings.folder,preset,s=>send('progress',s),animated);settings.animations=animated;await save();return state();});
  handle('restore',async()=>{if(updates.busy)throw Error('Wait for the app update.');await engine.restore(settings.folder,s=>send('progress',s));return state();});
  handle('backups',async()=>{await fs.mkdir(path.join(user,'backups'),{recursive:true});const error=await shell.openPath(path.join(user,'backups'));if(error)throw Error(error);});
  handle('check',()=>updates.check().then(()=>null));handle('update',()=>updates.install());
  win.on('close',e=>{if(!updates.installing&&(engine.busy||updates.busy)){e.preventDefault();send('progress','Please wait for the current operation to finish.');}});
  win.once('ready-to-show',()=>win.show());await win.loadURL(page);setTimeout(()=>updates.check().catch(()=>{}),2500);
  const timer=setInterval(()=>{if(!updates.busy&&!engine.busy)updates.check().catch(()=>{});},1800000);timer.unref();
  let checking=false;const poll=setInterval(async()=>{if(checking||engine.busy||!settings.folder)return;checking=true;try{send('game-state',await gameStatus(settings.folder));}finally{checking=false;}},10000);poll.unref();
 });
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});app.on('window-all-closed',()=>app.quit());
}
