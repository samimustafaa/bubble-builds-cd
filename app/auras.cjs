'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),masks=require('./data/aura-masks.json');
const AURAS={blue:{name:'Electric Blue',color:[.12,.48,1]},cyan:{name:'Ice Cyan',color:[.12,.95,1]},gold:{name:'Saiyan Gold',color:[1,.76,.10]},orange:{name:'Fire Orange',color:[1,.30,.04]},violet:{name:'Violet',color:[.62,.22,1]},pink:{name:'Rose Pink',color:[1,.22,.58]},green:{name:'Emerald',color:[.10,1,.42]}};
const {PORTRAITS}=require('./portraits.cjs');
const AURA_PRESETS=Object.fromEntries(Object.entries(PORTRAITS).flatMap(([base,p])=>Object.entries(AURAS).map(([color,a])=>[base+'--aura-'+color,{...p,name:p.name+' — '+a.name+' aura',hidden:true,basePortrait:base,aura:color}])));
const cache=new Map(),alphaCache=new Map();
function auraMask(base){if(cache.has(base))return cache.get(base);const m=masks[base];if(!m)throw Error('Unknown aura portrait');const b=zlib.inflateSync(fs.readFileSync(path.join(__dirname,'data',m.file)),{maxOutputLength:m.bytes});if(b.length!==m.bytes||crypto.createHash('sha256').update(b).digest('hex')!==m.sha256)throw Error('Aura mask verification failed');cache.set(base,b);return b;}
function encodeAlpha(values,out,o){const hi=Math.max(...values),lo=Math.min(...values);out.fill(0,o,o+8);out[o]=hi;out[o+1]=lo;if(hi===lo)return;const palette=[hi,lo];for(let i=1;i<=6;i++)palette.push(((7-i)*hi+i*lo)/7);for(let i=0;i<16;i++){let best=0,error=Infinity;for(let c=0;c<8;c++){const d=Math.abs(values[i]-palette[c]);if(d<error){error=d;best=c;}}const bit=i*3,byte=bit>>3,shift=bit&7;out[o+2+byte]|=(best<<shift)&255;if(byte<5)out[o+3+byte]|=best>>(8-shift);}}
function auraTexture(printed,base){const key=base+':'+printed.readUInt32LE(16),cached=alphaCache.get(key);if(cached){if(cached.length!==printed.length)throw Error('Unexpected aura texture layout');const result=Buffer.from(printed);for(let o=128;o<result.length;o+=16)cached.copy(result,o,o,o+8);return stamp(result);}const mask=auraMask(base),meta=masks[base],out=Buffer.from(printed);let w=out.readUInt32LE(16),offset=128;for(let level=0;level<out.readUInt32LE(28);level++){const blocks=Math.ceil(w/4),m=meta.levels.find(l=>l.width===Math.min(w,512));if(!m)throw Error('Aura mip missing');for(let by=0;by<blocks;by++)for(let bx=0;bx<blocks;bx++){const values=[];for(let i=0;i<16;i++){const x=Math.min(m.width-1,Math.floor((bx*4+i%4)*m.width/w)),y=Math.min(m.width-1,Math.floor((by*4+(i>>2))*m.width/w));values.push(mask[m.offset+y*m.width+x]);}encodeAlpha(values,out,offset+(by*blocks+bx)*16);}offset+=blocks*blocks*16;w=Math.max(1,w>>1);}
 stamp(out);alphaCache.set(key,Buffer.from(out));return out;}
function stamp(out){
 // Hidden 8×8 signature. Its RGB is restored from the smooth base by the shader.
 const blocks=out.readUInt32LE(16)/4;for(let by=0;by<2;by++)for(let bx=0;bx<2;bx++){const o=128+(by*blocks+bx)*16;out.fill(0,o,o+16);out[o]=255;out[o+1]=255;out.writeUInt16LE(0xf81f,o+8);out.writeUInt16LE(0xf81f,o+10);}return out;}
function auraShader(source,id){const preset=AURA_PRESETS[id];if(!preset)return null;if(!/\bsampler2D\s+sam_diffuse\b/.test(source)||!/\bfloat\s+FrameTime\s*;/.test(source))throw Error('Supported aura shader bindings missing');const pbr=source.startsWith('//scene_cj_pbr'),uv=pbr?'psIN.v_texture0.xy':'psIN.uv0',color=AURAS[preset.aura].color.map(c=>c.toFixed(3)+'f').join(',');let s=source.replace(/(float4 ps_main\(PS_INPUT psIN\)[^{]*\{)/,'$1\nfloat4 sgAuraTag=tex2Dlod(sam_diffuse,float4(0.001953125f,0.001953125f,0.0f,0.0f));\nbool sgAuraActive=sgAuraTag.r>.98f&&sgAuraTag.g<.02f&&sgAuraTag.b>.98f&&sgAuraTag.a>.98f;\nfloat3 sgAuraBase=tex2Dlod(sam_diffuse,float4(.025f,.025f,0.0f,0.0f)).rgb;\n');let samples=0;s=s.replace(/float4\s+(\w+)\s*=\s*tex2D\(sam_diffuse\s*,[^;]+;/g,(match,name)=>{samples++;return match+`\nfloat sgAuraMask=${name}.a;\nif(sgAuraActive){${name}.a=1.0f;if(all(min(${uv},1.0f-${uv})<.02f))${name}.rgb=sgAuraBase;}\n`;});if(samples!==1)throw Error('Unsupported portrait aura diffuse read');return s.replace('return final_color;',`// Only outside-silhouette mask pixels receive animated aura color.
if(sgAuraActive){
 float2 sgAuraUV=${uv};
 float sgAuraOutside=1.0f-step(.5f,sgAuraMask);
 float sgAuraDistance=saturate(sgAuraMask*2.65625f)*sgAuraOutside;
 float sgAuraTime=FrameTime*1.8f;
 float sgAuraWave=.5f+.5f*sin(sgAuraUV.x*65.0f+sgAuraTime+sin(sgAuraUV.y*18.0f-sgAuraTime*2.0f)*2.0f);
 float sgAuraFlame=smoothstep(.15f+.30f*sgAuraWave,.55f+.30f*sgAuraWave,sgAuraDistance);
 float sgAuraIntensity=sgAuraDistance*(.25f+.75f*sgAuraFlame)*(.75f+.25f*sin(sgAuraUV.y*44.0f-sgAuraTime*5.0f))*.78f;
 float3 sgAuraColor=saturate(float3(${color})+pow(sgAuraDistance,6.0f)*.18f);
 final_color.rgb=lerp(final_color.rgb,sgAuraColor,sgAuraIntensity);
}
return final_color;`);}
module.exports={AURAS,AURA_PRESETS,auraMask,auraTexture,auraShader,encodeAlpha};
