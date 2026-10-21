# Verification — 0.1.2

- Four separate analytic surface shaders: Soft Pearl, Classic, Micro and Crystal. Mobile / flat remains available.
- Each variant generated privately from the supported originals: 318 material resources and two Direct3D pixel shaders. Changed resource checksums, round trips and per-preset semantic hashes verified.
- New tests cover distinct surface variants and switching all four presets from original backups before restoring every original byte. Existing recovery and updater tests retained.
- Supplied clip reviewed: the game's hexagonal construction assembly remains unchanged. This release changes surface shading and reduces the previous excessive transparency; it does not replace animations, add actual dome geometry or promise Fortnite motion.
- Thumbnails are supplied/generated visual concepts, clearly labelled in the app. Actual material appearance, game acceptance and shader compilation need a Windows game test.

No game archives are distributed. Patches are generated locally. No runtime injection or anticheat bypass.
