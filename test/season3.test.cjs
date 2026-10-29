'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{importPack,validatePack}=require('../app/season3.cjs'),meta=require('../app/data/season3-source.json');
test('Season 3 import rejects missing, wrong-version and corrupt source files',()=>{
 assert.throws(()=>importPack([]),/both/);assert.throws(()=>importPack([Buffer.from('bad'),Buffer.from('bad')]),/verified/);assert.throws(()=>validatePack(null),/Import your/);assert.throws(()=>validatePack({version:'wrong'}),/Import your/);assert.throws(()=>validatePack({version:meta.version,archives:{}}),/incomplete/);
 const fake={version:meta.version,archives:Object.fromEntries(Object.entries(meta.archives).map(([n,a])=>[n,Object.fromEntries(Object.keys(a.resources).map(id=>[id,'AAAA']))]))};assert.throws(()=>validatePack(fake),/verification/);
});
test('Season 3 source allowlist contains six build assets and two build pixel shaders',()=>{assert.equal(Object.keys(meta.archives['model_regular.npk'].resources).length,6);assert.deepEqual(Object.keys(meta.archives['shader.npk'].resources).sort(),['3236391106','869076852']);});
