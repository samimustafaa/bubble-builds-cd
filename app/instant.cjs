"use strict";
const INSTANT={instantbuilds:{name:'Instant Builds — TEST',number:'17',motion:'No build reveal · original level colors',quality:'instant',static:true,preview:'assets/instantbuilds-sample.jpg'}};
function instantShader(raw){
 const s=raw.toString('utf8');if(!/^\/\/scene_cj(?:_pbr)?\r/.test(s))return null;
 const pixel=s.indexOf('float4 ps_main(PS_INPUT psIN)'),vertex=s.indexOf('PS_INPUT vs_main(VS_INPUT vsIN)');
 if(pixel<0&&vertex<0)return null;const at=pixel>=0?pixel:vertex,head=s.slice(0,at),body=s.slice(at);
 if(pixel>=0){if(!body.includes('rongjiezhi')||!body.includes('return final_color;'))throw Error('Unsupported build reveal shader');
 return Buffer.from(head+body.replace(/\brongjiezhi\b/g,'1.0f').replace('return final_color;','// Instant Builds: solid surface, preserving material preview opacity.\nfinal_color.a = saturate(AlphaMtl);\nreturn final_color;'));}
 if(!body.includes('world_create'))return null;
 return Buffer.from(head+body.replace(/\bworld_create\b/g,'0.0f'));
}
module.exports={INSTANT,instantShader};
