'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),masks=require('./data/aura-masks.json');
const AURAS={blue:{name:'Electric Blue',color:[.12,.48,1]},cyan:{name:'Ice Cyan',color:[.12,.95,1]},gold:{name:'Saiyan Gold',color:[1,.76,.10]},orange:{name:'Fire Orange',color:[1,.42,.06]},violet:{name:'Violet',color:[.62,.22,1]},pink:{name:'Rose Pink',color:[1,.22,.58]},green:{name:'Emerald',color:[.10,1,.42]}};
const {PORTRAITS}=require('./portraits.cjs');
const AURA_PRESETS=Object.fromEntries(Object.entries(PORTRAITS).flatMap(([base,p])=>Object.entries(AURAS).map(([color,a])=>[base+'--aura-'+color,{...p,name:p.name+' — '+a.name+' aura',hidden:true,basePortrait:base,aura:color}])));
const cache=new Map();
const {layout,decodeBlock,encodeOpaqueBlock}=require('./portrait-print.cjs');
function auraMask(base){if(cache.has(base))return cache.get(base);const m=masks[base];if(!m)throw Error('Unknown aura portrait');const b=zlib.inflateSync(fs.readFileSync(path.join(__dirname,'data',m.file)),{maxOutputLength:m.bytes});if(b.length!==m.bytes||crypto.createHash('sha256').update(b).digest('hex')!==m.sha256)throw Error('Aura mask verification failed');cache.set(base,b);return b;}
const maskTextures=new Map();
function maskPixels(base,w){const meta=masks[base],m=meta.levels.find(l=>l.width===Math.min(w,512)),data=auraMask(base);if(!m)throw Error('Aura mip missing');return (x,y)=>data[m.offset+Math.min(m.width-1,Math.floor(y*m.width/w))*m.width+Math.min(m.width-1,Math.floor(x*m.width/w))];}
function maskBlocks(base,w){const key=base+':'+w;if(maskTextures.has(key))return maskTextures.get(key);const blocks=Math.ceil(w/4),out=Buffer.alloc(blocks*blocks*16),sample=maskPixels(base,w);for(let by=0;by<blocks;by++)for(let bx=0;bx<blocks;bx++){const pixels=new Uint8Array(64);for(let i=0;i<16;i++){const v=sample(Math.min(w-1,bx*4+i%4),Math.min(w-1,by*4+(i>>2)));pixels.set([v,v,v,255],i*4);}encodeOpaqueBlock(pixels,out,(by*blocks+bx)*16);}maskTextures.set(key,out);return out;}
function auraTexture(printed,base){const old=layout(printed),size=old[0].w,levels=[];let w=size*2,h=size,length=128;while(true){const blocks=Math.ceil(w/4),rows=Math.ceil(h/4),bytes=blocks*rows*16;levels.push({w,h,blocks,rows,offset:length,bytes});length+=bytes;if(w===1&&h===1)break;w=Math.max(1,w>>1);h=Math.max(1,h>>1);}const out=Buffer.alloc(length);printed.copy(out,0,0,128);out.writeUInt32LE(size*2,16);out.writeUInt32LE(levels.length,28);out.writeUInt32LE(levels[0].bytes,20);
 for(const level of levels){const image=old.find(l=>l.w===level.h);if(!image)throw Error('Portrait image mip missing');if(level.h>=4){const half=level.h/4,rowBytes=half*16,right=maskBlocks(base,level.h);for(let y=0;y<level.rows;y++){printed.copy(out,level.offset+y*level.blocks*16,image.o+y*rowBytes,image.o+(y+1)*rowBytes);right.copy(out,level.offset+y*level.blocks*16+rowBytes,y*rowBytes,(y+1)*rowBytes);}}else{const source=decodeBlock(printed,image.o),sample=maskPixels(base,level.h),pixels=new Uint8Array(64);for(let i=0;i<16;i++){const x=Math.min(level.w-1,i%4),y=Math.min(level.h-1,i>>2);if(x<level.h||level.w===1){const q=(y*4+Math.min(level.h-1,x))*4;pixels.set(source.subarray(q,q+3),i*4);}else{const v=sample(x-level.h,y);pixels.set([v,v,v],i*4);}pixels[i*4+3]=255;}encodeOpaqueBlock(pixels,out,level.offset);}}
 // The marker is in the MASK half; image RGB and opaque alpha are untouched.
 const blocks=levels[0].blocks,firstMaskBlock=size/4;for(let by=0;by<2;by++)for(let bx=0;bx<2;bx++){const o=128+(by*blocks+firstMaskBlock+bx)*16;out.fill(0,o,o+16);out[o]=255;out[o+1]=255;out.writeUInt16LE(0xf81f,o+8);out.writeUInt16LE(0xf81f,o+10);}return out;}
function auraShader(source,id){const preset=AURA_PRESETS[id];if(!preset)return null;const sfx=source.startsWith('//sfx_diffuse_g95_2'),sampler=sfx?'sam_other0':'sam_diffuse',pbr=source.startsWith('//scene_cj_pbr'),uv=pbr||sfx?'psIN.v_texture0.xy':'psIN.uv0',color=AURAS[preset.aura].color.map(c=>c.toFixed(3)+'f').join(',');if(!new RegExp('\\bsampler2D\\s+'+sampler+'\\b').test(source))throw Error('Supported aura shader bindings missing');if(sfx&&!/\bfloat\s+FrameTime\s*;/.test(source))source=source.replace(/(\/\/[^\r\n]+[\r\n]+)/,'$1float FrameTime;\n');if(!/\bfloat\s+FrameTime\s*;/.test(source))throw Error('Supported aura shader bindings missing');
 let s=source.replace(/(float4 ps_main\(PS_INPUT psIN\)[^{]*\{)/,`$1\nfloat4 sgAuraTag=tex2Dlod(${sampler},float4(.501953125f,.001953125f,0.0f,0.0f));\nbool sgAuraActive=sgAuraTag.r>.98f&&sgAuraTag.g<.02f&&sgAuraTag.b>.98f&&sgAuraTag.a>.98f;\nfloat2 sgAuraUV=saturate(${uv});\nfloat2 sgAuraSafeUV=clamp(sgAuraUV,float2(.001f,.001f),float2(.999f,.999f));\nfloat4 sgAuraImage=tex2Dlod(${sampler},float4(sgAuraSafeUV*float2(.5f,1.0f),0.0f,0.0f));\nfloat sgAuraMask=tex2Dlod(${sampler},float4(float2(.5f+sgAuraSafeUV.x*.5f,sgAuraSafeUV.y),0.0f,0.0f)).r;\n`);let samples=0;const pattern=new RegExp('float4\\s+(\\w+)\\s*=\\s*tex2D\\('+sampler+'\\s*,[^;]+;','g');s=s.replace(pattern,(match,name)=>{samples++;return match+`\nif(sgAuraActive)${name}=sgAuraImage;\n`;});if(samples!==1)throw Error('Unsupported portrait aura diffuse read');return s.replace('return final_color;',`// Opaque portrait/base shading is retained; only the separate outside mask glows.
if(sgAuraActive){
 float sgAuraOutside=1.0f-smoothstep(.42f,.50f,sgAuraMask);
 float sgAuraDistance=saturate(sgAuraMask*2.65625f)*sgAuraOutside;
 float sgAuraTime=FrameTime*1.35f;
 float sgAuraWave=.5f+.5f*sin(sgAuraUV.x*46.0f+sin(sgAuraUV.y*17.0f-sgAuraTime*2.1f)*1.8f-sgAuraTime);
 float sgAuraFine=.5f+.5f*sin(sgAuraUV.x*91.0f-sgAuraUV.y*31.0f+sgAuraTime*4.0f);
 float sgAuraFlame=smoothstep(.12f+.26f*sgAuraWave,.58f+.22f*sgAuraFine,sgAuraDistance);
 float sgAuraCore=smoothstep(.72f,.99f,sgAuraDistance);
 float sgAuraPulse=.86f+.14f*sin(sgAuraUV.y*39.0f-sgAuraTime*4.3f);
 float3 sgAuraColor=float3(${color});
 float sgAuraVeil=sgAuraDistance*(.10f+.28f*sgAuraFlame)*sgAuraPulse;
 float3 sgAuraEmission=sgAuraColor*sgAuraFlame*.68f*sgAuraPulse+lerp(sgAuraColor,float3(1.0f,1.0f,1.0f),.70f)*sgAuraCore*.36f;
 final_color.rgb=saturate(lerp(final_color.rgb,sgAuraColor,sgAuraVeil)+sgAuraEmission);
}
return final_color;`);}
module.exports={AURAS,AURA_PRESETS,auraMask,auraTexture,auraShader};
