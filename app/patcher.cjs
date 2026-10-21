'use strict';
// Authored patch generator. Reads game files locally; no game archives are bundled.
const crypto=require('node:crypto'),zlib=require('node:zlib');
const {STYLES,surfaceFilm}=require('./styles.cjs');
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
 const tags=Array.from({length:varint()},text),attrs=Array.from({length:varint()},text);need(8);i+=8;const count=varint();if(count>10000)throw Error('Too many config nodes');
 const nodes=Array.from({length:count},()=>({tag:tags[varint()],children:varint(),attrs:{}}));
 for(const node of nodes){const n=varint();for(let j=0;j<n;j++){const name=attrs[varint()];need(1);const t=b[i++];node.attrs[name]=value(t);}need(1);node.value=value(b[i++]).value;}
 if(i!==b.length)throw Error('Binary config contains extra bytes');return nodes;
}
function patchMaterial(b,preset="bubble"){
 if(b.length<4||b.readUInt32LE(0)!==0x0d4159c1||!b.includes(Buffer.from('MaterialGroup\0'))||!(b.includes(Buffer.from('model_regular\\structure\\'))||b.includes(Buffer.from('model_regular\\structure_jj\\'))))return null;
 const out=Buffer.from(b);let hit=false;for(const node of parseBxml(b)){
  if(node.tag==='RenderStates'&&node.attrs.AlphaVal){const a=node.attrs.AlphaVal;if(a.type!==2||a.value!==255)throw Error('Unexpected build alpha value');out.writeInt32LE(preset==='bubble'?245:255,a.start);hit=true;}
  if(['diffuse_color','u_bright_color'].includes(node.tag)){const a=node.attrs.Value;if(a?.type===6&&a.value.length===4)(preset==='bubble'?[.65,.85,1,1]:[...STYLES[preset].color,1]).forEach((v,j)=>out.writeFloatLE(v,a.start+4+j*4));}
 }return hit?out:null;
}
const PRESETS={bubble:{name:'Bubble Wrap — TEST 01',label:'Soft Pearl',scale:18,strength:0.025},...STYLES};
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
function patchShader(b,preset="bubble",animated=true){const s=b.toString('utf8');if(!(s.startsWith('//scene_cj\r')||s.startsWith('//scene_cj_pbr\r'))||!s.includes('float4 ps_main(PS_INPUT psIN)'))return null;if(!s.includes('float2 local_0')||s.split('return final_color;').length!==2)throw Error('Unexpected build shader');return Buffer.from(s.replace('return final_color;',preset==='bubble'?film(preset):surfaceFilm(preset,s.startsWith('//scene_cj_pbr'),animated)));}
function patchArchive(original,name,info,preset="bubble",animated=true){
 if(sha(original)!==info.originalSha256)throw Error('Original archive version differs: '+name);const parsed=parseArchive(original),chunks=[original.subarray(0,parsed.index)];let length=parsed.index,changed=0;const semantic=crypto.createHash('sha256');
 const entries=parsed.entries.map(e=>[...e]);for(const e of entries){const packed=original.subarray(e[1],e[1]+e[2]),raw=decode(packed,e),next=name==='model_regular.npk'?patchMaterial(raw,preset):patchShader(raw,preset,animated);if(!next)continue;
  const encoded=mask(zlib.deflateSync(next,{level:6}));const padding=(4-length%4)%4;if(padding){chunks.push(Buffer.alloc(padding));length+=padding;}e[1]=length;e[2]=encoded.length;e[3]=next.length;e[4]=murmur(encoded);e[5]=murmur(next);e[6]=65537;if(!decode(encoded,e).equals(next))throw Error('Generated resource verification failed');semantic.update(e[0].toString(16).padStart(8,'0'));semantic.update(Buffer.from(sha(next),'hex'));chunks.push(encoded);length+=encoded.length;changed++;
 }
 if(changed!==info.resources)throw Error('Unexpected changed resource count for '+name);const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}const index=length,table=Buffer.alloc(entries.length*28);entries.forEach((e,i)=>e.forEach((v,j)=>table.writeUInt32LE(v,i*28+j*4)));chunks.push(table);const result=Buffer.concat(chunks);result.writeUInt32LE(index,20);parseArchive(result);const expected=info.semanticByPreset?.[preset+(animated?':animated':':still')]||info.semanticByPreset?.[preset]||info.semanticSha256;if(expected&&semantic.digest('hex')!==expected)throw Error('Generated resource content differs');return result;
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
module.exports={PRESETS,film,murmur,lz4,mask,parseArchive,decode,parseBxml,patchMaterial,patchShader,patchArchive,mobileConfig,sha};
