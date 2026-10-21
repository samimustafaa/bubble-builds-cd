# Bubble Builds

Build material tests for Creative Destruction: Original Bubble Wrap, five bubble variants and four wood variants with permanent visual gaps.

[Download the Windows installer](https://github.com/samimustafaa/bubble-builds-cd/releases/latest)

Close the game, choose its folder, select a preset and click **Apply**. Filter **Wood tests** for Pine Slats, Warm Oak, Whitewashed Wood and Cross-Braced Wood. **Restore backup** restores the exact files saved before the first Apply. **Updates → Check now → Update & restart** installs the latest app; backups stay outside the installation.

The wood tests draw authored plank grain and discard pixels between slats, including on completed builds. Structure materials receive a dedicated shader parameter so unrelated materials do not opt into the cutout. These are experimental visual openings: collision stays solid, existing model shapes stay unchanged, and shadows may remain solid. The game must be tested to confirm parameter binding, UV alignment and appearance. This does not import Fortnite models or guarantee a match to its buildings.

Previews are deterministic UV material samples from the shader equations, not gameplay captures. Transparent pixels represent the proposed gaps. Render them again with `node tools/render-timber-samples.cjs`.

Patches are generated locally from supported original game files. No game archives are distributed.
