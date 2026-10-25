# Painted Milky Way Design

**Status:** Approved for planning
**Date:** 2026-10-25

Sub-project 1 of 3. The other two follow as separate specs: (2) external galaxies in the same painted style but with each galaxy's telescope colours, (3) a sci-fi HUD frame and captions.

## Objective

Replace the Milky Way's look with the painted style the owner approved from the scratch sample (`?style=paint`): a disc filled with brush strokes that follow the spiral, blue-violet arms with pink star-forming specks, dark dust lanes on the inner edge of each arm, a warm cream-gold core and a soft rim. It becomes the only look; there is no style switch.

## What changes

- **Painted disc** replaces the nebula plane (`nebulaField`). The old nebula shader, its bake and the `?tune` panel are deleted, along with the README line about `?tune`.
  - A fragment shader baked once into a texture laid in the disc plane, riding `galaxyRoot`. Content and palette match the approved sample: line-integral-convolution strokes along the spiral flow at three scales, arm density from the same arm formula as the dust (so every beacon keeps its place), dark lanes at the inner arm edge, pink HII specks, patchy violet regions, warm core, ragged soft rim.
  - Resolution: 4096² on desktop, 2048² on touch devices. Half-float target where WebGL2 + `EXT_color_buffer_float` allow, 8-bit otherwise.
  - Progressive bake: a 1024² pass at load (cheap), then the full-resolution texture is filled in tiles over the following frames, then swapped in. No single long task on phones.
- **Brush strokes (dropped in review)**: the sample's instanced stroke layer faced −y, so it was back-face culled in every view above the disc — the approved look never contained it — and appeared only from below, where it washed the arms white. Made double-sided it whitened the disc and erased the dust lanes, so it was removed: the painted disc alone is the approved look, and the frame saves ~1–1.5 ms.
- **Near field ("far: painting, near: stars")**: the disc material fades the painting per fragment by view depth, so the part of the disc close to the camera dissolves into stars while the distant disc stays painted. Dust stars brighten as they get close and stay quiet from afar.
- **Dust stars**: 30k instead of 85k; colours unchanged; distance-dependent brightness.
- **Core glows**: the 440- and 270-unit halos are removed and the 80- and 150-unit glows dimmed; the disc paints its own core.
- **Edge-on**: the disc gets a little vertical thickness so it is not a hairline from the side.
- **Watchdog**: rungs unchanged.

## Unchanged

Beacon positions, external galaxies, the sky view, the Solar System, the bloom/ACES chain, video-mode determinism (the bake uses no `Math.random`; stroke generation does, deterministically under the video seed). The private promo pipeline's framings keep working but render the new look.

## Verification

- Self-test: painted disc and its two edge-on copies exist and share the baked texture, the old nebula shader is gone, dust count is 30k.
- A/B renders against main from the sample's views (tilt, load, flyover, near the Sun, top, edge) plus a view from below; a zero-height-at-load regression probe; frame time on desktop @2x and the phone profile; WebKit; video-mode audit state.
- Adversarial review, then a PR.
- README galaxy description updated in all four languages.

## Out of scope

External galaxies (sub-project 2) and the HUD (sub-project 3).
