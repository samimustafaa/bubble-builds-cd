# Verification — 0.1.5

- Added ten distinct authored surface shaders plus gallery concept thumbnails. Existing Bubble Wrap TEST 01 and Mobile remain; Custom Image stays removed.
- Material effects use each game shader's existing normals, view vector and FrameTime input. The off switch freezes the added surface clock. Existing alpha, dissolution and build assembly calculations remain.
- All 22 surface/motion combinations privately generated from the supplied original archives. Processed 318 material entries and two shader entries per surface. Decoded resources, checksums and per-mode semantic digests verified.
- Applied all 22 combinations, switched to Mobile and restored copies of the supplied game files. Original bytes matched exactly after Restore.
- Windows tests compile 60 authored shader fixtures (PBR, normal and simplified paths, animation on/off) for Direct3D 9 ps_3_0. No game shader source is distributed by these fixtures.
- A Windows Electron smoke test exercises the actual gallery with a mock backend: 12 cards, scroll, selection, animation option, Apply, Restore, settings and fixed-window overflow.

Concept images are illustrative; material matching, full game shader integration and in-game acceptance still require a Windows game test. Surface animation is continuous rather than placement-triggered. Original mesh and assembly motion are unchanged.
