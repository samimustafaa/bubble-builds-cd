'use strict';
const STYLES={
 ceramic:{name:'Satin Ceramic',number:'01',motion:'Soft highlight fade',color:[.86,.83,.74],power:24,gain:.08},
 obsidian:{name:'Smoked Obsidian',number:'02',motion:'Violet rim pulse',color:[.045,.044,.065],power:42,gain:.13},
 silver:{name:'Brushed Silver',number:'03',motion:'Sliding satin highlight',color:[.58,.63,.68],power:58,gain:.24},
 aqua:{name:'Frosted Aqua',number:'04',motion:'Upward frost sweep',color:[.32,.68,.73],power:18,gain:.09},
 mint:{name:'Mint Tech',number:'05',motion:'Thin scanning light',color:[.40,.69,.54],power:30,gain:.07},
 opal:{name:'Opal Shift',number:'06',motion:'Lavender-to-teal flow',color:[.57,.46,.79],power:40,gain:.17},
 clay:{name:'Soft Terracotta',number:'07',motion:'Warm highlight fade',color:[.79,.36,.22],power:12,gain:.025},
 slate:{name:'Midnight Slate',number:'08',motion:'Blue rim sweep',color:[.035,.09,.18],power:36,gain:.10},
 champagne:{name:'Champagne Silk',number:'09',motion:'Warm gold glint',color:[.72,.55,.29],power:64,gain:.25},
 ink:{name:'Ink Porcelain',number:'10',motion:'Flowing ink gradient',color:[.86,.85,.80],power:32,gain:.11}
};
const f=n=>Number(n).toFixed(4)+'f',v=a=>'float3('+a.map(f).join(', ')+')';
function surfaceFilm(id,pbr,animated=true){
 const s=STYLES[id];if(!s)throw Error('Choose a supported surface preset.');
 const normal=pbr?'float3 sgN = normalize(psIN.v_texture4);\nfloat3 sgV = normalize(camera_pos.xyz - psIN.v_texture1.xyz);':`float3 sgV = normalize(CameraPosition.xyz - psIN.vv_world_position.xyz);
#if !(SIMPLIFEDMODEL)
float3 sgN = normalize(psIN.v_world_normal);
#else
float3 sgN = float3(0.0f, 1.0f, 0.0f);
#endif`;
 const effect={
 ceramic:'sgColor += sgSweep * 0.025f;',
 obsidian:'sgColor += float3(0.30f, 0.12f, 0.48f) * sgRim * (0.25f + 0.08f * sin(sgTime * 2.0f));',
 silver:'sgColor += sgSweep * 0.08f + sin(sgUV.y * 300.0f) * 0.003f + sgRim * 0.08f;',
 aqua:'sgColor += float3(0.14f, 0.30f, 0.33f) * (sgBand * 0.16f + sgRim * 0.22f);',
 mint:'sgColor += float3(0.70f, 0.90f, 0.82f) * pow(sgBand, 24.0f) * 0.055f;',
 opal:'sgColor = lerp(float3(0.55f, 0.40f, 0.79f), float3(0.21f, 0.74f, 0.70f), 0.5f + 0.5f * sin(sgUV.x * 2.4f + sgUV.y * 1.2f + sgTime)) * sgLight; sgColor += sgRim * float3(0.13f, 0.16f, 0.20f);',
 clay:'sgColor += float3(0.06f, 0.025f, 0.012f) * (0.5f + 0.5f * sin(sgTime));',
 slate:'sgColor += float3(0.08f, 0.22f, 0.40f) * sgRim * (0.35f + 0.12f * sgBand) + sgSweep * 0.015f;',
 champagne:'sgColor += float3(0.30f, 0.23f, 0.10f) * sgSweep * 0.25f;',
 ink:'float sgInk = smoothstep(-0.25f, 0.35f, sin(sgUV.x * 2.7f + sgUV.y * 1.4f + sin(sgUV.y * 2.4f) * 0.6f + sgTime * 0.4f)); sgColor = lerp(float3(0.86f, 0.85f, 0.80f), float3(0.045f, 0.055f, 0.07f), sgInk) * sgLight;'
 }[id];
 return `// sg0hann surface: ${s.name} / ${animated?'animated':'still'}
float2 sgUV = ${pbr?'psIN.v_texture0.xy':'psIN.uv0'};
float sgTime = ${animated?'FrameTime * 0.18f':'0.0f'};
${normal}
float3 sgL = normalize(float3(-0.4f, 0.8f, 0.3f));
float sgLight = 0.68f + 0.25f * saturate(dot(sgN, sgL));
float sgRim = pow(1.0f - saturate(abs(dot(sgN, sgV))), 3.0f);
float sgSpec = pow(saturate(dot(sgN, normalize(sgV + sgL))), ${f(s.power)}) * ${f(s.gain)};
float sgSweep = pow(saturate(0.5f + 0.5f * sin((sgUV.x * 0.65f + sgUV.y * 0.35f - sgTime) * 6.283185f)), 12.0f);
float sgBand = 0.5f + 0.5f * sin((sgUV.y - sgTime) * 6.283185f);
float3 sgColor = ${v(s.color)} * sgLight;
${effect}
final_color.rgb = saturate(sgColor + sgSpec);
return final_color;`;
}
module.exports={STYLES,surfaceFilm};
