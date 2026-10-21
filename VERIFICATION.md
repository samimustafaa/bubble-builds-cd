# Verification — 0.1.6

- 20 selectable presets: Bubble Wrap, Mobile / flat, 18 authored surfaces. Eight additions include six procedural patterned materials and two static lightweight variants.
- Lightweight, Smooth and Patterned gallery filters; animation is disabled for static surfaces. Lightweight variants have fewer added surface calculations, without a measured FPS claim.
- Verified 38 preset/motion combinations against supplied original archives; existing 0.1.5 resource digests remain unchanged. Per-mode semantic digests and decoded resource round trips checked for 318 processed material entries and two shader entries per surface.
- Privately applied all surface/motion variants to copies of the game files, switched to Mobile and restored. Original bytes matched exactly.
- Windows test suite compiles 108 authored Direct3D 9 shader fixtures, including regular, simplified and PBR variants. The Electron UI test exercises 20 cards, quality filtering, animation setting, Apply, Restore, update dialog and compact-window layout with a mock backend.

Actual game acceptance, appearance and performance require Windows gameplay testing. Patterned thumbnails are authored material samples; older thumbnails are concept images. Original build mesh and assembly motion remain unchanged. Animations are continuous surface effects, not placement-triggered assembly replacements.
