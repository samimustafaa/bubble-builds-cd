'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assets=require('./data/metal-assets.json');
const METALS={season3metal:{name:'Season 3 Metal — Inspired',number:'17',motion:'Silver panels · dark seams · baked bevels',quality:'metal',static:true,preview:'assets/season3metal-sample.png'}};
let cached;
function metalTexture(id){
 if(!METALS[id])throw Error('Unknown metal preset');if(cached)return cached;
 const meta=assets[id],raw=zlib.inflateSync(fs.readFileSync(path.join(__dirname,'data',id+'.dds.z')),{maxOutputLength:meta.bytes});
 if(raw.length!==meta.bytes||crypto.createHash('sha256').update(raw).digest('hex')!==meta.sha256||raw.toString('ascii',0,4)!=='DDS '||raw.toString('ascii',84,88)!=='DXT5'||raw.readUInt32LE(12)!==512||raw.readUInt32LE(16)!==512||raw.readUInt32LE(28)!==10)throw Error('Metal texture verification failed');
 cached=raw;return raw;
}
module.exports={METALS,metalTexture};
