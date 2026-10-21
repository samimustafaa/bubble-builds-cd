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
 ink:{name:'Ink Porcelain',number:'10',motion:'Flowing ink gradient',color:[.86,.85,.80],power:32,gain:.11},
 timber:{name:'Toon Timber',number:'11',motion:'Soft wood sheen',quality:'pattern',color:[.76,.46,.18],power:20,gain:.04,preview:'assets/timber-concept.jpg'},
 blueprint:{name:'Blueprint',number:'12',motion:'Scanning technical grid',quality:'pattern',color:[.025,.12,.52],power:20,gain:.03,preview:'assets/blueprint-concept.jpg'},
 kintsugi:{name:'Kintsugi',number:'13',motion:'Travelling gold veins',quality:'pattern',color:[.025,.13,.16],power:55,gain:.14,preview:'assets/kintsugi-concept.jpg'},
 carbon:{name:'Redline Carbon',number:'14',motion:'Crimson weave sweep',quality:'pattern',color:[.045,.045,.055],power:40,gain:.10,preview:'assets/carbon-concept.jpg'},
 aurora:{name:'Aurora Flow',number:'15',motion:'Flowing aurora bands',quality:'pattern',color:[.12,.22,.62],power:45,gain:.15,preview:'assets/aurora-concept.jpg'},
 checker:{name:'Porcelain Checker',number:'16',motion:'Soft checker sheen',quality:'pattern',color:[.83,.74,.62],power:30,gain:.10,preview:'assets/checker-concept.jpg'},
 lowdetail:{name:'Low Detail',number:'17',motion:'Static matte · fewer added shader calculations',quality:'light',static:true,color:[.47,.59,.66],preview:'assets/lowdetail-concept.jpg'},
 ultralight:{name:'Ultra Light',number:'18',motion:'Static flat · minimal surface calculations',quality:'light',static:true,color:[.67,.69,.71],preview:'assets/ultralight-concept.jpg'}
};
const f=n=>Number(n).toFixed(4)+'f',v=a=>'float3('+a.map(f).join(', ')+')';
function surfaceFilm(id,pbr,animated=true){
 const s=STYLES[id];if(!s)throw Error('Choose a supported surface preset.');
 if(s.static)return `// sg0hann lightweight surface: ${s.name}
${id==='lowdetail'?'float2 sgFlatUV = '+(pbr?'psIN.v_texture0.xy':'psIN.uv0')+';\nfloat sgFlatShade = 0.86f + 0.10f * saturate(sgFlatUV.y);':'float sgFlatShade = 0.93f;'}
final_color.rgb = ${v(s.color)} * sgFlatShade;
return final_color;`;

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
 timber:'float sgGrain = 0.5f + 0.5f * sin(sgUV.y * 44.0f + sin(sgUV.x * 5.0f) * 2.2f); float sgWood = smoothstep(0.25f, 0.75f, sgGrain); sgColor = lerp(float3(0.84f,0.59f,0.28f),float3(0.56f,0.30f,0.10f),sgWood * 0.42f) * sgLight + sgSweep * 0.025f;',
 blueprint:'float2 sgGridUV = abs(frac(sgUV * 10.0f) - 0.5f); float sgGrid = 1.0f - smoothstep(0.012f,0.035f,min(sgGridUV.x,sgGridUV.y)); float sgCircle = 1.0f - smoothstep(0.012f,0.035f,abs(length(frac(sgUV * 2.0f)-0.5f)-0.31f)); sgColor = float3(0.025f,0.12f,0.52f) * sgLight + float3(0.62f,0.78f,0.86f) * max(sgGrid*0.38f,sgCircle*0.35f); sgColor += pow(sgBand,20.0f) * 0.05f;',
 kintsugi:'float sgVein = abs(sin(sgUV.x * 13.0f + sin(sgUV.y * 11.0f) * 1.3f)); float sgGold = 1.0f - smoothstep(0.035f,0.085f,sgVein); sgColor = lerp(float3(0.025f,0.13f,0.16f)*sgLight,float3(0.77f,0.56f,0.18f),sgGold); sgColor += sgGold * sgSweep * float3(0.12f,0.08f,0.02f);',
 carbon:'float sgWeaveA = sin((sgUV.x+sgUV.y)*160.0f); float sgWeaveB = sin((sgUV.x-sgUV.y)*160.0f); float sgWeave = 0.5f + 0.5f * sgWeaveA * sgWeaveB; sgColor = lerp(float3(0.025f,0.025f,0.03f),float3(0.085f,0.085f,0.10f),sgWeave)*sgLight; sgColor += float3(0.46f,0.015f,0.025f)*(sgRim*0.20f + pow(sgBand,38.0f)*0.15f);',
 aurora:'float sgFlow = 0.5f + 0.5f * sin(sgUV.x*7.0f + sin(sgUV.y*5.0f+sgTime)*2.2f-sgTime); sgColor = lerp(float3(0.06f,0.13f,0.54f),float3(0.12f,0.65f,0.79f),sgFlow); float sgPink = pow(saturate(0.5f+0.5f*sin(sgUV.y*6.0f+sgUV.x*3.0f+sgTime*0.7f)),4.0f); sgColor = lerp(sgColor,float3(0.76f,0.20f,0.55f),sgPink*0.75f)*sgLight;',
 checker:'float sgCheck = frac((floor(sgUV.x*6.0f)+floor(sgUV.y*6.0f))*0.5f)*2.0f; sgColor = lerp(float3(0.88f,0.82f,0.68f),float3(0.72f,0.34f,0.24f),sgCheck)*sgLight; sgColor += sgSweep*0.035f;',
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
