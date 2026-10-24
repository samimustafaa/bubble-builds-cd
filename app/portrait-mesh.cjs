'use strict';
// Supported NeoX mesh layout: positions, normals, optional tangent stream,
// 16-bit triangle indices, then two float2 UV streams.
function meshLayout(b){
 if(b.length<38||b.readUInt32LE(0)!==0xbbc88034)throw Error('Unsupported portrait mesh');
 const vertices=b.readUInt32LE(16),triangles=b.readUInt32LE(20);
 if(!vertices||vertices>65535||!triangles||b.readUInt32LE(28)!==vertices||b.readUInt32LE(32)!==triangles||b.readUInt16LE(24)!==2||b.readUInt16LE(26)!==1)throw Error('Unsupported portrait mesh counts');
 const tangentOffset=36+vertices*24;if(tangentOffset+2>b.length)throw Error('Truncated portrait mesh');
 const tangent=b.readUInt16LE(tangentOffset);if(tangent>1)throw Error('Unsupported portrait tangent stream');
 const indices=tangentOffset+2+tangent*vertices*12,uv=indices+triangles*6;
 if(uv+vertices*16>b.length)throw Error('Truncated portrait UV streams');
 for(let i=0;i<triangles*3;i++)if(b.readUInt16LE(indices+i*2)>=vertices)throw Error('Invalid portrait mesh index');
 return {vertices,triangles,uv};
}
function remapPortraitMesh(b,name,hideEdges=false){
 const {vertices,uv}=meshLayout(b),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<vertices;i++)for(let a=0;a<3;a++){const v=b.readFloatLE(36+i*12+a*4);if(!Number.isFinite(v))throw Error('Invalid portrait vertex');min[a]=Math.min(min[a],v);max[a]=Math.max(max[a],v);}
 // Walls use width/height. Floors and ramps use width/depth, so stair risers
 // share a continuous image with their treads instead of restarting each step.
 const vertical=/wall/i.test(name)?1:2,spanX=max[0]-min[0],spanV=max[vertical]-min[vertical];
 if(spanX<.001||spanV<.001)throw Error('Degenerate portrait projection');
 let reverse=true;
 if(/upstair/i.test(name)){let covariance=0;for(let i=0;i<vertices;i++){const o=36+i*12;covariance+=(b.readFloatLE(o+4)-(min[1]+max[1])/2)*(b.readFloatLE(o+8)-(min[2]+max[2])/2);}reverse=covariance>=0;}
 const out=Buffer.from(b);
 for(let i=0;i<vertices;i++){const o=36+i*12,u=(b.readFloatLE(o)-min[0])/spanX,v=(b.readFloatLE(o+vertical*4)-min[vertical])/spanV;out.writeFloatLE(u,uv+i*8);out.writeFloatLE(reverse?1-v:v,uv+i*8+4);}
 return hideEdges?hidePortraitEdges(out,name):out;
}
function hidePortraitEdges(b,name){const {triangles,uv}=meshLayout(b),indices=uv-triangles*6,out=Buffer.from(b),axis=/wall/i.test(name)?2:1;let kept=0;
 for(let i=0;i<triangles;i++){const o=indices+i*6,ids=[b.readUInt16LE(o),b.readUInt16LE(o+2),b.readUInt16LE(o+4)],points=ids.map(id=>[0,1,2].map(a=>b.readFloatLE(36+id*12+a*4))),u=points[1].map((v,a)=>v-points[0][a]),v=points[2].map((v,a)=>v-points[0][a]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);if(length<1e-8)continue;if(Math.abs(n[axis])/length<.25){out.writeUInt16LE(ids[0],o+2);out.writeUInt16LE(ids[0],o+4);}else kept++;}
 if(!kept)throw Error('No supported portrait surface found');return out;}
module.exports={meshLayout,remapPortraitMesh,hidePortraitEdges};
