'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {atomic}=require('./engine.cjs');
// BGRA8 (A8R8G8B8) DDS with a full mip chain; input is Electron's Windows BGRA bitmap.
function makeDDS(bitmap,width,height,mode='stretch',size=512){
 if(!['stretch','fit'].includes(mode)||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>512||height>512||bitmap.length!==width*height*4)throw Error('Invalid image pixels.');
 const scale=Math.min(size/width,size/height),w=mode==='fit'?Math.max(1,Math.round(width*scale)):size,h=mode==='fit'?Math.max(1,Math.round(height*scale)):size,left=Math.floor((size-w)/2),top=Math.floor((size-h)/2);let pixels=Buffer.alloc(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const d=(y*size+x)*4;pixels[d]=34;pixels[d+1]=29;pixels[d+2]=24;pixels[d+3]=255;if(x<left||x>=left+w||y<top||y>=top+h)continue;const sx=Math.min(width-1,Math.floor((x-left)*width/w)),sy=Math.min(height-1,Math.floor((y-top)*height/h)),s=(sy*width+sx)*4,a=bitmap[s+3]/255;pixels[d]=Math.round(bitmap[s]*a+34*(1-a));pixels[d+1]=Math.round(bitmap[s+1]*a+29*(1-a));pixels[d+2]=Math.round(bitmap[s+2]*a+24*(1-a));}

 const head=Buffer.alloc(128);head.write('DDS ');head.writeUInt32LE(124,4);head.writeUInt32LE(0x2100f,8);head.writeUInt32LE(size,12);head.writeUInt32LE(size,16);head.writeUInt32LE(size*4,20);const levels=Math.log2(size)+1;head.writeUInt32LE(levels,28);head.writeUInt32LE(32,76);head.writeUInt32LE(0x41,80);head.writeUInt32LE(32,88);[0xff0000,0xff00,0xff,0xff000000].forEach((n,i)=>head.writeUInt32LE(n,92+i*4));head.writeUInt32LE(0x401008,108);const chunks=[head,pixels];
 for(let side=size;side>1;){const next=side/2,out=Buffer.alloc(next*next*4);for(let y=0;y<next;y++)for(let x=0;x<next;x++)for(let c=0;c<4;c++){let sum=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)sum+=pixels[((y*2+dy)*side+x*2+dx)*4+c];out[(y*next+x)*4+c]=Math.round(sum/4);}chunks.push(out);pixels=out;side=next;}return Buffer.concat(chunks);
}
class CustomImage{
 constructor(userDir){this.file=path.join(userDir,'custom-image.json');}
 async read(){try{const record=JSON.parse(await fs.readFile(this.file,'utf8'));if(record.schema!==1)throw Error('Unsupported custom image');return record;}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 async replace({bitmap,width,height,name,preview}){makeDDS(bitmap,width,height);const record={schema:1,name:String(name).slice(0,160),width,height,bitmap:bitmap.toString('base64'),preview};await atomic(this.file,JSON.stringify(record));return record;}
 async texture(mode){const r=await this.read();if(!r)throw Error('Upload an image first.');return makeDDS(Buffer.from(r.bitmap,'base64'),r.width,r.height,mode);}
}
module.exports={makeDDS,CustomImage};
