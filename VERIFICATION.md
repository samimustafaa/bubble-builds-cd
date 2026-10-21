# Verification — 0.1.3

- 35 automated tests cover DDS conversion and mipmaps, Stretch/Fit, image replacement and persistence, custom shader clamping, backup/restore/recovery and updater control flow.
- Privately applied TEST 01, a red custom image, a blue replacement image, Mobile and Restore to copies of the supplied game files. All 17 build diffuse textures decoded to the latest image. Invalid image generation made no writes. Mobile returned the original archives; Restore returned every original byte.
- Custom mapping samples diffuse UVs once using clamping and preserves the shader's alpha/construction calculations. Existing UV unwrapping can split/distort the picture across faces; no claim of seamless whole-object mapping is made.
- One atomic custom-image file is stored outside the app installation. A failed replacement leaves the previous image intact. New image uploads change the saved selection; Apply updates the game with it.
- TEST 02–04 and their concept thumbnails removed. TEST 01 remains; its thumbnail is a concept rather than verified gameplay.

Windows shader compilation, DDS acceptance and actual image placement require an in-game test. The interface's new upload flow has not been exercised in a live Windows GUI in this environment.
