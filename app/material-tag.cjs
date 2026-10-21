'use strict';
// Rebuild the supported BXML node table while preserving each existing typed value verbatim.
// Only the authored structure-only shader parameter is inserted under ParamTable.
function tagMaterial(original,nodes){
 if(nodes.tableMetadata.readBigUInt64LE()!==BigInt(nodes.attributeDataOffset-12))throw Error('Unexpected material attribute offset');
 const copy=nodes.map(n=>({...n,attrs:{...n.attrs}})),parent=copy.findIndex(n=>n.tag==='ParamTable');
 if(parent<0||copy.filter(n=>n.tag==='ParamTable').length!==1)throw Error('Unexpected structure parameter table');
 if(copy.some(n=>n.tag==='sgBuildVariant'))throw Error('Structure is already tagged');
 const end=index=>{let next=index+1;for(let c=0;c<copy[index].children;c++)next=end(next);return next;};
 const insert=end(parent);copy[parent].children++;
 const raw=Buffer.alloc(4);raw.writeFloatLE(.73125);
 copy.splice(insert,0,{tag:'sgBuildVariant',children:0,attrs:{Value:{type:5,raw}},valueInfo:{type:1,raw:Buffer.from([0])}});
 const tags=[...new Set(copy.map(n=>n.tag))],attrs=[...new Set(copy.flatMap(n=>Object.keys(n.attrs)))];
 const variable=n=>{const out=[];do{let c=n&127;n>>>=7;if(n)c|=128;out.push(c);}while(n);return Buffer.from(out);};
 const typed=a=>Buffer.concat([Buffer.from([a.type]),a.raw||original.subarray(a.start,a.end)]);
 const strings=list=>Buffer.concat([variable(list.length),...list.map(s=>Buffer.from(s+'\0'))]);
 const tagTable=strings(tags),attributeTable=strings(attrs),descriptors=[variable(copy.length)];
 for(const n of copy)descriptors.push(variable(tags.indexOf(n.tag)),variable(n.children));
 const descriptorTable=Buffer.concat(descriptors),metadata=Buffer.alloc(8);
 metadata.writeBigUInt64LE(BigInt(tagTable.length+attributeTable.length+8+descriptorTable.length));
 const parts=[original.subarray(0,12),tagTable,attributeTable,metadata,descriptorTable];
 for(const n of copy){const fields=Object.entries(n.attrs);parts.push(variable(fields.length));for(const [k,a]of fields)parts.push(variable(attrs.indexOf(k)),typed(a));parts.push(typed(n.valueInfo));}
 const output=Buffer.concat(parts);output.writeBigUInt64LE(original.readBigUInt64LE(4)+BigInt(output.length-original.length),4);return output;
}
module.exports={tagMaterial};
