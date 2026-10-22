# Verification — 0.1.11

- Thirteen presets: the existing six bubbles and four wood tests, plus three transparent portrait presets. Existing ten preset semantic resource hashes remain unchanged.
- Portraits directly replace 28 DDS diffuse texture resources resolved from the structure material references `Tex0`, `difuse` and `diffuse_x`. Paths are constrained to supported build directories; missing resources abort generation. Material configs, mesh data, normal maps and unrelated resources remain byte-identical in portrait mode.
- Authored portrait assets are 512 × 512 DXT5/BC3 DDS textures with alpha and ten mip levels. Their decoded size, dimensions, mip count and SHA-256 are verified before use. A transparent corner signature is read through the existing diffuse sampler to gate the shader; no new material parameter is introduced.
- The portrait shader does not wrap UVs. It discards coordinates outside 0–1 and transparent pixels and preserves the smaller of construction opacity and portrait alpha. CD's existing mesh UVs can split or mirror an image; full model UV remapping is not implemented. Visual cutouts retain solid collision.
- Unit tests check alpha/signature encoding and mip chain size, diffuse-only archive replacement, unchanged unrelated resources, missing or invalid paths and single-image sampling. Windows tests compile 78 Direct3D 9 fixtures and test thirteen loaded previews, wood/portrait filters, static controls, reapply notices, Apply, Restore, Updates and compact layout.
- Local verification checks both supplied archives for all 26 preset/motion combinations, resource counts, decode checksums and semantic digests. Private copies are patched, switched and restored byte-for-byte. User game archives are not distributed.

Gameplay rendering, UV orientation, clipping, shadows and performance still require testing in the actual game. Cutout PNG previews are image assets and do not establish an in-game match to the reference video.
