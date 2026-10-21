'use strict';
const TIMBERS={
 timberpine:{name:'Pine Slats — TEST',number:'06',motion:'Pale wood · narrow permanent gaps',quality:'timber',static:true,color:[.84,.63,.39],rows:9,gap:.09,warp:.025,brace:0},
 timberoak:{name:'Warm Oak — TEST',number:'07',motion:'Warm planks · wider permanent gaps',quality:'timber',static:true,color:[.62,.36,.18],rows:7,gap:.16,warp:.04,brace:0},
 timberwhite:{name:'Whitewashed Wood — TEST',number:'08',motion:'Cream planks · soft wood grain',quality:'timber',static:true,color:[.89,.83,.69],rows:8,gap:.12,warp:.02,brace:0},
 timberbrace:{name:'Cross-Braced Wood — TEST',number:'09',motion:'Open slats · diagonal timber braces',quality:'timber',static:true,color:[.76,.49,.27],rows:8,gap:.20,warp:.035,brace:1}
};
const f=n=>Number(n).toFixed(5)+'f',v=a=>'float3('+a.map(f).join(', ')+')';
function timberFilm(id,pbr){const s=TIMBERS[id];if(!s)throw Error('Unknown wood preset.');return `// sg0hann persistent timber cutouts: ${s.name}
// Only structure materials tagged by the local material patch opt into this effect.
if (abs(sgBuildVariant - 0.73125f) < 0.0001f) {
 float2 sgWoodUV = ${pbr?'psIN.v_texture0.xy':'psIN.uv0'};
 float2 sgTile = frac(sgWoodUV);
 float sgRow = sgWoodUV.y * ${f(s.rows)};
 float sgBend = sin(sgWoodUV.x * 11.0f + floor(sgRow) * 1.7f) * ${f(s.warp)};
 float sgAcross = frac(sgRow + sgBend);
 float sgPlank = step(${f(s.gap*.5)}, sgAcross) * step(sgAcross, ${f(1-s.gap*.5)});
 float sgFrame = 1.0f - step(0.035f, min(min(sgTile.x,1.0f-sgTile.x),min(sgTile.y,1.0f-sgTile.y)));
 float sgBrace = ${s.brace?'1.0f - step(0.035f,min(abs(sgTile.x-sgTile.y),abs(sgTile.x+sgTile.y-1.0f)))':'0.0f'};
 // Pixel discard keeps openings visible at every construction stage, including completed builds.
 clip(max(sgPlank,max(sgFrame,sgBrace)) - 0.5f);
 float sgGrain = sin(sgWoodUV.y * 240.0f + sin(sgWoodUV.x * 12.0f) * 3.0f);
 float sgBroad = sin(sgWoodUV.y * 68.0f + sin(sgWoodUV.x * 4.0f) * 1.4f);
 float sgRowTint = 0.94f + sin(floor(sgRow) * 2.399f) * 0.06f;
 float sgGrainLine = pow(saturate(0.5f + 0.5f * sin(sgWoodUV.y * 146.0f + sin(sgWoodUV.x * 7.0f + floor(sgRow)) * 3.0f)), 12.0f);
 float sgLight = 0.72f + 0.28f * saturate(dot(final_color.rgb,float3(0.2126f,0.7152f,0.0722f)));
 float sgEdge = smoothstep(${f(s.gap*.5)},${f(s.gap*.5+.07)},sgAcross) * (1.0f-smoothstep(${f(1-s.gap*.5-.07)},${f(1-s.gap*.5)},sgAcross));
 float sgRelief = lerp(0.82f,1.0f,max(sgEdge,max(sgFrame,sgBrace)));
 final_color.rgb = saturate(${v(s.color)} * sgLight * sgRelief * (0.98f + sgGrain * 0.035f + sgBroad * 0.07f) * sgRowTint * (1.0f - sgGrainLine * 0.10f));
}
return final_color;`;}
module.exports={TIMBERS,timberFilm};
