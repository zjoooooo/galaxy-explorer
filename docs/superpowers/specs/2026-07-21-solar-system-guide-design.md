# Solar System Planet Guide — Design Spec

- **Date:** 2026-07-21
- **Status:** Approved, implementation planned
- **Scope:** Add a free-exploration Solar System view to the existing single-file Three.js application, including the Sun, eight planets, selected moons, Pluto, Ceres, and a procedural asteroid belt.

## 1. Product goal

The Solar System guide is an immersive, freely explorable layer between the Milky Way view and the existing Earth-centred sky view. It should feel like part of the current experience rather than a separate mini-application: the same renderer, visual language, multilingual information panel, camera easing, keyboard conventions, and no-build deployment model remain in use.

The guide favours visual readability over literal scale. Orbital order and relative relationships remain recognizable, while the information cards provide real measurements so the presentation does not imply that the display scale is scientifically exact.

## 2. Confirmed content

Interactive bodies:

- Sun and all eight planets.
- Earth's Moon.
- Io, Europa, Ganymede, and Callisto around Jupiter.
- Titan around Saturn.
- Triton around Neptune.
- Pluto and Ceres as dwarf planets.

The asteroid belt appears between Mars and Jupiter. It is a visual environment rather than one selectable object; Ceres is the selectable representative body within it. Saturn's rings are part of Saturn's presentation and are not separately selectable.

Out of scope for this version:

- Real-time ephemerides, date selection, or historically accurate initial positions.
- Every moon, dwarf planet, comet, spacecraft, or planetary interior.
- A literal-scale viewing mode.
- Runtime APIs, remote textures, or new third-party JavaScript dependencies.

## 3. Navigation and view states

The top-level application uses three independent Three.js scenes with one renderer and one animation loop:

- `scene` for the Milky Way.
- `solarScene` for the Solar System.
- `skyScene` for the existing Earth-centred celestial sphere.

`viewMode` is expanded to represent `galaxy`, `solar`, and `sky`. Solar navigation has its own substate: `overview`, `body-focus`, or `moon-focus`.

### 3.1 Entry changes

The existing Solar System beacon card in the galaxy view remains the only entry to the new guide. Its current sky-view action is replaced by a localized **Explore the Solar System** action. The old direct galaxy-to-sky entry is removed.

The sky entry moves to the lower portion of Earth's information card inside the Solar System view, after the core facts and descriptive content. Its meaning is explicitly Earth-centred, for example:

> From Earth, look up at the sky
> Explore zodiac constellations and deep-sky objects →

### 3.2 State hierarchy

```text
galaxy
  └─ solar overview
       └─ planet or dwarf-planet focus
            ├─ moon focus
            └─ sky (Earth only)
```

Entering a child state records a camera snapshot and selection context for its parent. Returning from the sky restores Earth's close view, camera direction, selection, and open Earth card. Returning from a moon restores its parent-planet system. Returning from a planet restores the Solar System overview and resumes orbital time. Returning from the overview restores the galaxy camera exactly as it was before entry.

Escape follows the visible hierarchy: close an open card first, then leave moon focus, then planet focus, then the Solar System. The existing back button receives a label appropriate to the current level. Cinema mode, music controls, and language controls continue to work in every view.

## 4. Solar scene architecture

The Solar System is an independent `solarScene` with `solarCamera` and `solarControls`. This follows the existing sky-scene pattern and avoids mixing astronomical scales, near/far clipping requirements, raycasting, and lighting with the Milky Way scene.

The implementation is divided into focused sections inside `index.html`:

1. `SOLAR_BODIES` stores identity, parent relationships, orbital values, physical facts, localized copy, and rendering parameters.
2. `buildSolarScene()` creates lights, background, orbit guides, celestial models, and the asteroid belt.
3. A body hierarchy gives each object an orbit pivot, position node, axial-tilt node, spin node, visible meshes, and click proxy. Moons are descendants of their parent planet's position node.
4. `SolarNavigation` owns view/substate transitions, camera snapshots, orbital pause state, and back/Escape behaviour.
5. `SolarLabels` projects localized HTML labels, resolves overlap, and manages visibility by focus level.
6. `SolarSelection` unifies raycaster hits and HTML-label clicks through one selection function.
7. `renderSolarPanel()` renders body data into the existing beacon panel and appends the sky action for Earth.

Only the active scene is updated and rendered. Inactive scenes retain their state without consuming their normal per-frame rendering cost.

## 5. Scale and orbital motion

Display radii and body radii use separate nonlinear mappings:

- Orbital distance preserves ordering and broad relative spacing but compresses the vast outer-system gaps.
- Body size preserves the recognizable hierarchy while enlarging small bodies enough to see and select.
- Real diameter, average solar distance, orbital period, and rotation period are always shown in the card.

Orbits use the correct broad character where it matters visually. Pluto has an inclined elliptical orbit, and Ceres lies within the asteroid belt. Other planets may use modest eccentricity and inclination values where they are visible without harming readability.

Default motion is continuous. Relative orbital periods are compressed so inner planets move noticeably faster than outer planets, without producing frantic motion. Bodies rotate slowly and Venus preserves retrograde rotation. Initial orbital phases are art-directed to avoid label collisions; they do not claim to represent the current date.

Selecting a body pauses orbital time before the camera flight. Surface animation, the Sun's shader motion, atmosphere effects, and camera controls may continue. Returning to the overview resumes from the exact paused phase, without a position jump.

## 6. Progressive two-level exploration

The overview exposes the Sun, planets, Pluto, and Ceres. Representative moons do not compete for labels or clicks at this level.

When Earth, Jupiter, Saturn, or Neptune is focused:

- Its representative moons become visible and selectable.
- Local orbit guides fade in.
- Labels are restricted to the planet and its available moons.
- Clicking a moon performs a shorter local camera flight without leaving the planet system.

Closing a moon card does not automatically leave moon focus. The user can continue orbiting the moon or use Back/Escape to return one level. This distinguishes closing information from changing spatial context.

## 7. Interaction and labels

Users rotate with drag and zoom with the wheel or pinch, consistent with the existing application. Clicking a visible mesh, its enlarged invisible click proxy, or its HTML label invokes the same selection path.

On selection:

1. Orbital time pauses.
2. The target orbit and parent-child relationship brighten while unrelated guides and labels dim.
3. The camera flies with eased interpolation and retargets `OrbitControls` to the body.
4. The information card opens at the end of the flight.
5. The user can orbit and zoom within guarded near/far bounds.

Labels reuse the existing screen-projected HTML approach. Overlap priority is: selected body, focused-system bodies, planets, dwarf planets. Small objects receive a click proxy larger than their visible geometry. The asteroid belt itself is not raycastable.

## 8. Information cards and localization

The existing desktop right panel and mobile bottom drawer are reused. Each selectable body provides:

- Localized name and body classification.
- Real diameter.
- Average distance from the Sun.
- Orbital and rotation periods.
- Mean temperature.
- Known moon count where applicable.
- Two or three concise explanatory paragraphs.
- Two or three distinctive facts.
- English/catalogue name or astronomical symbol where useful.

All new labels, controls, facts, descriptions, error text, and navigation actions support the existing five languages: English, Simplified Chinese, Traditional Chinese, Japanese, and Korean. Changing language repaints visible labels and any open Solar System card without resetting the view.

## 9. Visual treatment

The visual language remains cinematic and code-driven while close views gain real astronomical detail.

- The Sun uses layered emissive spheres, animated shader noise, corona glow, and restrained bloom.
- Rocky planets use real local albedo textures at close range, with bump or normal detail when a suitable public-domain source exists.
- Earth adds a separate cloud layer, ocean specular response, atmosphere rim, and subtle night-side lights.
- Gas and ice giants use real banded textures with slow shader distortion rather than visibly rotating a static flat image alone.
- Saturn uses a transparent high-detail ring texture with radial variation.
- The background is a subdued procedural star field so orbit guides and illuminated bodies remain legible.
- Orbit lines are faint by default and brighten only in the active relationship.

Texture sources must permit redistribution. NASA and USGS public-domain sources are preferred, and every imported asset is recorded in `THIRD-PARTY-NOTICES.md`.

## 10. Hybrid LOD and resource lifecycle

Every major body supports three presentation levels.

### LOD 0 — overview

- Shared low-subdivision sphere geometry and procedural/base colour.
- No high-resolution texture, normal map, cloud layer, or costly close effect.
- Moons hidden or reduced to noninteractive light points.
- Asteroid belt rendered as a single `THREE.Points` draw call.

### LOD 1 — planetary-system view

- Medium-subdivision geometry and 1K–2K albedo where already available.
- Representative moons, ring systems, atmosphere/cloud layers, and modest bump response.
- Nonessential background updates and the asteroid belt update rate are reduced.

### LOD 2 — selected-body inspection

- Lazily loaded local 2K–4K albedo plus bump/normal resources.
- Earth enables clouds, ocean response, night side, and atmosphere.
- The Sun and giant planets enable their close shader treatments.
- Saturn enables its detailed ring material.
- Only the current target is active at complete LOD 2; other bodies fall back to LOD 0 or LOD 1.

The camera flight begins immediately with LOD 1. When LOD 2 resources finish, materials cross-fade rather than pop. Failed loads retain the procedural or LOD 1 material and do not block navigation or the card.

Desktop can use 4K textures when GPU capability and texture limits permit; mobile is capped at 2K. Anisotropy is capped conservatively. Loaded resources are cached to prevent repeated network/decode work, while only one full LOD 2 presentation stays active. LOD thresholds include hysteresis so small camera movements cannot cause rapid toggling.

The existing FPS adaptation is extended to reduce, in order: asteroid count, background detail, nonselected label update frequency, texture ceiling, and close-effect complexity. It must not remove a selected body or make its card inaccessible.

## 11. Asteroid belt

The belt contains roughly 1,500–2,500 seeded points distributed across an annulus between Mars and Jupiter, with controlled radial noise, modest vertical thickness, and sparse gaps. A fixed seed makes the visual repeatable. The points use one geometry/material and a low-cost shader or sprite texture. Ceres is a separate celestial body embedded at an appropriate belt radius and is excluded from the random point population around its immediate position.

## 12. Error handling and accessibility

- A missing high-resolution texture falls back to LOD 1 with no modal error.
- Invalid body data is reported by development assertions and skipped without breaking the scene.
- Camera-flight interruption settles on a valid control target rather than leaving controls disabled.
- Pointer, touch, and keyboard return paths remain available.
- Click proxies meet practical touch-target sizes even when the visual body is small.
- Interactive HTML labels and navigation actions use buttons with accessible names and visible focus states.
- Motion remains calm; a reduced-motion preference shortens or removes camera interpolation and avoids fast decorative rotation.

## 13. Verification

### Data assertions

- IDs are unique and parent IDs resolve.
- Physical/orbital values fall within valid ranges.
- Five-language fields required by the card and controls are complete.
- Every selectable body has a click proxy and card data.
- The confirmed body list and parent-child relationships are present.

### Navigation and interaction

- Galaxy → Solar System card → overview → planet → moon works by model and label clicks.
- Earth → sky → Earth restores the camera, selection, card, and pause state.
- Closing a card and leaving a focus level remain distinct actions.
- Back and Escape unwind exactly one level at a time.
- Returning to the galaxy restores the previous galaxy camera and controls.
- Language changes and cinema mode do not reset selection.

### Animation and LOD

- Focus pauses orbital time; return resumes without phase jumps.
- LOD transitions do not flash, leak duplicate meshes, or change click identity.
- Texture failure visibly falls back and leaves the target usable.
- Earth, Moon, Mars, Jupiter, and Saturn receive dedicated close-detail review.
- Desktop and mobile use the intended maximum texture tiers.

### Regression and performance

- Existing galaxy beacons, sky constellations/deep-sky objects, music, language persistence, cinema mode, resizing, and Escape semantics continue to work.
- A typical laptop should remain near 50–60 FPS in the overview.
- Under load, asteroid and background quality degrade before selected-body detail or interaction.
- Mobile layout keeps the focused body visible above the bottom drawer and preserves a reachable Back action.
