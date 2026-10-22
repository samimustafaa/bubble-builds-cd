'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assets=require('./data/portrait-assets.json');
const PORTRAITS={
 'portrait-dark':{name:'Dark Portrait — TEST',number:'10',motion:'Solid CD build · portrait print',quality:'portrait',static:true,preview:'assets/portrait-dark.png'},
 'portrait-warm':{name:'Warm Portrait — TEST',number:'11',motion:'Solid CD build · portrait print',quality:'portrait',static:true,preview:'assets/portrait-warm.png'},
 'portrait-smile':{name:'Smiling Portrait — TEST',number:'12',motion:'Solid CD build · portrait print',quality:'portrait',static:true,preview:'assets/portrait-smile.png'}
};
const cache=new Map();
function portraitTexture(id){
 if(!PORTRAITS[id])throw Error('Unknown portrait preset');if(cache.has(id))return cache.get(id);
 const meta=assets[id],data=zlib.inflateSync(fs.readFileSync(path.join(__dirname,'data',id+'.dds.z')),{maxOutputLength:meta.bytes});
 if(data.length!==meta.bytes||crypto.createHash('sha256').update(data).digest('hex')!==meta.sha256||data.toString('ascii',0,4)!=='DDS '||data.toString('ascii',84,88)!=='DXT5'||data.readUInt32LE(12)!==512||data.readUInt32LE(16)!==512||data.readUInt32LE(28)!==10)throw Error('Portrait texture verification failed');
 cache.set(id,data);return data;
}
module.exports={PORTRAITS,portraitTexture};
