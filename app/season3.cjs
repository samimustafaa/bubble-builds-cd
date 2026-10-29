'use strict';
const crypto=require('node:crypto'),meta=require('./data/season3-source.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function validatePack(pack){
 if(!pack||pack.version!==meta.version)throw Error('Import your 3.0.108 model and shader files first.');
 const result={};for(const [name,a]of Object.entries(meta.archives)){
  const resources=pack.archives?.[name];if(!resources||Object.keys(resources).length!==Object.keys(a.resources).length)throw Error('Season 3 import is incomplete. Import both files again.');result[name]=new Map();
  for(const [id,info]of Object.entries(a.resources)){const text=resources[id];if(typeof text!=='string'||text.length>Math.ceil(info.bytes/3)*4)throw Error('Invalid Season 3 resource');const b=Buffer.from(text,'base64');if(b.length!==info.bytes||sha(b)!==info.sha256)throw Error('Season 3 import failed verification. Import both files again.');result[name].set(Number(id),b);}
 }return result;
}
function importPack(buffers){
 const {parseArchive,decode}=require('./patcher.cjs'),pack={version:meta.version,archives:{}};if(buffers.length!==2)throw Error('Select both 3.0.108 NPK files.');
 for(const [name,a]of Object.entries(meta.archives)){
  const b=buffers.find(b=>b.length===a.bytes&&sha(b)===a.sha256);if(!b)throw Error('These are not the verified 3.0.108 model and shader files.');const entries=parseArchive(b).entries;pack.archives[name]={};
  for(const id of Object.keys(a.resources)){const e=entries.find(e=>String(e[0])===id);if(!e)throw Error('Season 3 resource is missing');pack.archives[name][id]=decode(b.subarray(e[1],e[1]+e[2]),e).toString('base64');}
 }validatePack(pack);return pack;
}
module.exports={importPack,validatePack};
