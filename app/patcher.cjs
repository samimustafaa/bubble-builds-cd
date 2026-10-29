'use strict';
const {METALS,metalTexture}=require('./metals.cjs');
const {AURA_PRESETS,auraTexture,auraShader}=require('./auras.cjs');
const {VIDEOS,SHARED_PATH,videoTexture,videoMaterial,videoFilm}=require('./videos.cjs');
const {printPortrait,flatTexture}=require('./portrait-print.cjs');
const {remapPortraitMesh}=require('./portrait-mesh.cjs');
// Authored patch generator. Reads game files locally; no game archives are bundled.
const crypto=require('node:crypto'),zlib=require('node:zlib');
const {STYLES,surfaceFilm}=require('./styles.cjs');
const {PORTRAITS,portraitTexture}=require('./portraits.cjs');
const {TIMBERS,timberFilm}=require('./timber.cjs'),{tagMaterial}=require('./material-tag.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const rol=(n,s)=>(n<<s)|(n>>>(32-s));
function murmur(b){let h=0x9747b28c,n=b.length,i=0;for(;i+4<=n;i+=4){let k=b.readUInt32LE(i);k=Math.imul(k,0xcc9e2d51);k=rol(k,15);k=Math.imul(k,0x1b873593);h^=k;h=rol(h,13);h=(Math.imul(h,5)+0xe6546b64)|0;}let k=0;for(let j=i;j<n;j++)k|=b[j]<<((j-i)*8);if(i<n){k=Math.imul(k,0xcc9e2d51);k=rol(k,15);k=Math.imul(k,0x1b873593);h^=k;}h^=n;h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return h>>>0;}
function lz4(b,size){
 if(size<0||size>64*1024*1024)throw Error('Resource is too large.');const out=Buffer.alloc(size);let i=0,o=0;
 while(i<b.length){const token=b[i++];let count=token>>>4;if(count===15){let v;do{if(i>=b.length)throw Error('Truncated LZ4 literal');v=b[i++];count+=v;}while(v===255);}
  if(i+count>b.length||o+count>size)throw Error('Invalid LZ4 literal');b.copy(out,o,i,i+count);i+=count;o+=count;if(i===b.length)break;
  if(i+2>b.length)throw Error('Truncated LZ4 match');const offset=b.readUInt16LE(i);i+=2;if(!offset||offset>o)throw Error('Invalid LZ4 offset');count=(token&15)+4;if((token&15)===15){let v;do{if(i>=b.length)throw Error('Truncated LZ4 length');v=b[i++];count+=v;}while(v===255);}
  if(o+count>size)throw Error('LZ4 match overflow');for(let j=0;j<count;j++){out[o]=out[o-offset];o++;}
 }
 if(o!==size)throw Error('LZ4 size mismatch');return out;
}
function mask(b){const out=Buffer.from(b);for(let i=0;i<Math.min(128,out.length);i++)out[i]^=(i+254)&255;return out;}
function parseArchive(b){
 if(b.length<24||b.toString('ascii',0,4)!=='NXPK')throw Error('Unsupported archive');const count=b.readUInt32LE(4),index=b.readUInt32LE(20);if(!count||count>100000||index<24||index+count*28!==b.length)throw Error('Archive index is damaged');const entries=[];const ids=new Set();
 for(let i=0;i<count;i++){const e=Array.from({length:7},(_,j)=>b.readUInt32LE(index+i*28+j*4));if(ids.has(e[0])||e[1]<24||e[1]+e[2]>index)throw Error('Resource index is damaged');ids.add(e[0]);entries.push(e);}return {count,index,entries};
}
function decode(packed,e){
 if(murmur(packed)!==e[4])throw Error('Packed resource checksum mismatch');let b=packed;const enc=e[6]>>>16;if(enc===1)b=mask(b);else if(enc!==0)throw Error('Unsupported resource encoding');const mode=e[6]&65535;
 if(mode===2)b=lz4(b,e[3]);else if(mode===1)b=zlib.inflateSync(b,{maxOutputLength:e[3]});else if(mode!==0)throw Error('Unsupported compression');if(b.length!==e[3]||murmur(b)!==e[5])throw Error('Resource checksum mismatch');return b;
}
function parseBxml(b){
 if(b.length<12||b.readUInt32LE(0)!==0x0d4159c1)throw Error('Unsupported binary config');let i=12;
 const need=n=>{if(i+n>b.length)throw Error('Truncated binary config');};
 const varint=()=>{let n=0,s=0,c;do{need(1);c=b[i++];n|=(c&127)<<s;s+=7;if(s>28)throw Error('Invalid config index');}while(c&128);return n;};
 const text=()=>{const end=b.indexOf(0,i);if(end<0)throw Error('Truncated config string');const value=b.toString('utf8',i,end);i=end+1;return value;};
 const value=t=>{const start=i;let v;if(t===0)v=null;else if(t===1)v=text();else if(t===2||t===4){need(4);v=b.readInt32LE(i);i+=4;}else if(t===3){need(1);v=b[i++];}else if(t===5){need(4);v=b.readFloatLE(i);i+=4;}else if(t===6){need(4);const n=b.readUInt32LE(i);i+=4;need(n*4);v=Array.from({length:n},(_,j)=>b.readFloatLE(i+j*4));i+=n*4;}else if(t===7||t===8){need(8);v=b.readBigInt64LE(i);i+=8;}else throw Error('Unknown binary value type');return {value:v,type:t,start,end:i};};
 const tags=Array.from({length:varint()},text),attrs=Array.from({length:varint()},text);need(8);const tableMetadata=Buffer.from(b.subarray(i,i+8));i+=8;const count=varint();if(count>10000)throw Error('Too many config nodes');
 const nodes=Array.from({length:count},()=>({tag:tags[varint()],children:varint(),attrs:{}}));
 const attributeDataOffset=i;
 for(const node of nodes){const n=varint();for(let j=0;j<n;j++){const name=attrs[varint()];need(1);const t=b[i++];node.attrs[name]=value(t);}need(1);node.valueInfo=value(b[i++]);node.value=node.valueInfo.value;}
 if(i!==b.length)throw Error('Binary config contains extra bytes');Object.defineProperty(nodes,'tableMetadata',{value:tableMetadata});Object.defineProperty(nodes,'attributeDataOffset',{value:attributeDataOffset});return nodes;
}
function isBuildMaterial(b){return b.length>=4&&b.readUInt32LE(0)===0x0d4159c1&&b.includes(Buffer.from('MaterialGroup\0'))&&(b.includes(Buffer.from('model_regular\\structure\\'))||b.includes(Buffer.from('model_regular\\structure_jj\\')));}
function portraitTextureIds(original,parsed=parseArchive(original),decoded=new Map()){
 const entries=new Map(parsed.entries.map(e=>[e[0],e])),ids=new Set();
 const raw=e=>{if(!decoded.has(e[0]))decoded.set(e[0],decode(original.subarray(e[1],e[1]+e[2]),e));return decoded.get(e[0]);};
 for(const e of parsed.entries){const b=raw(e);if(!isBuildMaterial(b))continue;
  for(const n of parseBxml(b))if(['Tex0','difuse','diffuse_x'].includes(n.tag)){
   const ref=n.attrs.Value?.value;if(typeof ref!=='string'||!/^model_regular\\structure(?:_jj)?\\.+\.dds$/i.test(ref))throw Error('Unexpected build diffuse texture path');
   const relative=ref.replace(/^model_regular\\/i,'').toLowerCase(),id=murmur(Buffer.from(relative)),entry=entries.get(id);
   if(!entry||raw(entry).toString('ascii',0,4)!=='DDS ')throw Error('Build diffuse texture is missing: '+ref);ids.add(id);
  }
 }
 if(!ids.size)throw Error('No supported build diffuse textures found');return ids;
}
function patchMaterial(b,preset="bubble"){
 if(!isBuildMaterial(b)||PORTRAITS[preset]||METALS[preset])return null;
 if(TIMBERS[preset])return tagMaterial(b,parseBxml(b));
 const out=Buffer.from(b);let hit=false;for(const node of parseBxml(b)){
  if(node.tag==='RenderStates'&&node.attrs.AlphaVal){const a=node.attrs.AlphaVal;if(a.type!==2||a.value!==255)throw Error('Unexpected build alpha value');out.writeInt32LE(preset==='bubble'?245:255,a.start);hit=true;}
  if(preset==='bubble'&&['diffuse_color','u_bright_color'].includes(node.tag)){const a=node.attrs.Value;if(a?.type===6&&a.value.length===4)(preset==='bubble'?[.65,.85,1,1]:[...STYLES[preset].color,1]).forEach((v,j)=>out.writeFloatLE(v,a.start+4+j*4));}
 }return hit?out:null;
}
const PRESETS={bubble:{name:'Bubble Wrap — TEST 01',label:'Soft Pearl',scale:18,strength:0.025,number:'00',motion:'Original Soft Pearl · unchanged',quality:'original',preview:'assets/bubble-sample.png'},...STYLES,...TIMBERS,...PORTRAITS,...VIDEOS,...METALS,...AURA_PRESETS};
function film(preset){
 const style=preset==='bubble'?PRESETS.bubble:null;if(!style)throw Error('Choose a supported surface preset.');
 // Analytic dome lighting adds apparent depth without changing the build mesh.
 // No time or construction-stage input is assumed; the game's assembly stays intact.
 return `// sg0hann Bubble Wrap Test 01 / ${style.label}
float2 sgUV = local_0 * ${style.scale}.0f;
float sgRow = floor(sgUV.y);
sgUV.x += frac(sgRow * 0.5f);
float2 sgCell = frac(sgUV) - float2(0.5f, 0.5f);
float sgR2 = dot(sgCell, sgCell) / 0.1764f;
float sgMask = 1.0f - smoothstep(0.85f, 1.0f, sgR2);
float sgDome = sqrt(saturate(1.0f - sgR2));
float3 sgNormal = normalize(float3(sgCell / 0.42f, max(sgDome, 0.04f)));
float sgLight = saturate(dot(sgNormal, normalize(float3(-0.45f, -0.55f, 0.85f))));
float sgGlint = pow(saturate(dot(sgNormal, normalize(float3(-0.3f, -0.4f, 1.0f)))), 22.0f);
float sgShade = (sgLight - 0.55f) * sgMask;
float3 sgPearl = lerp(final_color.rgb, float3(0.68f, 0.83f, 0.94f), 0.48f);
final_color.rgb = saturate(sgPearl + sgShade * ${style.strength.toFixed(3)}f + sgGlint * sgMask * ${(style.strength*.75).toFixed(3)}f);
return final_color;`;
}
function patchShader(b,preset="bubble",animated=true){if(PORTRAITS[preset]||METALS[preset])return null;const s=b.toString('utf8');if(!(s.startsWith('//scene_cj\r')||s.startsWith('//scene_cj_pbr\r')||(AURA_PRESETS[preset]&&s.startsWith('//sfx_diffuse_g95_2\r')))||!s.includes('float4 ps_main(PS_INPUT psIN)'))return null;if(!s.includes('float2 local_0')||s.split('return final_color;').length!==2)throw Error('Unexpected build shader');if(AURA_PRESETS[preset])return Buffer.from(auraShader(s,preset));const timber=!!TIMBERS[preset];if(timber&&!/\bfloat\s+diffuse_instensty\s*;/.test(s))throw Error('Supported timber shader binding is missing');const output=s.replace('return final_color;',VIDEOS[preset]?videoFilm(preset,s.startsWith('//scene_cj_pbr'),animated):timber?timberFilm(preset,s.startsWith('//scene_cj_pbr')):preset==='bubble'?film(preset):surfaceFilm(preset,s.startsWith('//scene_cj_pbr'),animated));return Buffer.from(output);}
function portraitMeshPaths(original,parsed=parseArchive(original),decoded=new Map()){
 const paths=new Map(),ids=new Set(parsed.entries.map(e=>e[0]));
 for(const e of parsed.entries){const raw=decoded.get(e[0])||decode(original.subarray(e[1],e[1]+e[2]),e);decoded.set(e[0],raw);if(raw.length<4||raw.readUInt32LE(0)!==0x0d4159c1)continue;
 for(const node of parseBxml(raw)){const path=node.attrs.Path?.value;if(typeof path!=='string'||!/^model_regular\\structure(?:_jj)?\\.+\.mesh$/i.test(path))continue;const relative=path.slice('model_regular\\'.length).toLowerCase(),id=murmur(Buffer.from(relative));if(!ids.has(id))throw Error('Referenced portrait mesh is missing');paths.set(id,relative);}}
 return paths;
}
function portraitNormalIds(original,parsed=parseArchive(original),decoded=new Map()){
 const ids=new Set(),available=new Set(parsed.entries.map(e=>e[0]));for(const e of parsed.entries){const raw=decoded.get(e[0])||decode(original.subarray(e[1],e[1]+e[2]),e);decoded.set(e[0],raw);if(!isBuildMaterial(raw))continue;for(const n of parseBxml(raw)){if(n.tag!=='SamplerNormalMap')continue;const path=n.attrs.Value?.value;if(typeof path!=='string'||!/^model_regular\\structure(?:_jj)?\\.+\.dds$/i.test(path))throw Error('Unexpected portrait normal path');const id=murmur(Buffer.from(path.slice(14).toLowerCase()));if(!available.has(id))throw Error('Portrait normal texture missing');ids.add(id);}}return ids;
}
function patchArchive(original,name,info,preset="bubble",animated=true){
 if(sha(original)!==info.originalSha256)throw Error('Original archive version differs: '+name);const parsed=parseArchive(original),chunks=[original.subarray(0,parsed.index)];let length=parsed.index,changed=0;const semantic=crypto.createHash('sha256'),video=!!VIDEOS[preset],aura=AURA_PRESETS[preset],imagePreset=aura?.basePortrait||preset,portraitModel=(!!PORTRAITS[preset]||!!aura||video||!!METALS[preset])&&name==='model_regular.npk',decoded=new Map(),portraitIds=portraitModel?portraitTextureIds(original,parsed,decoded):null,meshPaths=portraitModel?portraitMeshPaths(original,parsed,decoded):null,normalIds=portraitModel?portraitNormalIds(original,parsed,decoded):null;
 const entries=parsed.entries.map(e=>[...e]);for(const e of entries){const packed=original.subarray(e[1],e[1]+e[2]),raw=decoded.get(e[0])||decode(packed,e);let next=null;
 if(portraitModel){if(METALS[preset]){next=portraitIds.has(e[0])?metalTexture(preset):normalIds.has(e[0])?flatTexture(raw,true):meshPaths.has(e[0])?remapPortraitMesh(raw,meshPaths.get(e[0])):null;}else if(video){if(e[0]===murmur(Buffer.from(SHARED_PATH.slice(14))))next=videoTexture(preset);else if(meshPaths.has(e[0]))next=remapPortraitMesh(raw,meshPaths.get(e[0]));else if(normalIds.has(e[0]))next=flatTexture(raw,true);else if(isBuildMaterial(raw)){next=videoMaterial(raw,parseBxml(raw));if(next)parseBxml(next);}}else next=portraitIds.has(e[0])?(aura?auraTexture(printPortrait(raw,portraitTexture(imagePreset)),imagePreset):printPortrait(raw,portraitTexture(preset))):normalIds.has(e[0])?flatTexture(raw,true):meshPaths.has(e[0])?remapPortraitMesh(raw,meshPaths.get(e[0]),true):null;}
 else next=name==='model_regular.npk'?patchMaterial(raw,preset):patchShader(raw,preset,animated);
 if(!next)continue;
  const encoded=mask(zlib.deflateSync(next,{level:6}));const padding=(4-length%4)%4;if(padding){chunks.push(Buffer.alloc(padding));length+=padding;}e[1]=length;e[2]=encoded.length;e[3]=next.length;e[4]=murmur(encoded);e[5]=murmur(next);e[6]=65537;if(!decode(encoded,e).equals(next))throw Error('Generated resource verification failed');semantic.update(e[0].toString(16).padStart(8,'0'));semantic.update(Buffer.from(sha(next),'hex'));chunks.push(encoded);length+=encoded.length;changed++;
 }
 if(changed!==(info.resourcesByPreset?.[preset]??info.resources))throw Error('Unexpected changed resource count for '+name);const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}const index=length,table=Buffer.alloc(entries.length*28);entries.forEach((e,i)=>e.forEach((v,j)=>table.writeUInt32LE(v,i*28+j*4)));chunks.push(table);const result=Buffer.concat(chunks);result.writeUInt32LE(index,20);parseArchive(result);const expected=info.semanticByPreset?.[preset+(animated?':animated':':still')]||info.semanticByPreset?.[preset]||info.semanticSha256;if(expected&&semantic.digest('hex')!==expected)throw Error('Generated resource content differs');return result;
}
const MOBILE={UseD3D9:'True',UseTextureAtlas:'False',OneLightOptimize:'True',HardwareInstancing:'False',GpuSkinningEnable:'False',ShaderInstancing:'False',GpuParticle:'False',PixelDecal:'False',EnableShadowMap:'False',SSshadow:'False',EnableCSM:'True',EnableDepthShadow:'True',VSync:'False',LoadSeparateAlphaFile:'False',UseClassifiedVertexPool:'True'};
function mobileConfig(original){
 if(!original)throw Error('Your original neox.xml is missing. Restore the game configuration before applying.');const nodes=parseBxml(original),edits=[];let required=new Set(['UseD3D9','HardwareInstancing','GpuSkinningEnable','ShaderInstancing']);
 for(const node of nodes)for(const [key,a]of Object.entries(node.attrs)){
  if(key in MOBILE){if(a.type!==1||!['true','false'].includes(String(a.value).toLowerCase()))continue;required.delete(key);const next=MOBILE[key];if(a.value!==next)edits.push({start:a.start,end:a.end,b:Buffer.from(next+'\0')});}
  if(key==='TextureSuffix'&&a.type===1&&a.value!=='.dds')edits.push({start:a.start,end:a.end,b:Buffer.from('.dds\0')});
 }
 if(required.size)throw Error('This neox.xml lacks the supported rendering settings');if(!edits.length)return Buffer.from(original);
 let out=Buffer.from(original);for(const e of edits.sort((a,b)=>b.start-a.start))out=Buffer.concat([out.subarray(0,e.start),e.b,out.subarray(e.end)]);out.writeBigUInt64LE(original.readBigUInt64LE(4)+BigInt(out.length-original.length),4);parseBxml(out);return out;
}
module.exports={PRESETS,film,isBuildMaterial,portraitTextureIds,portraitMeshPaths,murmur,lz4,mask,parseArchive,decode,parseBxml,patchMaterial,patchShader,patchArchive,mobileConfig,sha};
