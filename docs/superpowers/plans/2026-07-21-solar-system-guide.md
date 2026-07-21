# Solar System Planet Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an immersive Solar System view between the Milky Way and Earth-centred sky views, with selectable planets, representative moons, dwarf planets, asteroid belt, multilingual cards, camera navigation, and hybrid LOD close detail.

**Architecture:** Add an independent `solarScene`, camera, controls, body hierarchy, labels, navigation state, and LOD manager inside the existing `index.html`; share the renderer, panel, language state, and animation loop. Keep the deployed application build-free and dependency-free, with local public-domain textures under `images/solar-system/` and deterministic browser self-tests exposed through `?solarTest=1`.

**Tech Stack:** HTML/CSS, ES5-style browser JavaScript, Three.js r128, OrbitControls, local image assets, existing bloom/render pipeline, browser console self-tests.

## Global Constraints

- Keep the runtime application in `index.html`; do not add a bundler, package manager, backend, API, or third-party JavaScript dependency.
- Support exactly `en`, `hans`, `hant`, `ja`, and `ko` for every new visible string and body card.
- Enter the Solar System only from the Solar System beacon card; enter the sky only from the Earth card.
- Use visual-readable body and orbit scales while cards show real measurements.
- Include the Sun, eight planets, Moon, Io, Europa, Ganymede, Callisto, Titan, Triton, Pluto, Ceres, and a noninteractive procedural asteroid belt.
- Pause orbital time during body focus and resume without phase jumps.
- Keep only the selected target at full LOD 2; cap mobile textures at 2K and permit desktop 4K only when supported.
- Prefer NASA/USGS public-domain assets and record every imported texture in `THIRD-PARTY-NOTICES.md`.
- Preserve existing galaxy, sky, language, music, cinema, resize, gesture, and Escape behaviour.
- Do not stage or modify unrelated existing `tools/` or `.superpowers/` files.

---

## File map

- Modify `index.html`: all runtime CSS, DOM, body data, scenes, navigation, labels, LOD, panel, animation, and self-tests.
- Create `images/solar-system/README.md`: texture filenames, target body, map type, source URL, author/agency, license/public-domain statement, and chosen resolution.
- Create `images/solar-system/*.jpg` and `images/solar-system/*.png`: local albedo, normal/bump, cloud, night, and ring maps acquired in Task 7.
- Modify `THIRD-PARTY-NOTICES.md`: redistribution and attribution records for the exact assets shipped.
- Modify `README.md`, `README.zh-CN.md`, `README.ja.md`, and `README.ko.md`: feature and control documentation after implementation is stable.

---

### Task 1: Solar data schema and deterministic self-tests

**Files:**
- Modify: `index.html` near the tunables and existing `assertBeaconInfo()` / `assertZodiacData()` helpers

**Interfaces:**
- Produces: `SOLAR_LANGS`, `SOLAR_BODIES`, `SOLAR_BY_ID`, `assertSolarData()`, `solarOrbitRadius(au)`, `solarDisplayRadius(km)`, and `runSolarSelfTests()`.
- Consumes: existing `beaconLang` language keys and `setMsg(text)`.

- [ ] **Step 1: Add the self-test runner before defining the data**

Add a `runSolarSelfTests()` function that records named failures instead of stopping at the first assertion:

```js
function runSolarSelfTests() {
  var failures = [];
  function check(name, fn) { try { fn(); } catch (e) { failures.push(name + ': ' + e.message); } }
  function ok(v, msg) { if (!v) throw new Error(msg); }
  check('data', function () { ok(assertSolarData(), 'assertSolarData did not return true'); });
  check('body-count', function () { ok(SOLAR_BODIES.length === 18, 'expected 18 selectable bodies'); });
  check('parents', function () {
    ['moon','io','europa','ganymede','callisto','titan','triton'].forEach(function (id) {
      ok(SOLAR_BY_ID[id] && SOLAR_BY_ID[SOLAR_BY_ID[id].parent], id + ' parent missing');
    });
  });
  check('scale-order', function () {
    ok(solarOrbitRadius(0.39) < solarOrbitRadius(30.1), 'orbit mapping is not monotonic');
    ok(solarDisplayRadius(4879) < solarDisplayRadius(139820), 'body mapping is not monotonic');
  });
  window.__solarTestResult = { passed: failures.length === 0, failures: failures };
  if (/[?&]solarTest=1/.test(location.search)) setMsg(failures.length ? failures.join(' | ') : 'solar self-tests passed');
  return window.__solarTestResult;
}
```

- [ ] **Step 2: Verify the self-test fails before the data exists**

Run `python3 -m http.server 8000`, open `http://localhost:8000/index.html?solarTest=1`, and run `runSolarSelfTests()` in the console.

Expected: `ReferenceError` for `assertSolarData`, proving the test is exercising missing implementation.

- [ ] **Step 3: Add the complete body data and scale helpers**

Define 18 selectable objects with stable IDs:

```js
var SOLAR_LANGS = ['en', 'hans', 'hant', 'ja', 'ko'];
var SOLAR_BODIES = [
  // sun, mercury, venus, earth, moon, mars, ceres, jupiter, io, europa,
  // ganymede, callisto, saturn, titan, uranus, neptune, triton, pluto
];
var SOLAR_BY_ID = {};
SOLAR_BODIES.forEach(function (b) { SOLAR_BY_ID[b.id] = b; });

function solarOrbitRadius(au) { return au <= 0 ? 0 : 25 + Math.log(1 + au * 1.8) * 42; }
function solarDisplayRadius(km) { return km <= 0 ? 0 : 0.8 + Math.pow(km / 4879, 0.38) * 1.55; }
```

Each body object must contain `id`, `parent`, `kind`, `radiusKm`, `distanceAu`, `periodDays`, `rotationHours`, `inclinationDeg`, `eccentricity`, `phase`, `tiltDeg`, `color`, `maps`, and `info`. Each `info[L]` must contain `name`, `type`, `distance`, `diameter`, `orbit`, `rotation`, `temperature`, `moons`, `facts`, `desc`, and `catalog`. Use real physical values in cards; keep display parameters separate.

- [ ] **Step 4: Add strict data validation**

Implement `assertSolarData()` to reject duplicate IDs, unresolved parents, invalid orbital numbers, absent five-language content, missing fact arrays, or an unexpected body set. Call it once after data construction in development and from the test runner.

- [ ] **Step 5: Verify the tests pass**

Reload `http://localhost:8000/index.html?solarTest=1` and run `runSolarSelfTests()`.

Expected: `{ passed: true, failures: [] }` and the overlay text `solar self-tests passed`.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(solar): add validated celestial body data"
```

---

### Task 2: Solar scene shell and galaxy-card entry

**Files:**
- Modify: `index.html` CSS/DOM near `#skyback`, renderer setup near `skyScene`, `renderPanel()`, and `bpBody` click delegation

**Interfaces:**
- Consumes: `SOLAR_BY_ID`, `renderPanel()`, `clearSelection()`, `renderer`, `beaconLang`.
- Produces: `solarScene`, `solarCamera`, `solarControls`, `solarRoot`, `solarLabelsEl`, `solarBackEl`, `enterSolar()`, `exitSolar()`, and view state values `galaxy | solar | sky`.

- [ ] **Step 1: Extend the self-test with entry assertions**

Add checks that `enterSolar` and `exitSolar` exist, `#solarlabels` and `#solarback` exist, and the Solar System beacon card contains `#bp-solar-link` but not `#bp-zodiac-link`.

- [ ] **Step 2: Verify the new assertions fail**

Reload with `?solarTest=1`.

Expected: failures naming `enterSolar`, `solarlabels`, and `bp-solar-link`.

- [ ] **Step 3: Add DOM and CSS for the independent view**

Add `#solarlabels`, `.solar-label`, and `#solarback` with the same overlay layering, responsive sizing, focus visibility, and cinema hiding rules used by sky labels and `#skyback`. Use `<button>` for Back and label actions rather than clickable `<div>` elements.

- [ ] **Step 4: Create the solar scene shell**

Initialize:

```js
var solarScene = new THREE.Scene();
var solarRoot = new THREE.Group(); solarScene.add(solarRoot);
var solarCamera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.05, 1800);
solarCamera.position.set(0, 105, 180);
var solarControls = new THREE.OrbitControls(solarCamera, renderer.domElement);
solarControls.enabled = false;
solarControls.enableDamping = true;
solarControls.dampingFactor = 0.08;
solarControls.minDistance = 2;
solarControls.maxDistance = 420;
```

Add a dim procedural star background and ambient/key lighting shell, but no planets yet.

- [ ] **Step 5: Replace the old Solar System card action**

In `renderPanel(0, lang)`, render localized `#bp-solar-link` text. Update delegated clicks so `#bp-solar-link` calls `enterSolar()`. Remove the direct `#bp-zodiac-link` path from the galaxy card.

- [ ] **Step 6: Implement top-level entry and exit**

`enterSolar()` saves the galaxy camera/target, closes the beacon panel, switches `viewMode`, disables galaxy/sky controls, enables solar controls, hides beacon/sky labels, and shows solar labels/back. `exitSolar()` reverses those steps and restores the exact saved galaxy camera and target.

- [ ] **Step 7: Add solar rendering and resize branches**

In `frame()`, branch `viewMode === 'solar'` before galaxy updates, call `solarControls.update()`, render `solarScene/solarCamera`, update solar labels, and return. Resize must update `solarCamera.aspect` and its projection matrix.

- [ ] **Step 8: Verify entry and exit**

Expected: selecting the Solar System beacon opens a card with **Explore the Solar System**; clicking it shows the empty solar star field; Back and Escape return to the identical galaxy camera view; existing sky view remains reachable only through direct console call until Task 5.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat(solar): add independent scene and galaxy entry"
```

---

### Task 3: Body hierarchy, orbits, motion, Sun, rings, and asteroid belt

**Files:**
- Modify: `index.html` solar scene section and frame loop

**Interfaces:**
- Consumes: `SOLAR_BODIES`, `solarOrbitRadius()`, `solarDisplayRadius()`, `solarRoot`, `perfScale`.
- Produces: `SOLAR_OBJECTS`, `buildSolarBodies()`, `buildAsteroidBelt(count)`, `updateSolarMotion(dt)`, `setSolarPaused(paused)`, and each object `{ orbitPivot, positionNode, tiltNode, spinNode, lodGroup, hitProxy, orbitLine }`.

- [ ] **Step 1: Add hierarchy and motion self-tests**

Test that all 18 bodies have runtime objects, moons are descendants of their parent `positionNode`, the belt uses one `THREE.Points`, and pausing preserves `solarElapsed` while shader time remains independent.

- [ ] **Step 2: Verify tests fail**

Expected: missing `buildSolarBodies`, `SOLAR_OBJECTS`, and `solarElapsed` failures.

- [ ] **Step 3: Build reusable low-cost materials and geometry**

Create one low- and one medium-subdivision sphere geometry, base Lambert/Phong materials per visual class, a glow sprite helper, and a transparent ring geometry. Do not allocate a unique geometry for every body.

- [ ] **Step 4: Build the hierarchical bodies**

For every body, create the documented pivot chain. Parent moon orbit pivots to the parent's `positionNode`; top-level bodies attach to `solarRoot`. Apply orbit inclination on the orbit group, axial tilt on `tiltNode`, and body rotation on `spinNode`. Store `userData.solarId` on visible meshes and hit proxies.

- [ ] **Step 5: Add display orbits and special forms**

Use line loops with low opacity for top-level orbits and hidden local moon orbits. Add the Sun glow/corona shell and Saturn's low-detail ring. Approximate eccentricity through ellipse geometry and position calculation; preserve Pluto's visible inclination.

- [ ] **Step 6: Add the deterministic asteroid belt**

Use a seeded PRNG and a single `THREE.BufferGeometry` with 2,000 points distributed across the Mars–Jupiter annulus. Exclude a small angular/radial region around Ceres and store the belt in `solarAsteroidBelt`.

- [ ] **Step 7: Add the pause-safe solar clock**

Track `solarElapsed` by accumulated frame delta only while `solarPaused === false`; clamp resume deltas after tab visibility changes. Calculate orbit angle from `phase + solarElapsed / compressedPeriod` and spin independently. Do not derive orbits directly from `performance.now()`.

- [ ] **Step 8: Verify hierarchy, motion, and pause**

Expected: overview shows all primary bodies, Pluto and Ceres; inner planets move faster; pause/resume never jumps; moons stay attached when their parent moves; belt remains one draw call.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat(solar): build orbiting bodies and asteroid belt"
```

---

### Task 4: Labels, raycasting, focus navigation, and camera restoration

**Files:**
- Modify: `index.html` solar CSS/DOM, pointer handlers, camera-flight helper, and solar update branch

**Interfaces:**
- Consumes: `SOLAR_OBJECTS`, `solarCamera`, `solarControls`, `setSolarPaused()`.
- Produces: `solarNav`, `selectSolarBody(id)`, `focusSolarBody(id)`, `leaveSolarLevel()`, `clearSolarCard()`, `updateSolarLabels()`, and `stepSolarFlight(now)`.

- [ ] **Step 1: Add state-machine self-tests**

Test pure transitions for overview → Earth focus → Moon focus → Earth focus → overview, and overview → Earth focus → sky → Earth focus. Test that closing a card clears only the card, not the focus level.

- [ ] **Step 2: Verify transition tests fail**

Expected: missing `solarNav` and `leaveSolarLevel` failures.

- [ ] **Step 3: Implement explicit navigation state**

Use:

```js
var solarNav = {
  level: 'overview', selectedId: null, parentId: null,
  cameraStack: [], galaxySnapshot: null, skySnapshot: null
};
```

Push `{ position, target, level, selectedId, parentId, panelOpen }` before entering a child spatial level. Pop exactly once for Back/Escape.

- [ ] **Step 4: Add projected HTML labels with decluttering**

Create one button per selectable body. Project the body's world position through `solarCamera`; hide labels behind the camera, outside the viewport, outside the active level, or losing overlap priority. Priority is selected target, local-system bodies, planets, dwarf planets.

- [ ] **Step 5: Add raycasting and touch-sized proxies**

On pointer release without drag, raycast only visible click proxies for the active level. Proxy radius must be at least the screen-equivalent of a practical 32 CSS-pixel target. Model and label clicks both call `selectSolarBody(id)`.

- [ ] **Step 6: Implement eased, interrupt-safe camera flights**

Reuse the existing ease-in-out concept but keep a separate `solarFlight`. On completion, set control target, min/max distances based on selected display radius, enable controls, and open the card. If interrupted, settle onto the current interpolated camera/target and re-enable controls.

- [ ] **Step 7: Reveal moons only in the parent system**

Earth, Jupiter, Saturn, and Neptune focus enables their moon models, local orbit lines, labels, and proxies. Leaving the parent system disables them. Moon-to-moon movement within Jupiter remains local and does not pass through overview.

- [ ] **Step 8: Verify navigation manually**

Expected: model/label clicks agree; focus pauses motion; Moon and Galilean systems navigate locally; closing the panel does not zoom out; Back/Escape pops one spatial level; overview exit restores the galaxy snapshot.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat(solar): add body selection and hierarchical camera navigation"
```

---

### Task 5: Multilingual cards and Earth-to-sky round trip

**Files:**
- Modify: `index.html` panel rendering, panel close handler, language repainting, `enterSky()`, `exitSky()`, and Escape handlers

**Interfaces:**
- Consumes: `SOLAR_BY_ID`, `solarNav`, `focusSolarBody()`, existing `bpEl`, `bpBody`, `enterSky()`, and `setBeaconLang()`.
- Produces: `renderSolarPanel(id, lang)`, `enterSkyFromEarth()`, `returnSkyToEarth()`, and localized solar navigation text.

- [ ] **Step 1: Add card and sky-return tests**

For each language and body, render the card and assert name/type plus required fact rows exist. Assert Earth alone contains `#bp-earth-sky-link`. Simulate the pure state change Earth → sky → Earth and assert camera/panel restoration flags.

- [ ] **Step 2: Verify the tests fail**

Expected: missing `renderSolarPanel` and Earth sky link failures.

- [ ] **Step 3: Implement the reusable Solar System panel renderer**

Render localized rows for distance, diameter, orbit, rotation, temperature, moons, facts, description, and catalog using `esc()`. Use body-specific accent colours without changing the shared responsive panel shell.

- [ ] **Step 4: Route close and language behaviour by view**

Panel close in `viewMode === 'solar'` calls `clearSolarCard()` only. `setBeaconLang()` repaints visible solar labels, Back text, and the open solar card without modifying `solarNav` or the camera.

- [ ] **Step 5: Move the sky entry into the Earth card**

Append a semantic button `#bp-earth-sky-link` after Earth's facts and description. Remove any remaining galaxy-card zodiac link. Delegated click calls `enterSkyFromEarth()` only when the current solar selection is Earth.

- [ ] **Step 6: Generalize sky entry/exit context**

`enterSkyFromEarth()` records the Earth camera/target/selection/panel state, then activates the existing sky scene. `exitSky()` checks its origin: if Earth, restore Solar System Earth focus and card; otherwise preserve legacy defensive behaviour for direct calls. The sky Back label becomes localized **Back to Earth** in this context.

- [ ] **Step 7: Unify Escape precedence**

Order must be: close open sky/solar card; leave sky to Earth; leave moon focus; leave planet focus; leave Solar System; then existing cinema behaviour. Ensure only one handler consumes an Escape event using `stopImmediatePropagation()` where required.

- [ ] **Step 8: Verify all five languages and routes**

Expected: every body card renders in five languages; changing language in Moon focus keeps the Moon selected; Earth → sky → Back returns to the same Earth view and open card; the Solar System galaxy card no longer exposes sky directly.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat(solar): add multilingual cards and Earth sky gateway"
```

---

### Task 6: LOD manager and graceful texture fallback

**Files:**
- Modify: `index.html` solar materials, body builder, and solar update branch

**Interfaces:**
- Consumes: `SOLAR_OBJECTS[id].lodGroup`, body `maps`, `renderer.capabilities`, current `perfScale`.
- Produces: `solarLOD`, `chooseSolarLOD(id, distance)`, `loadSolarMaps(id, tier)`, `applySolarLOD(id, tier)`, and `updateSolarLOD()`.

- [ ] **Step 1: Add LOD decision and failure tests**

Test threshold hysteresis, mobile 2K ceiling, desktop capability selection, only-one-active-LOD2 invariant, and rejected texture promise fallback to LOD 1.

- [ ] **Step 2: Verify tests fail**

Expected: missing `chooseSolarLOD` and `loadSolarMaps` failures.

- [ ] **Step 3: Implement deterministic LOD state**

Use one manager object:

```js
var solarLOD = { active2: null, cache: {}, pending: {}, quality: 1, mobile: matchMedia('(pointer:coarse)').matches };
```

`chooseSolarLOD()` returns 0, 1, or 2 using body-radius-relative distance and different enter/leave thresholds. Only the selected body may return 2.

- [ ] **Step 4: Implement cached asynchronous map loading**

Wrap `THREE.TextureLoader.load()` in a Promise, cache fulfilled textures by URL, deduplicate pending requests, set colour-space-compatible encoding for albedo maps supported by r128, and resolve failures as `null` rather than throwing into the animation loop.

- [ ] **Step 5: Implement material application and cross-fade**

LOD 0 uses procedural/base materials; LOD 1 uses medium geometry and available 1K–2K maps; LOD 2 uses selected 2K/4K maps and specialty layers. Keep old/new meshes overlapped during a short opacity fade, then disable the old tier. Never change `userData.solarId` or click proxies during swaps.

- [ ] **Step 6: Add specialty close layers**

Enable Earth clouds/ocean/night/atmosphere, Sun noise/corona, giant-planet slow shader distortion, rocky bump/normal maps, and Saturn detailed rings only at their intended tiers. Drive decorative shader time while orbital time is paused.

- [ ] **Step 7: Verify fallback and switching**

Temporarily point one map to a missing filename. Expected: the camera completes, card opens, body stays visible at LOD 1, console records one warning, and repeated focus does not retry continuously. Restore the valid path afterward.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat(solar): add hybrid LOD and texture fallback"
```

---

### Task 7: Acquire and document public-domain texture assets

**Files:**
- Create: `images/solar-system/README.md`
- Create: selected `images/solar-system/*.{jpg,png}` files referenced by `SOLAR_BODIES[*].maps`
- Modify: `THIRD-PARTY-NOTICES.md`

**Interfaces:**
- Consumes: exact map filenames defined in Task 1 and loader behaviour from Task 6.
- Produces: every referenced LOD 1/2 local map and a verifiable source/license record.

- [ ] **Step 1: Inventory exact required maps**

List every non-null path from `SOLAR_BODIES[*].maps` and classify it as albedo, bump/normal, cloud, night, or ring. No downloaded file may exist without a data reference, and no data reference may lack a planned local file.

- [ ] **Step 2: Verify missing assets fail gracefully before download**

Focus Earth and Saturn with the browser Network panel open.

Expected: 404s fall back to LOD 1 without blocking navigation, matching Task 6.

- [ ] **Step 3: Download only redistributable source material**

Use NASA Solar System Exploration, NASA Visible Earth, NASA Scientific Visualization Studio, or USGS Astrogeology primary-source pages. For each source, record the direct source page, agency, title, modification performed, resolution, and the quoted public-domain/license basis in `images/solar-system/README.md`. Do not use unattributed texture-pack mirrors.

- [ ] **Step 4: Normalize files for browser delivery**

Create power-of-two 1K/2K assets and optional desktop 4K assets. Use JPEG for opaque albedo/bump maps and PNG only where alpha is required (clouds/rings). Remove unnecessary metadata and visually inspect seams before keeping a file.

- [ ] **Step 5: Update third-party notices**

Add one table row per shipped source asset or source set with local filenames, source-page link, agency/creator, and license/public-domain status. The local README may contain processing details; `THIRD-PARTY-NOTICES.md` remains the distribution-facing record.

- [ ] **Step 6: Verify every configured map loads locally**

Serve the repository and inspect Network requests while focusing Earth, Moon, Mars, Jupiter, Saturn, and Neptune.

Expected: zero texture 404s, correct MIME types, no runtime cross-origin requests, and visible surface detail at close range.

- [ ] **Step 7: Commit**

```bash
git add images/solar-system THIRD-PARTY-NOTICES.md index.html
git commit -m "assets(solar): add documented planetary textures"
```

---

### Task 8: Adaptive performance, accessibility, responsive layout, and regression

**Files:**
- Modify: `index.html` CSS, performance watchdog, gesture handlers, keyboard handlers, and self-tests

**Interfaces:**
- Consumes: `solarLOD`, `buildAsteroidBelt()`, `solarNav`, existing `perfEMA`, cinema and music functions.
- Produces: `applySolarPerformanceTier(scale)`, reduced-motion camera durations, and final browser verification report through `window.__solarTestResult`.

- [ ] **Step 1: Extend tests for invariants and accessibility**

Assert visible solar labels/back actions are buttons with accessible names, all focusable actions have focus styles, reduced motion produces zero/short flight duration, selected-body detail survives lowest performance tier, and resize updates all three camera aspects.

- [ ] **Step 2: Verify new checks fail**

Expected: failures for performance tier and reduced-motion behaviour.

- [ ] **Step 3: Add ordered degradation**

`applySolarPerformanceTier(scale)` reduces asteroid draw range first, then background density/update rate, nonselected label update frequency, texture ceiling, and specialty shader complexity. It must never hide a selected object, remove its click proxy, or close its card.

- [ ] **Step 4: Add reduced-motion and focus accessibility**

Read `matchMedia('(prefers-reduced-motion: reduce)')`; shorten body flights to at most 120 ms and remove decorative auto-rotation when true. Ensure Back, labels, panel close, Solar entry, and Earth sky entry have localized `aria-label`s and visible keyboard focus.

- [ ] **Step 5: Finish mobile layout and gesture routing**

On narrow/coarse-pointer screens, keep the selected body framed above the bottom drawer, enlarge touch proxies, cap maps at 2K, and route Safari pinch to `solarCamera/solarControls` when `viewMode === 'solar'` instead of the galaxy camera.

- [ ] **Step 6: Run the full self-test suite**

Open `http://localhost:8000/index.html?solarTest=1`.

Expected: `{ passed: true, failures: [] }` and no uncaught console errors.

- [ ] **Step 7: Run the desktop regression matrix**

Verify in all five languages: galaxy beacon/card, Solar entry, overview motion, every primary body, Earth/Moon, all four Galilean moons, Titan, Triton, Pluto, Ceres, Earth sky round trip, nested Escape, Back, cinema, music, resize, and language persistence.

- [ ] **Step 8: Run mobile and low-performance checks**

At 390×844 and device scale factor 2, verify bottom drawer framing, touch labels, pinch, 2K ceiling, and Back reachability. Force `perfScale = 0.25`; expected: lower belt/background quality while selected LOD remains clear and interactive.

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "perf(solar): add adaptive detail and accessible controls"
```

---

### Task 9: Documentation and final end-to-end verification

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `README.ja.md`
- Modify: `README.ko.md`
- Modify: `docs/superpowers/specs/2026-07-21-solar-system-guide-design.md`

**Interfaces:**
- Consumes: final UI labels, routes, controls, assets, and test results.
- Produces: user-facing feature/control documentation and final spec status.

- [ ] **Step 1: Update multilingual feature documentation**

Describe the route **Solar System beacon → Explore Solar System → Earth → View Earth's Sky**, free orbit/zoom, body focus, representative moons, dwarf planets, asteroid belt, and local LOD textures. Do not claim literal scale or real-time positions.

- [ ] **Step 2: Update control tables**

Document click-to-focus, drag, wheel/pinch, Back, staged Escape, `F`, and `M` consistently in each README.

- [ ] **Step 3: Run clean-load verification**

Start a fresh private browser context with an empty cache, load the normal URL without test flags, traverse galaxy → Solar overview → Earth → sky → Earth → overview → galaxy, then repeat one outer-planet/moon route.

Expected: no 404s, uncaught errors, blank frames, stale labels, motion jumps, or incorrect return targets.

- [ ] **Step 4: Run static repository checks**

```bash
git diff --check
rg -n "bp-zodiac-link|Constellations · view the night sky" index.html README*.md images/solar-system/README.md THIRD-PARTY-NOTICES.md
```

Expected: `git diff --check` exits 0 and no obsolete direct galaxy zodiac link remains.

- [ ] **Step 5: Mark the specification implemented**

Change the design-spec status to `Implemented and verified` only after Steps 3–4 succeed.

- [ ] **Step 6: Commit**

```bash
git add README.md README.zh-CN.md README.ja.md README.ko.md docs/superpowers/specs/2026-07-21-solar-system-guide-design.md
git commit -m "docs: document the Solar System guide"
```
