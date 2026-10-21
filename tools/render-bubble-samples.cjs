'use strict';
// Offline UV material samples, not gameplay screenshots. Same dome and lighting equations as HLSL.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {STYLES}=require('../app/styles.cjs');
const clamp=x=>Math.max(0,Math.min(1,x)),fract=x=>x-Math.floor(x),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const norm=a=>{const d=Math.hypot(...a);return a.map(v=>v/d);},dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function sample(id,u,v){
 const s=STYLES[id],original=id==='bubble',scale=original?18:s.scale,radius=original?.42:s.radius;
 const x=fract(u*scale+fract(Math.floor(v*scale)*.5))-.5,y=fract(v*scale)-.5,r2=(x*x+y*y)/(radius*radius),dome=Math.sqrt(clamp(1-r2));
 const mask=1-smooth(original?.85:.975,original?1:1.025,r2),base=[.45,.58,.68];
 if(original){const n=norm([x/.42,y/.42,Math.max(dome,.04)]),shade=(clamp(dot(n,norm([-.45,-.55,.85])))-.55)*mask,glint=Math.pow(clamp(dot(n,norm([-.3,-.4,1]))),22);return base.map((c,i)=>clamp(mix(c,[.68,.83,.94][i],.48)+shade*.025+glint*mask*.019));}
 const n=norm([x/radius*s.depth,y/radius*s.depth,1+dome*s.depth]),shade=(dot(n,norm([-.45,-.55,.85]))-.77)*mask,spec=Math.pow(clamp(dot(n,norm([-.16,-.20,1]))),s.gloss)*mask,detail=dot(base,[.2126,.7152,.0722]);
 return base.map((c,i)=>clamp(mix(c,s.color[i]*(.35+.65*detail),s.tint)+shade*.55+spec*s.gain));
}
function crc(b){let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(name,b){const n=Buffer.from(name),out=Buffer.alloc(b.length+12);out.writeUInt32BE(b.length);n.copy(out,4);b.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([n,b])),8+b.length);return out;}
function png(id){const w=640,h=360,raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++){let k=y*(w*3+1);raw[k++]=0;for(let x=0;x<w;x++)for(const c of sample(id,x/h,y/h))raw[k++]=Math.round(c*255);}const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
if(require.main===module){for(const id of ['bubble',...Object.keys(STYLES)])fs.writeFileSync(path.join(__dirname,'../app/assets',id+'-sample.png'),png(id));console.log('Rendered six UV material samples from the shader equations.');}
module.exports={sample};
