# Portrait aura tests — 0.1.19

Seven choices apply to each of the six existing portraits: Electric Blue, Ice Cyan, Saiyan Gold, Fire Orange, Violet, Rose Pink and Emerald. Off applies the original static portrait preset. Forty-two internal variants are hidden from the preset gallery and selected by the Aura menu. Existing bubbles, wood and Trunks are unchanged.

`tools/pack-aura-masks.py` derives a distance-to-silhouette mask from each authored transparent portrait PNG. Foreground pixels encode 224–255, the outer glow band encodes 1–96, and background beyond the band encodes zero. The 128 threshold separates foreground and background even after BC3 alpha compression. The outer band is at most 32 pixels wide at the 512-pixel source size. Mip masks scale with texture size.

The generated diffuse textures retain the existing printed RGB blocks. Only BC3 alpha bytes and an 8×8 texture-identification corner are changed. The shader detects that corner through a fixed-LOD sample, restores opaque diffuse alpha before the original lighting/construction calculations, and repairs the marker RGB from the existing smooth base. This avoids making solid builds transparent. At output, a rising sine/noise pattern modulates color only where the outside glow mask is nonzero. No vertex motion or portrait UV movement is introduced, and final construction alpha is not overwritten. The aura runs from the existing FrameTime uniform; no custom game binding is introduced. Far background and foreground RGB are retained. Glow pixels themselves necessarily receive the selected aura color.

Two alpha templates per portrait (512 and 1024) are cached and reused across the referenced diffuse textures, reducing generation time. Colors share identical model outputs and differ only in their shader constants. Internal variant model resources: 328; shader resources: 2. No original game archive or shader source is bundled.

The UI keeps its original blue preview background around the transparent PNG, animates only drop shadows, and respects reduced-motion preferences for that preview. This is an illustrative preview, not a gameplay capture or a precise rendering of the game shader. Applying requires closing the game. Actual aura appearance, texture-LOD behavior and performance require in-game verification.

## Rendering correction — 0.1.21

The previous diffuse-alpha mask is removed. The new texture is an opaque rectangular atlas: the left half copies the v0.1.15 printed image blocks and the right half stores the independent grayscale silhouette mask. Every BC3 alpha block is 255 at every mip. Source portrait RGB blocks in the full-detail image half are preserved byte-for-byte. The detection marker is in the mask half, so no marker repair alters the portrait or its background. Original material files and the v0.1.15 mesh/UV projection are retained. The original no-aura profile digests still match v0.1.15.

Aura image and mask reads use explicit LOD0 in the pixel shader; opaque image samples replace only the diffuse read. Original normal, roughness and construction-effect UVs are unchanged. The separate mask is decoded from RGB instead of alpha, avoiding transparent-texture classification and mixed mask/transparency reads. This is a preventative rendering change; the screenshot alone cannot prove which game pipeline behavior caused its flat appearance.

The mask protects alpha above 2/255 with a two-pixel guard around hair and other fine edges. The outer band increases to 48 pixels at source size and fades near the portrait's cropped bottom edge. A layered rising pattern adds a soft colored veil and brighter emission/core, reducing the muddy flat outline. Foreground pixels receive no aura color. Existing natural hair colors are preserved; no source hair is recolored or regenerated.

The additional sfx_diffuse_g95_2 HLSL path reads its diffuse map through sam_other0. It gains a declaration for the existing engine FrameTime clock, whose runtime binding on this shader still requires testing. Off, bubbles, wood and the Trunks loop are unchanged. Aura variants modify three shader resources instead of two. Atlas width doubles (1024×512 or 2048×1024), so aura texture memory increases; it is not an FPS optimization.

Preview drop shadows are softer and have a light inner rim. They remain illustrative, not a precise gameplay rendering. Actual build detail, glow motion, hair edges and performance require an in-game check.

## Gray edge-strip cleanup — 0.1.22

The latest gameplay screenshot shows thin step/rim faces sampling a compressed slice of the portrait. Portrait presets now degenerate triangles whose geometric normal is primarily an edge/riser direction: floors/stairs retain faces with |normal.y|/length >= 0.25; walls retain faces with |normal.z|/length >= 0.25. Both main-face orientations remain. Each hidden triangle keeps its original first index and repeats that index twice. Buffer sizes, positions, normals, tangents, secondary UVs and serialized collision/hull bytes are untouched. All 298 supported meshes retain main faces; 4,962 of 10,712 triangles are hidden. Physical behavior and final appearance still require in-game verification. Video meshes are unchanged.

The portrait compositor no longer calls flatTexture on the original diffuse texture. It keeps original CD RGB detail behind the portrait and composites the same source image over it. Alpha remains opaque, and the existing neutral normal maps are retained to avoid embossing material detail onto faces. This differs deliberately from v0.1.15's flat-average background generator; simply copying that generator would not remove the gray fill. The original main portrait faces and mapping remain, with the targeted rim/riser removal described above.
