'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{printPortrait,decodeBlock,layout}=require('../app/portrait-print.cjs'),{portraitTexture}=require('../app/portraits.cjs');
function solidDDS(color,alpha){const b=Buffer.from(portraitTexture('portrait-dark'));for(const l of layout(b))for(let o=l.o;o<l.o+l.blocks*l.blocks*16;o+=16){b.fill(0,o,o+16);b[o]=alpha;b[o+1]=alpha;b.writeUInt16LE(color,o+8);b.writeUInt16LE(color,o+10);}return b;}
test('portrait print preserves CD color outside the person and removes texture transparency at every mip',()=>{
 const original=solidDDS(31,255),portrait=solidDDS(63488,0),top=layout(portrait)[0];portrait[top.o+16]=255;portrait[top.o+17]=255;portrait[top.o+32]=128;portrait[top.o+33]=128;const out=printPortrait(original,portrait);
 assert.deepEqual(out.subarray(top.o+8,top.o+16),original.subarray(top.o+8,top.o+16));assert.deepEqual([...decodeBlock(out,top.o).subarray(0,4)],[0,0,255,255]);const foreground=decodeBlock(out,top.o+16);assert(foreground[0]>240&&foreground[2]<15);const edge=decodeBlock(out,top.o+32);assert(Math.abs(edge[0]-128)<10&&Math.abs(edge[2]-127)<10);for(const l of layout(out))for(let o=l.o;o<l.o+l.blocks*l.blocks*16;o+=16){assert.equal(out[o],255);assert.equal(out[o+1],255);}assert.deepEqual(out.subarray(0,128),original.subarray(0,128));
});
test('portrait compositing rejects unsupported or incomplete DDS inputs',()=>{assert.throws(()=>printPortrait(Buffer.alloc(128),portraitTexture('portrait-dark')),/Unsupported/);assert.throws(()=>printPortrait(portraitTexture('portrait-dark').subarray(0,200),portraitTexture('portrait-dark')),/Truncated/);});
test('smooth portraits erase surface pattern and flatten embossed normal detail',()=>{
 const {flatTexture}=require('../app/portrait-print.cjs'),source=solidDDS(31,255),l=layout(source)[0];source.writeUInt16LE(63488,l.o+8);source.writeUInt16LE(63488,l.o+10);const smooth=flatTexture(source);assert.deepEqual(decodeBlock(smooth,l.o),decodeBlock(smooth,l.o+16));assert.deepEqual([...decodeBlock(smooth,l.o).subarray(0,4)],[0,0,255,255]);
 const normal=flatTexture(source,true);for(const mip of layout(normal)){const p=decodeBlock(normal,mip.o);assert(Math.abs(p[0]-128)<5);assert(Math.abs(p[1]-128)<5);assert.equal(p[2],255);assert.equal(p[3],255);}assert.deepEqual(source.subarray(0,128),smooth.subarray(0,128));
});
