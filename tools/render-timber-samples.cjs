'use strict';
// Deterministic UV swatches of the authored wood shader; alpha=0 means a discarded pixel.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),{TIMBERS}=require('../app/timber.cjs');
const frac=x=>x-Math.floor(x),step=(a,b)=>b>=a?1:0,clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function sample(id,u,v){const s=TIMBERS[id];if(!s)throw Error('Unknown wood sample');const x=frac(u),y=frac(v),row=v*s.rows,bend=Math.sin(u*11+Math.floor(row)*1.7)*s.warp,across=frac(row+bend),plank=step(s.gap*.5,across)*step(across,1-s.gap*.5),frame=1-step(.035,Math.min(x,1-x,y,1-y)),brace=s.brace?1-step(.035,Math.min(Math.abs(x-y),Math.abs(x+y-1))):0;
 const grain=Math.sin(v*240+Math.sin(u*12)*3),broad=Math.sin(v*68+Math.sin(u*4)*1.4),edge=smooth(s.gap*.5,s.gap*.5+.07,across)*(1-smooth(1-s.gap*.5-.07,1-s.gap*.5,across)),relief=.82+.18*Math.max(edge,frame,brace),lighting=.72+.28*.60,rowTint=.94+Math.sin(Math.floor(row)*2.399)*.06,grainLine=Math.pow(clamp(.5+.5*Math.sin(v*146+Math.sin(u*7+Math.floor(row))*3)),12);
 return [...s.color.map(c=>clamp(c*lighting*relief*(.98+grain*.035+broad*.07)*rowTint*(1-grainLine*.10))),Math.max(plank,frame,brace)];}
function crc(b){let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(name,b){const n=Buffer.from(name),out=Buffer.alloc(b.length+12);out.writeUInt32BE(b.length);n.copy(out,4);b.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([n,b])),8+b.length);return out;}
function png(id){const w=640,h=360,raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){let k=y*(w*4+1);raw[k++]=0;for(let x=0;x<w;x++)for(const c of sample(id,(x+.5)/w,(y+.5)/h))raw[k++]=Math.round(c*255);}const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
if(require.main===module){for(const id of Object.keys(TIMBERS))fs.writeFileSync(path.join(__dirname,'../app/assets',id+'-sample.png'),png(id));console.log('Rendered four wood material samples with transparent cutouts.');}
module.exports={sample};
