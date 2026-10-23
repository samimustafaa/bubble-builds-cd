# Trunks looping build test — 0.1.17

Source: user-supplied `trunks-torankusu.3840x2160.mp4`, 3840×2160, 30 fps, 21.2 seconds.

`tools/prepare-trunks-loop.py` uses ffmpeg to sample at 8 fps, scales to 768×432, removes the uniform orange backdrop by color/luminance keying, and retains the brighter yellow/orange aura with soft alpha. Purple hair, skin and dark clothing stay opaque. A fixed crop and canvas avoid frame-to-frame positioning jitter. The source is not bundled.

170 processed frames loop every 21.25 seconds. The alpha WebP preview repeats forever. For game rendering, the cutouts composite onto one smooth opaque base, preserving solid builds as with portraits. The game asset is one 4096-pixel DXT5 atlas with 13 mips, 256-pixel cells and 16-pixel insets. The shader samples explicit LOD0 inside each cell to prevent neighboring-frame or mip bleed. A fixed corner marker scopes playback to this atlas; no new material uniform is needed. Original construction alpha is retained. Playback always uses FrameTime, including when surface animation is disabled.

309 structure material resources redirect their diffuse values and File dependencies to the existing `model_regular\structure\floor_003_color.dds` resource. Nine materials already use that path. One atlas is stored instead of replacing every diffuse resource with a duplicate atlas. 298 mesh primary UV streams use the existing whole-piece projection; two normal maps are flattened. Geometry, secondary UVs and collision stay intact. Total modified model resources: 610; shader resources: 2. All other preset algorithms and semantic hashes remain unchanged.

The final appearance, game texture-cache behavior and driver support still require an in-game test. Desktop tests and shader compilation cannot establish runtime playback. Atlas decoding and the GPU texture require more memory than a static portrait. This first loop has reduced frame size and frame rate; it does not preserve 4K/30 fps source quality. Looping restarts the supplied sequence; no seamless-loop claim is made.
