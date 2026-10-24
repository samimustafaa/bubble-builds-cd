# Bubble Builds

Build material tests for Creative Destruction: Original Bubble Wrap, five bubble variants four wood variants with permanent visual gaps, and six smooth portrait prints.

[Download the Windows installer](https://github.com/samimustafaa/bubble-builds-cd/releases/latest)

Close the game, choose its folder, select a preset and click **Apply**. Filter **Wood tests** for Pine Slats, Warm Oak, Whitewashed Wood and Cross-Braced Wood. Filter **Portrait tests** for Billie Eillish, Patrick Jane, The Mentalist, Tate Mcrae, Hatake Kakashi, and Sharingan Kakashi. **Restore backup** restores the exact files saved before the first Apply. **Updates → Check now → Update & restart** installs the latest app; backups stay outside the installation. **After an app update, close the game and Apply your preset again to install the new game-file patch.**

The wood tests draw authored plank grain and discard pixels between slats, including on completed builds. Version 0.1.10 uses an existing engine material parameter to enable wood on supported structures, replacing the unverified custom parameter from 0.1.9. These are experimental visual openings: collision stays solid, existing model shapes stay unchanged, and shadows may remain solid. The game must be tested to confirm parameter binding, UV alignment and appearance. This does not import Fortnite models or guarantee a match to its buildings.

Previews are deterministic UV material samples from the shader equations, not gameplay captures. Transparent pixels represent the proposed gaps. Render them again with `node tools/render-timber-samples.cjs`.

Patches are generated locally from supported original game files. No game archives are distributed.

Portrait presets print the selected person over a smooth solid base sampled from the original CD material’s average color. Version 0.1.14 removes diffuse grain and flattens two build normal maps for portrait presets only. It composites BC3 textures locally from the verified game backup and restores the original build shaders, including lighting and construction effects. Whole-piece UV mapping from 0.1.12 is retained on 298 build meshes. Only primary UV bytes change in geometry; collision and animation data remain unchanged. In-game appearance still needs validation. [Portrait asset notes](docs/portrait-assets.md).

### MP4 & GIF loops

The MP4 & GIF tab contains curated video-animation presets. Trunks — Aura Loop keeps the brighter orange energy aura over a smooth solid build base. Version 0.1.18 uses a shorter 4-second loop, 64 frames at 16 fps, and 480-pixel frame canvases (up from 224). Neighboring frames blend continuously in the game shader. The final half-second eases back to the first frame. The shared atlas remains 4096×4096, so its GPU texture allocation is unchanged; blending adds one texture sample. The app stops animated previews when the Images tab is shown. Both Goku presets have been removed.

Apply with the game closed. Video loops always run; Surface animation does not pause them. Preview playback is WebP; game playback uses the atlas and shader clock, not direct MP4 decoding. This remains experimental and needs in-game verification. The tab is not an arbitrary-file import interface.
