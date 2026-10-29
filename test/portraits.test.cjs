'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),p=require('../app/patcher.cjs'),{PORTRAITS,portraitTexture}=require('../app/portraits.cjs');
function buildMaterial(ref='model_regular\\structure\\wall.dds'){
 const tags=['NeoX','MaterialGroup','File','ParamTable','Tex0'],attrs=['Path','Value'],table=Buffer.concat([Buffer.from([5]),...tags.map(x=>Buffer.from(x+'\0')),Buffer.from([2]),...attrs.map(x=>Buffer.from(x+'\0'))]);
 const descriptors=Buffer.from([5,0,1,1,2,2,0,3,1,4,0]),offset=Buffer.alloc(8);offset.writeBigUInt64LE(BigInt(table.length+8+descriptors.length));
 const body=Buffer.concat([Buffer.from([0,1,0,0,1,0,1,0,1]),Buffer.from('model_regular\\structure\\wall.dds\0'),Buffer.from([1,0,0,1,0,1,1,1]),Buffer.from(ref+'\0'),Buffer.from([1,0])]);
 const header=Buffer.alloc(12);header.writeUInt32LE(0x0d4159c1);const out=Buffer.concat([header,table,offset,descriptors,body]);out.writeBigUInt64LE(BigInt(out.length),4);return out;
}
function archive(items){let offset=24;const data=[],entries=[];for(const [id,raw]of items){entries.push([id,offset,raw.length,raw.length,p.murmur(raw),p.murmur(raw),0]);data.push(raw);offset+=raw.length;}const head=Buffer.alloc(24);head.write('NXPK');head.writeUInt32LE(items.length,4);head.writeUInt32LE(offset,20);const table=Buffer.alloc(items.length*28);entries.forEach((e,i)=>e.forEach((v,j)=>table.writeUInt32LE(v,i*28+j*4)));return Buffer.concat([head,...data,table]);}
function rawEntries(b){return new Map(p.parseArchive(b).entries.map(e=>[e[0],p.decode(b.subarray(e[1],e[1]+e[2]),e)]));}
test('portrait DDS assets retain BC3 alpha, signature and a complete mip chain',()=>{
 assert.equal(Object.keys(PORTRAITS).length,6);const unique=new Set();for(const id of Object.keys(PORTRAITS)){
  const b=portraitTexture(id);unique.add(p.sha(b));assert.equal(b.toString('ascii',84,88),'DXT5');assert.equal(b.readUInt32LE(28),10);let size=128;for(let w=512;w>=1;w>>=1)size+=Math.ceil(w/4)**2*16;assert.equal(b.length,size);
  const block=b.subarray(128,144);assert.equal(block[0],0);assert.equal(block[1],0);const colors=[block.readUInt16LE(8),block.readUInt16LE(10)],index=block.readUInt32LE(12)&3;assert(index<2);const c=colors[index];assert.equal(c&31,31);assert.equal((c>>>11)&31,31);assert.equal((c>>>5)&63,0);
  const top=b.subarray(128,128+512*512);let opaque=false;for(let i=0;i<top.length;i+=16)if(top[i]===255||top[i+1]===255){opaque=true;break;}assert(opaque,'Portrait must contain visible pixels');
 }assert.equal(unique.size,6);
});
test('portrait replacement changes only referenced diffuse DDS entries, preserving materials and other textures',()=>{
 const id=p.murmur(Buffer.from('structure\\wall.dds')),material=buildMaterial(),original=archive([[1,material],[id,portraitTexture('portrait-warm')],[3,Buffer.from('DDS unrelated normal fixture')],[4,Buffer.from('unrelated geometry fixture')]]),meta={originalSha256:p.sha(original),resources:318,resourcesByPreset:{'portrait-dark':1}};
 assert.deepEqual([...p.portraitTextureIds(original)],[id]);const next=p.patchArchive(original,'model_regular.npk',meta,'portrait-dark'),entries=rawEntries(next),before=rawEntries(original);assert.deepEqual(entries.get(id),require('../app/portrait-print.cjs').printPortrait(portraitTexture('portrait-warm'),portraitTexture('portrait-dark')));for(const key of [1,3,4])assert.deepEqual(entries.get(key),before.get(key));assert.equal(p.patchMaterial(material,'portrait-dark'),null);
});
test('portrait paths fail closed when diffuse resources are missing or point outside builds',()=>{
 const id=p.murmur(Buffer.from('structure\\wall.dds'));assert.throws(()=>p.portraitTextureIds(archive([[1,buildMaterial()]])),/missing/);assert.throws(()=>p.portraitTextureIds(archive([[1,buildMaterial('model_regular\\character\\face.dds')],[id,portraitTexture('portrait-warm')]])),/Unexpected/);
});
test('solid portrait presets retain the original build shaders',()=>{
 for(const id of Object.keys(PORTRAITS))assert.equal(p.patchShader(Buffer.from('//scene_cj\r\nfloat4 ps_main(PS_INPUT psIN) { float2 local_0; return final_color; }'),id),null);
});

test('Season 3 imports retain original geometry, UVs, materials and shaders except verified replacement IDs',()=>{
 const id=p.murmur(Buffer.from('structure\\wall.dds')),material=buildMaterial(),replacement=Buffer.from('imported fixture texture'),original=archive([[1,material],[id,portraitTexture('portrait-warm')],[3,Buffer.from('original geometry UV and collision')]]),meta={originalSha256:p.sha(original),resourcesByPreset:{season3metal:1}},pack={'model_regular.npk':new Map([[id,replacement]])};
 assert.throws(()=>p.patchArchive(original,'model_regular.npk',meta,'season3metal'),/Import your/);
 const entries=rawEntries(p.patchArchive(original,'model_regular.npk',meta,'season3metal',true,pack));assert.deepEqual(entries.get(id),replacement);assert.deepEqual(entries.get(1),material);assert.deepEqual(entries.get(3),rawEntries(original).get(3));
 assert.equal(p.patchMaterial(material,'season3metal'),null);assert.equal(p.patchShader(Buffer.from('//scene_cj\r\nfloat4 ps_main(PS_INPUT psIN) { float2 local_0; return final_color; }'),'season3metal'),null);
});
