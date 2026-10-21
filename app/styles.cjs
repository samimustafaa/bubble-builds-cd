'use strict';
// Five additions to the preserved original. Parameters also drive the material previews.
const STYLES={
 pearl:{name:'Bubble Pearl',number:'01',motion:'Soft pearl · medium bubbles',quality:'bubble',color:[.82,.91,.98],scale:7,radius:.46,depth:.36,gloss:28,gain:.13,tint:.40},
 ice:{name:'Bubble Ice',number:'02',motion:'Cool blue · broad bubbles',quality:'bubble',color:[.62,.83,.98],scale:5,radius:.47,depth:.42,gloss:38,gain:.17,tint:.48},
 frost:{name:'Bubble Frost',number:'03',motion:'Soft white · satin finish',quality:'bubble',color:[.94,.96,.98],scale:6,radius:.46,depth:.25,gloss:18,gain:.07,tint:.42},
 lilac:{name:'Bubble Lilac',number:'04',motion:'Pale lavender · soft gloss',quality:'bubble',color:[.84,.78,.98],scale:7,radius:.46,depth:.34,gloss:30,gain:.12,tint:.38},
 aqua:{name:'Bubble Aqua',number:'05',motion:'Pale aqua · fine bubbles',quality:'bubble',color:[.64,.93,.92],scale:9,radius:.45,depth:.30,gloss:24,gain:.10,tint:.40}
};
const f=n=>Number(n).toFixed(4)+'f',v=a=>'float3('+a.map(f).join(', ')+')';
function surfaceFilm(id,pbr,animated=true){
 const s=STYLES[id];if(!s)throw Error('Choose a supported bubble preset.');
 return `// sg0hann bubble surface: ${s.name} / ${animated?'animated':'still'}
// Use mesh UVs, never the regular shader's clamped lightmap atlas local_0.
float2 sgUV = ${pbr?'psIN.v_texture0.xy':'psIN.uv0'} * ${f(s.scale)};
float sgTime = ${animated?'FrameTime * 0.025f':'0.0f'};
float sgRow = floor(sgUV.y);
sgUV.x += frac(sgRow * 0.5f);
float2 sgCell = frac(sgUV) - float2(0.5f, 0.5f);
float sgR2 = dot(sgCell, sgCell) / ${f(s.radius*s.radius)};
// Derivative-based edge softening reduces distant sparkle and hard rings.
float sgAA = min(max(fwidth(sgR2), 0.025f), 0.65f);
float sgMask = 1.0f - smoothstep(1.0f - sgAA, 1.0f + sgAA, sgR2);
float sgDome = sqrt(saturate(1.0f - sgR2));
float3 sgN = normalize(float3(sgCell / ${f(s.radius)} * ${f(s.depth)}, 1.0f + sgDome * ${f(s.depth)}));
float3 sgL = normalize(float3(-0.45f + sin(sgTime) * 0.06f, -0.55f, 0.85f));
float sgShade = (dot(sgN, sgL) - 0.77f) * sgMask;
float sgSpec = pow(saturate(dot(sgN, normalize(float3(-0.16f + sin(sgTime) * 0.025f, -0.20f, 1.0f)))), ${f(s.gloss)}) * sgMask;
float sgDetail = saturate(dot(final_color.rgb, float3(0.2126f, 0.7152f, 0.0722f)));
float3 sgTint = ${v(s.color)} * (0.35f + 0.65f * sgDetail);
float3 sgBase = lerp(final_color.rgb, sgTint, ${f(s.tint)});
// Keep the existing panel texture, fog and construction alpha; add restrained dome relief.
final_color.rgb = saturate(sgBase + sgShade * 0.55f + sgSpec * ${f(s.gain)});
return final_color;`;
}
module.exports={STYLES,surfaceFilm};
