# Verification — 0.1.9

- Ten selectable presets: original Bubble Wrap, five bubble variants and four authored wood tests. Existing six preset resource hashes are preserved.
- Wood cutouts are gated by an authored `sgBuildVariant` material parameter. The BXML writer inserts it only in supported structure materials, preserving existing typed values and hierarchy and recalculating both the header size and attribute-table offset. Other scene materials retain the original shader output.
- The four plank masks have permanent gaps independent of construction progress, frame strips and optional diagonal braces. Pixel discard affects visible surfaces, not collision geometry. No stage lock or model replacement is claimed. Alpha and existing assembly animation remain otherwise unchanged.
- Previews come from `tools/render-timber-samples.cjs`, using matching plank masks, grain and color equations under fixed assumed lighting. Cutouts are represented by transparent pixels. They cannot demonstrate the game's UVs, lighting, shadows or material parameter binding.
- Unit tests check material offsets and retained values, parameter gating, permanent cutouts, frame continuity and distinct gap coverage. Windows tests compile 60 Direct3D 9 fixtures and exercise ten loaded previews, wood filtering, static motion controls, Apply, Restore, Updates and compact layout.
- Local verification decodes both supplied archives for all 20 preset/motion modes and checks resource counts, round trips and semantic digests. All supported structure material hierarchies and values are compared before and after tagging. Private game-file copies are patched, switched and restored byte-for-byte.

Gameplay acceptance and actual visual quality still require testing in Creative Destruction. The texture patches cannot duplicate Fortnite's individual plank geometry, and cutout shadows may not match the openings.
