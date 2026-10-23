'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const VIDEOS={'video-trunks':{name:'Trunks — Aura Loop',number:'18',quality:'video',static:true,motion:'8 fps · 21.25 s loop · experimental',preview:'assets/video-trunks.webp'}};
const SHARED_PATH='model_regular\\structure\\floor_003_color.dds';
function metadata(){return JSON.parse(fs.readFileSync(path.join(__dirname,'data/video-trunks.json'),'utf8'));}
let cached;
function videoTexture(id){if(!VIDEOS[id])throw Error('Unknown video preset');if(cached)return cached;const m=metadata(),b=zlib.inflateSync(fs.readFileSync(path.join(__dirname,'data/video-trunks.dds.z')),{maxOutputLength:m.bytes});if(b.length!==m.bytes||crypto.createHash('sha256').update(b).digest('hex')!==m.sha256||b.toString('ascii',84,88)!=='DXT5'||b.readUInt32LE(16)!==m.size||b.readUInt32LE(12)!==m.size)throw Error('Video atlas verification failed');cached=b;return b;}
function videoMaterial(original,nodes){const paths=new Set(nodes.filter(n=>['Tex0','difuse','diffuse_x'].includes(n.tag)).map(n=>n.attrs.Value?.value).filter(v=>typeof v==='string'&&/^model_regular\\structure(?:_jj)?\\.+\.dds$/i.test(v)));if(!paths.size)return null;const edits=[];for(const n of nodes)for(const [key,a]of Object.entries(n.attrs))if(a.type===1&&paths.has(a.value)&&a.value!==SHARED_PATH&&((key==='Value'&&['Tex0','difuse','diffuse_x'].includes(n.tag))||(key==='Path'&&n.tag==='File')))edits.push({start:a.start,end:a.end});if(!edits.length)return null;let out=Buffer.from(original);for(const e of edits.sort((a,b)=>b.start-a.start))out=Buffer.concat([out.subarray(0,e.start),Buffer.from(SHARED_PATH+'\0'),out.subarray(e.end)]);out.writeBigUInt64LE(original.readBigUInt64LE(4)+BigInt(out.length-original.length),4);return out;}
function videoFilm(id,pbr,animated=true){if(!VIDEOS[id])throw Error('Unknown video preset');const m=metadata();return `// Authored shared video atlas; ${m.frames} frames, ${m.fps} fps.
float4 sgVideoTag = tex2Dlod(sam_diffuse,float4(0.00048828125f,0.00048828125f,0.0f,0.0f));
float sgVideoFrame = fmod(floor(max(0.0f,FrameTime) * ${m.fps}.0f),${m.frames}.0f);
float2 sgVideoCell = float2(fmod(sgVideoFrame,${m.grid}.0f),floor(sgVideoFrame/${m.grid}.0f));
float2 sgVideoUV = (sgVideoCell * ${m.tile}.0f + ${m.inset}.5f + saturate(${pbr?'psIN.v_texture0.xy':'psIN.uv0'}) * ${m.content-1}.0f) / ${m.size}.0f;
float4 sgVideoColor = tex2Dlod(sam_diffuse,float4(sgVideoUV,0.0f,0.0f));
if(sgVideoTag.r > .98f && sgVideoTag.g < .02f && sgVideoTag.b > .98f && sgVideoTag.a > .98f) {
 final_color.rgb = sgVideoColor.rgb;
}
return final_color;`;}
module.exports={VIDEOS,SHARED_PATH,metadata,videoTexture,videoMaterial,videoFilm};
