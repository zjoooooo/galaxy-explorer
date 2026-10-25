# Painted External Galaxies Design

**Status:** Draft for owner review
**Date:** 2026-10-25

Sub-project 2 of 3. Sub-project 1 (the painted Milky Way) shipped in PR #20. Sub-project 3 (the sci-fi HUD frame and captions) follows as a separate spec.

## Objective

Paint all seven external galaxies in the same oil-paint style as the Milky Way. Each galaxy uses colours sampled from telescope images of that galaxy, so none of them is a recoloured Milky Way. The owner approved the direction from two scratch samples (M31 and the LMC, 2026-10-25).

## The approved samples

- **M31**: a cream-white nucleus and a tan-brown inner disc. Further out the disc turns mauve, then blue-violet. Two tightly wound arms read as nested arcs, with brown dust lanes on their inner edges. NGC 206 is painted under its marker. The stars are dimmed so the painting carries the light.
- **LMC**: the painting follows the photo plate. The cream bar sits in a blue-grey disc, with young blue regions where the plate is blue. Pink star-forming specks appear where the plate is red. 30 Doradus is a textured pink nebula with a bright heart, painted at the plate's real 30 Dor position. The strokes follow the plate's brightness contours. The cyan/rose raymarched volume and the stray white nucleus glow are gone.

## Architecture

**One shared bake program.** A single "uber" fragment shader paints every external galaxy, and per-galaxy uniforms choose the shape and colours. One program means one compile (about 0.2–0.3 s on the M5). It reuses the Milky Way's brush technique: noise smeared along a flow field at two scales (line-integral convolution) gives the strands, with patchy fbm on top. It works in the Milky Way's bake frame (`p = vP · 360/R`), so brush sizes scale with each galaxy. There are three kinds:

| kind | flow of the strokes | light | colour |
|---|---|---|---|
| 0 spiral disc | the galaxy's own arm winding (same formula as its star arms) | smooth old-star disc (exponential) + arms × an optional ring | palette by radius |
| 1 spheroid | concentric circles (isophotes) | Sérsic-like profile, low stroke contrast | palette by radius |
| 2 photo plate | along the plate's brightness contours | the plate's brightness | palette by plate brightness, plus blue/red hue read from the plate |

All kinds share the same optional terms: dust lanes on the inner arm edges (spirals), HII specks, up to four named "anchors" (a nebula or star cloud painted at its child-beacon position), and a core.

**Output.** Each bake writes an 8-bit target with the colour stored as its square root plus a 1-LSB dither, so dark outskirts keep their gradations, and the display shader squares it back. Sizes are 2048² on desktop and 1024² on touch devices. Targets are mipmapped with maximum anisotropy. The Milky Way keeps its own shader, target and look, byte for byte.

**Plate guides.** The photo galaxies (LMC, SMC, Cen A) read their plate from small CPU-downsampled copies (no mip-biased lookups inside loops, which are undefined in non-uniform control flow on some GPUs). The copies come from the `Image` the star sampler already loads, so nothing is fetched twice.

**Mounting.**
- **Discs** (kinds 0 and 2) are a plane in the galaxy's own disc plane, added as a child of the galaxy's star points. They inherit the orientation and the slow self-spin, and stay registered with the stars and the child beacons.
- **Spheroids** (kind 1) are a camera-facing quad. It is squashed along the projected short axis by the axis ratio for the current view: round seen along the axis, flattened by `q` edge-on. It is also a child of the points, with its uniform names chosen so the perf watchdog's `uSize`/`uCap` rescale never touches it.
- The display shader is the Milky Way's: additive, no fog, and fades by view depth so the painting dissolves into stars when the camera dives in. The fade distances scale with R.

**Scheduling.** The Milky Way's tile bake becomes a shared queue that renders one tile per frame. The Milky Way goes first, unchanged, then each external galaxy (plate galaxies join when their plate loads). An external galaxy has no preview: its painting fades in over about 0.6 s when its last tile lands. Video mode bakes every job synchronously, and the private pipeline's readiness check waits until no paint job is pending. A restored WebGL context re-bakes everything.

## Per galaxy

Colour hexes come from the scouting notes, sampled from the repo's own telescope images and published colour images. They are linearised before use.

- **M31** (spiral): as sampled. The star arms' winding changes from 0.9 to 1.5 to match the painted arcs. Stars are dimmed to 0.45. The inclination is unchanged; the true 77° tilt is out of scope (see below).
- **M33** (spiral, flocculent): low arm contrast and short arm fragments. The disc is blue-white (#d6e4ff → #6c86c8 outward) with a cream centre and no bulge. HII specks are far denser than in M31. NGC 604 is a rose-shelled anchor at its marker. The child glow shrinks so the painted shell shows. Fewer, bluer star knots.
- **M104** (spiral disc + spheroid): a smooth lavender-white disc with a star ring near the rim and tightly wound, low-contrast strokes. The ivory crown (#fffaf0 → #e6dccb → #8f867b) is a painted spheroid with axis ratio about 0.7. The existing dark ring lane stays as the absorber. The round halo/core sprites go; the nucleus pair stays.
- **M87** (spheroid): a smooth Sérsic glow, warm cream (#ffe3bd → #e0d9cc), with only gentle stroke texture along the isophotes and an axis ratio of about 0.8. The jet, nucleus and star points stay. The large halo sprite goes.
- **Cen A** (spheroid + existing lane): a round painted halo (#fff4e6 core → #9ba1ad rim) under the plate-sampled stars. The raymarched dust lane, the jets and the plate stars stay as they are. The halo/core sprites and the large veil go.
- **LMC** (plate): as sampled. The Tarantula marker moves to the plate's 30 Dor at (-8, 3, -27). The volume and the 30 Dor veil go.
- **SMC** (plate): a blue-white bar body (#c6d3f2) with a cream old-star envelope (#d8cfbe). Pink specks come from the plate's red, and NGC 346 is an anchor at its marker. The volume goes.

**Shared fix:** `coreOpacity: 0` currently falls back to 0.9 (`||`), which puts a white nucleus glow on both Clouds. It becomes `!= null`.

## Performance budget

- Bake, M5 desktop: about 60 ms of GPU per 2048² galaxy, in 16 tiles of about 4 ms. All galaxies are painted within about 3 s of load. On phones the tiles are 256².
- Frame: one extra textured draw per galaxy (two for M104). Removing the LMC/SMC raymarched volumes makes the frame cheaper near the Clouds.
- Memory: about 21 MiB per desktop 2048² target with mips, about 160 MiB in total with the Milky Way's unchanged 171 MiB; about 40 MiB on touch.
- The shader compile (about 0.2–0.3 s on the M5) happens once. It is measured during implementation and moved to wherever it hitches least (init vs. idle).

## Verification

- **Self-test:** every external galaxy has a painted mesh whose parent is its star points, with a baked texture of the expected size. The Clouds have no raymarched volume. No painted material has a `uSize`/`uCap` uniform. The Milky Way check passes unchanged.
- **A/B renders against main** for every galaxy from the far view (about 1750 u), arrival (3R), close (1.5R), oblique and from below, plus the load view and the video presets that frame external galaxies. Each painted galaxy is set beside its telescope image.
- **Frame time, bake time and compile time** on desktop and the phone profile. WebKit. Reduced motion. Video-mode audit, plus the readiness gate in the private pipeline (committed locally, never pushed).
- README galaxy text updated in all four languages ("the Clouds are raymarched volumes" goes).
- Adversarial review, then a PR.

## Out of scope

- The true inclinations (M31 77°, M33 53°) and M104's arrival from 6° above its plane. These change the promo framings, so they are a separate owner call.
- Painted dust that truly darkens (multiply passes) for M31/M33. Their lanes "paint less light", like the Milky Way's.
- M32/M110 satellites, M104 globular clusters, the M87 jet restyle.
- The HUD (sub-project 3).
