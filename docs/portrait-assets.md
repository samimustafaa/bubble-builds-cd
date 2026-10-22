# Portrait assets — 0.1.11

Three user-supplied portraits were edited with the built-in image-generation tool in background-extraction mode, with `transparent_background: true`.

Inputs and selected project assets:

| Input | Project PNG | Test preset |
|---|---|---|
| `dbbf7e6c-690e-4dc5-b9d2-16684bed6e9c.png` | `app/assets/portrait-dark.png` | Dark Portrait |
| `a60060dc-30f1-446c-9d11-43f46065d26f.png` | `app/assets/portrait-warm.png` | Warm Portrait |
| `images (8).jpg` | `app/assets/portrait-smile.png` | Smiling Portrait |

Prompt used separately for each input:

> Use case: background-extraction. Edit target: the attached portrait. Remove ONLY the entire background and any background smoke, light streaks or scenery outside the person's silhouette. Keep the single foreground person fully intact exactly as depicted, including face identity, expression, hair, clothing, pose, colors and original illumination. Preserve original portrait framing and all visible shoulders and torso. Clean natural hair edges with no halos. Genuine transparent alpha outside the person, including gaps beside hair. Do not add shadows, checkerboard, text, new objects, or change the person. Output a PNG cutout suitable for a game texture.

The project PNGs are fitted to 480 × 480 inside a transparent 512 × 512 canvas. `tools/pack-portrait-textures.py` packs them as DXT5 DDS assets with ten mip levels, then zlib-compresses them for the application. A transparent corner signature enables the portrait pixel-shader branch using the existing diffuse sampler; no new engine uniform is required. The game material files are retained unchanged for portrait presets.

The shader samples one image without wrapping UV coordinates. Existing CD mesh UVs can still split, mirror or reuse an image across separate pieces; this is not a complete model UV remap. The portrait background is visually cut out; the build's collision remains solid. Previews are image assets, not in-game captures.
