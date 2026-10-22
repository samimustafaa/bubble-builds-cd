# Bubble Builds

Build material tests for Creative Destruction: Original Bubble Wrap, five bubble variants four wood variants with permanent visual gaps, and three solid portrait prints.

[Download the Windows installer](https://github.com/samimustafaa/bubble-builds-cd/releases/latest)

Close the game, choose its folder, select a preset and click **Apply**. Filter **Wood tests** for Pine Slats, Warm Oak, Whitewashed Wood and Cross-Braced Wood. Filter **Portrait tests** for Dark, Warm and Smiling Portrait. **Restore backup** restores the exact files saved before the first Apply. **Updates → Check now → Update & restart** installs the latest app; backups stay outside the installation. **After an app update, close the game and Apply your preset again to install the new game-file patch.**

The wood tests draw authored plank grain and discard pixels between slats, including on completed builds. Version 0.1.10 uses an existing engine material parameter to enable wood on supported structures, replacing the unverified custom parameter from 0.1.9. These are experimental visual openings: collision stays solid, existing model shapes stay unchanged, and shadows may remain solid. The game must be tested to confirm parameter binding, UV alignment and appearance. This does not import Fortnite models or guarantee a match to its buildings.

Previews are deterministic UV material samples from the shader equations, not gameplay captures. Transparent pixels represent the proposed gaps. Render them again with `node tools/render-timber-samples.cjs`.

Patches are generated locally from supported original game files. No game archives are distributed.

Portrait presets print the selected person over a smooth solid base sampled from the original CD material’s average color. Version 0.1.14 removes diffuse grain and flattens two build normal maps for portrait presets only. It composites BC3 textures locally from the verified game backup and restores the original build shaders, including lighting and construction effects. Whole-piece UV mapping from 0.1.12 is retained on 298 build meshes. Only primary UV bytes change in geometry; collision and animation data remain unchanged. In-game appearance still needs validation. [Portrait asset notes](docs/portrait-assets.md).
