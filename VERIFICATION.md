# Verification — 0.1.8

- Six selectable presets: preserved Original Bubble Wrap plus Pearl, Ice, Frost, Lilac and Aqua. Previous non-bubble presets and Mobile are removed from the gallery.
- New bubble shaders use mesh UVs rather than the regular shader's lightmap atlas coordinates. Derivative-softened domes add subtle shading and specular light while blending with the existing final color. Construction alpha remains untouched. The original shader and material resource hashes are unchanged.
- Six material samples are rendered offline from the same dome equations and parameters by `node tools/render-bubble-samples.cjs`. They show a UV sample under a fixed assumed base color, not the game scene, mesh, fog or lighting. They replace the AI gameplay concepts.
- Every preset/motion mode is checked against the supplied original archives, including decoded resource checksums, exact changed-resource counts, and semantic digests. All six presets in both motion modes were also applied to private copies, switched and restored byte-for-byte. No original game files are shipped.
- Windows tests compile 36 Direct3D 9 fixtures for six presets, both motion modes and regular/simplified/PBR paths. The Electron test verifies six loaded previews, category filtering, Apply, Restore, Updates and compact-window layout with a mock backend.

Actual game acceptance, UV mapping, visual quality and performance still require gameplay testing on the supported game version. These tests cannot establish that a shader patch matches an AI concept picture.
