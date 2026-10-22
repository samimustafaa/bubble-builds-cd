'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),assets=require('./data/portrait-assets.json');
const PORTRAITS={
 'portrait-dark':{name:'Dark Portrait — TEST',number:'10',motion:'Transparent portrait · fixed image',quality:'portrait',static:true,preview:'assets/portrait-dark.png'},
 'portrait-warm':{name:'Warm Portrait — TEST',number:'11',motion:'Transparent portrait · fixed image',quality:'portrait',static:true,preview:'assets/portrait-warm.png'},
 'portrait-smile':{name:'Smiling Portrait — TEST',number:'12',motion:'Transparent portrait · fixed image',quality:'portrait',static:true,preview:'assets/portrait-smile.png'}
};
const cache=new Map();
function portraitTexture(id){
 if(!PORTRAITS[id])throw Error('Unknown portrait preset');if(cache.has(id))return cache.get(id);
 const meta=assets[id],data=zlib.inflateSync(fs.readFileSync(path.join(__dirname,'data',id+'.dds.z')),{maxOutputLength:meta.bytes});
 if(data.length!==meta.bytes||crypto.createHash('sha256').update(data).digest('hex')!==meta.sha256||data.toString('ascii',0,4)!=='DDS '||data.toString('ascii',84,88)!=='DXT5'||data.readUInt32LE(12)!==512||data.readUInt32LE(16)!==512||data.readUInt32LE(28)!==10)throw Error('Portrait texture verification failed');
 cache.set(id,data);return data;
}
function portraitFilm(id,pbr){if(!PORTRAITS[id])throw Error('Unknown portrait preset');return `// sg0hann portrait cutout: ${id}
// This hidden texture signature identifies only the authored portrait diffuse maps.
// Reuses the existing sampler; no custom material uniform needs engine binding.
float4 sgPortraitTag = tex2Dlod(sam_diffuse, float4(0.00390625f, 0.00390625f, 0.0f, 0.0f));
float2 sgPortraitUV = ${pbr?'psIN.v_texture0.xy':'psIN.uv0'};
float4 sgPortrait = tex2D(sam_diffuse, saturate(sgPortraitUV));
if (sgPortraitTag.r > 0.98f && sgPortraitTag.g < 0.02f && sgPortraitTag.b > 0.98f && sgPortraitTag.a < 0.02f) {
 // Do not wrap UVs with frac: texture coordinates outside the single image are discarded.
 clip(min(min(sgPortraitUV.x,sgPortraitUV.y),min(1.0f-sgPortraitUV.x,1.0f-sgPortraitUV.y)));
 clip(sgPortrait.a - 0.05f);
 final_color.rgb = sgPortrait.rgb;
 final_color.a = min(final_color.a,sgPortrait.a);
}
return final_color;`;}
module.exports={PORTRAITS,portraitTexture,portraitFilm};
