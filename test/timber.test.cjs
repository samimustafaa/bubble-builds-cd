'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),p=require('../app/patcher.cjs'),{tagMaterial}=require('../app/material-tag.cjs'),{TIMBERS,timberFilm}=require('../app/timber.cjs'),{sample}=require('../tools/render-timber-samples.cjs');
function material(parameter='rough_multi',type=5){
 const tags=['NeoX','MaterialGroup','File','ParamTable',parameter],attrs=['Path','Value'],tables=Buffer.concat([Buffer.from([tags.length]),...tags.map(x=>Buffer.from(x+'\0')),Buffer.from([attrs.length]),...attrs.map(x=>Buffer.from(x+'\0'))]);
 const descriptors=Buffer.from([5,0,1,1,2,2,0,3,1,4,0]),offset=Buffer.alloc(8);offset.writeBigUInt64LE(BigInt(tables.length+8+descriptors.length));
 const val=Buffer.alloc(4);if(type===2)val.writeInt32LE(1);else val.writeFloatLE(.65);const body=Buffer.concat([Buffer.from([0,1,0,0,1,0,1,0,1]),Buffer.from('model_regular\\structure\\wall.dds\0'),Buffer.from([1,0,0,1,0,1,1,type]),val,Buffer.from([1,0])]);
 const header=Buffer.alloc(12);header.writeUInt32LE(0x0d4159c1);const raw=Buffer.concat([header,tables,offset,descriptors,body]);raw.writeBigUInt64LE(BigInt(raw.length),4);return raw;
}
test('structure-only material tagging preserves typed values, hierarchy and BXML offsets',()=>{
 const raw=material(),before=p.parseBxml(raw),next=p.patchMaterial(raw,'timberpine'),after=p.parseBxml(next);
 assert(next);assert.equal(after.length,before.length+1);assert.equal(after.tableMetadata.readBigUInt64LE(),BigInt(after.attributeDataOffset-12));assert.equal(next.readBigUInt64LE(4),BigInt(next.length));assert.equal(after.find(n=>n.tag==='ParamTable').children,2);
 assert.equal(after.find(n=>n.tag==='rough_multi').attrs.Value.value,before.find(n=>n.tag==='rough_multi').attrs.Value.value);
 assert.equal(after.find(n=>n.tag==='File').attrs.Path.value,before.find(n=>n.tag==='File').attrs.Path.value);
 assert(Math.abs(after.find(n=>n.tag==='diffuse_instensty').attrs.Value.value-.73125)<1e-6);assert.throws(()=>tagMaterial(next,after),/already tagged/);
 assert.equal(p.patchMaterial(Buffer.from('unrelated resource'),'timberpine'),null);
});
test('wood tests have permanent cutouts, retain edge frames and are scoped to structure tags',()=>{
 assert.equal(Object.keys(TIMBERS).length,4);const counts=[];
 for(const id of Object.keys(TIMBERS)){
  for(const pbr of [true,false]){const shader=timberFilm(id,pbr);assert(shader.includes('abs(diffuse_instensty - 0.73125f)'));assert(shader.includes('clip('));assert(!shader.includes('FrameTime'));assert(!shader.includes('rongjiezhi'));assert(!shader.includes('final_color.a ='));}
  let gaps=0;for(let y=0;y<180;y++)for(let x=0;x<180;x++){const value=sample(id,(x+.5)/180,(y+.5)/180);assert(value.every(Number.isFinite));if(!value[3])gaps++;}
  const fraction=gaps/(180*180);assert(fraction>.025&&fraction<.24);counts.push(gaps);for(const [u,v]of [[0,.4],[1,.4],[.4,0],[.4,1]])assert.equal(sample(id,u,v)[3],1);
 }
 assert.equal(new Set(counts).size,4);
});

test('existing numeric engine parameters are replaced without adding duplicate bindings',()=>{
 for(const type of [2,5]){
  const raw=material('diffuse_instensty',type),before=p.parseBxml(raw),next=p.patchMaterial(raw,'timberpine'),after=p.parseBxml(next);
  assert.equal(after.length,before.length);assert.equal(after.find(n=>n.tag==='ParamTable').children,1);
  const bindings=after.filter(n=>n.tag==='diffuse_instensty');assert.equal(bindings.length,1);assert.equal(bindings[0].attrs.Value.type,5);assert(Math.abs(bindings[0].attrs.Value.value-.73125)<1e-6);
  assert.equal(after.tableMetadata.readBigUInt64LE(),BigInt(after.attributeDataOffset-12));
 }
});
test('wood shaders reuse a declared engine binding and reject missing bindings',()=>{
 for(const prefix of ['scene_cj','scene_cj_pbr']){
  const raw=Buffer.from('//'+prefix+'\r\nfloat diffuse_instensty;\nfloat4 ps_main(PS_INPUT psIN) { float2 local_0; return final_color; }');
  const next=p.patchShader(raw,'timberpine').toString();assert(!next.includes('sgBuildVariant'));assert.equal(next.split('float diffuse_instensty;').length,2);assert(next.includes('abs(diffuse_instensty - 0.73125f)'));
  assert.throws(()=>p.patchShader(Buffer.from(raw.toString().replace('float diffuse_instensty;','')),'timberpine'),/binding is missing/);
 }
});
