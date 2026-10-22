'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{meshLayout,remapPortraitMesh}=require('../app/portrait-mesh.cjs');
function mesh(points,tangent=1){const n=points.length,triangles=2,uv=38+n*24+tangent*n*12+triangles*6,b=Buffer.alloc(uv+n*16+24,0);b.writeUInt32LE(0xbbc88034);for(const o of [16,28])b.writeUInt32LE(n,o);for(const o of [20,32])b.writeUInt32LE(triangles,o);b.writeUInt16LE(2,24);b.writeUInt16LE(1,26);points.forEach((p,i)=>p.forEach((v,a)=>b.writeFloatLE(v,36+i*12+a*4)));b.writeUInt16LE(tangent,36+n*24);for(let i=0;i<n;i++){b.writeFloatLE(i%2,uv+i*8);b.writeFloatLE(.5,uv+i*8+4);b.writeFloatLE(.7,uv+n*8+i*8);}return b;}
function coords(b){const {vertices,uv}=meshLayout(b);return Array.from({length:vertices},(_,i)=>[b.readFloatLE(uv+i*8),b.readFloatLE(uv+i*8+4)]);}
test('whole-wall projection joins separate plank vertices and preserves every non-diffuse-UV byte',()=>{
 const b=mesh([[-25,0,0],[0,0,0],[0,35,0],[25,35,0],[0,35,0]],0),{uv,vertices}=meshLayout(b),out=remapPortraitMesh(b,'structure/wall.mesh');assert.deepEqual(coords(out),[[0,1],[.5,1],[.5,0],[1,0],[.5,0]]);assert.deepEqual(out.subarray(0,uv),b.subarray(0,uv));assert.deepEqual(out.subarray(uv+vertices*8),b.subarray(uv+vertices*8));assert.notDeepEqual(out,b);
});
test('ramps use a continuous depth projection with the head at the elevated end',()=>{
 for(const sign of [-1,1]){const b=mesh([[-25,0,-25*sign],[25,0,-25*sign],[-25,35,25*sign],[25,35,25*sign]]),out=remapPortraitMesh(b,'structure/upstair.mesh');assert.deepEqual(coords(out),[[0,1],[1,1],[0,0],[1,0]]);}
 const b=mesh([[-25,0,-25],[25,0,-25],[-25,0,25],[25,0,25]]);assert.deepEqual(coords(remapPortraitMesh(b,'structure/floor.mesh')),[[0,1],[1,1],[0,0],[1,0]]);
});
test('unknown or truncated mesh layouts fail before patching',()=>{const b=mesh([[-1,0,0],[1,1,1],[-1,1,1]]);assert.throws(()=>meshLayout(b.subarray(0,50)),/Truncated/);const bad=Buffer.from(b);bad.writeUInt16LE(3,24);assert.throws(()=>meshLayout(bad),/Unsupported/);});
