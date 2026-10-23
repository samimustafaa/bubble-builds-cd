# Portrait assets — 0.1.16

Six user-supplied portraits were edited with the built-in image-generation tool in background-extraction mode, with `transparent_background: true`.

Inputs and selected project assets:

| Input | Project PNG | Test preset |
|---|---|---|
| `dbbf7e6c-690e-4dc5-b9d2-16684bed6e9c.png` | `app/assets/portrait-dark.png` | Billie Eillish |
| `a60060dc-30f1-446c-9d11-43f46065d26f.png` | `app/assets/portrait-warm.png` | Patrick Jane |
| `images (8).jpg` | `app/assets/portrait-smile.png` | The Mentalist |

Prompt used separately for each input:

> Use case: background-extraction. Edit target: the attached portrait. Remove ONLY the entire background and any background smoke, light streaks or scenery outside the person's silhouette. Keep the single foreground person fully intact exactly as depicted, including face identity, expression, hair, clothing, pose, colors and original illumination. Preserve original portrait framing and all visible shoulders and torso. Clean natural hair edges with no halos. Genuine transparent alpha outside the person, including gaps beside hair. Do not add shadows, checkerboard, text, new objects, or change the person. Output a PNG cutout suitable for a game texture.

The project PNGs are fitted to 480 × 480 inside a transparent 512 × 512 canvas. `tools/pack-portrait-textures.py` packs them as DXT5 DDS assets with ten mip levels, then zlib-compresses them for the application. The source cutout keeps its alpha for compositing. Version 0.1.13 decodes each original build diffuse DDS and blends the portrait over its RGB using that alpha. Fully transparent portrait regions retain the original material's BC3 color blocks; foreground and edge blocks are encoded back to BC3. Every output texture block is opaque. Original dimensions (512 or 1024) and full mip chains are preserved. No game texture is bundled or uploaded. Original build shader resources are retained byte-for-byte, removing the previous portrait alpha-discard branch and preserving the game's construction effects and lighting.

The mesh samples one portrait print across the whole piece. Version 0.1.12 replaces primary UV coordinates on 298 meshes referenced by structure model configurations. Walls project across X/Y; floors and ramps project across X/Z. Ramp direction is chosen from the height/depth covariance so the portrait head is at the raised end. Each mesh uses its complete bounds, including edited half-width pieces. Only the primary float2 UV bytes change; all other mesh bytes remain identical. Mesh layout, counts, tangent flags and triangle indices are validated before modification. This removes per-plank UV repetition; it does not fill geometric holes or add a new surface. Actual gameplay verification remains necessary. The portrait background shows the original CD material; the build stays solid. Previews are image assets, not in-game captures.

Version 0.1.14 smooths portrait presets: the original diffuse texture’s smallest mip supplies one base color for all background blocks. Portrait alpha blends over that opaque base. Two referenced structure normal DDS maps become neutral (128,128,255), removing their embossed detail. Original shader construction effects remain. Other presets are unchanged. The uploaded neox(3).xml is byte-identical to the existing mobile configuration reference, so this change targets texture detail instead of inventing new configuration settings.

Version 0.1.15 adds transparent source cutouts for Tate Mcrae (`portrait-tate.png`), Hatake Kakashi (`portrait-kakashi.png`) and Sharingan Kakashi (`portrait-sharingan.png`). Built-in image editing used the same background-extraction prompt above: remove only the background; preserve identity, expression, pose, hair, clothing, colors, style and crop; genuine transparent alpha; no text or added objects. The app composites these over the same smooth opaque build base as existing portraits. Names are labels only and are not printed onto textures.

Version 0.1.16 adds Goku Blue (`portrait-goku.png`, source `701862.jpg`) and Goku blue ssj (`portrait-goku-ssj.png`, source `images.jpg`). With user authorization, Python/Pillow masks preserve the source character and surrounding blue/cyan energy aura. Protected character outlines retain opacity; color selection and distance feathering fade the outer aura to transparency. This edits alpha only before resizing; no RGB artwork is generated. `tools/prepare-goku-aura.py` reproduces the conversion from user-supplied photos. PNGs use the existing 512-pixel texture and opaque smooth build compositing pipeline.
