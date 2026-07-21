# Solar Selection and Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Solar System selection immediate and non-disruptive, slow the presentation motion, give the Sun a layered galactic-core treatment, and add local credited imagery to every Solar information card.

**Architecture:** Keep the existing single-file Three.js architecture and embedded `?solarTest=1` regression harness. Selection remains a navigation-state change but becomes independent from camera movement and simulation pause. The Sun reuses shared glow primitives inside its existing LOD group, while card imagery reads from the existing body records and local texture inventory.

**Tech Stack:** HTML5, CSS, browser JavaScript, Three.js r128-compatible APIs, embedded browser self-tests, Playwright Chromium smoke testing.

## Global Constraints

- Selecting any Solar body must not change the Solar camera position, target, zoom bounds, or orientation.
- Selecting a body must not pause orbital, axial, asteroid-belt, backdrop, or shader motion.
- Axial presentation rate is `0.20`; orbital presentation rate is `0.35`.
- The Sun uses four additive glow layers and one small fixed detail layer without another renderer or animation loop.
- Every Solar card uses a local image and a non-empty credit; no runtime remote request is allowed.
- Five languages, Earth-to-sky routing, mobile drawer behaviour, Back/Escape hierarchy, LOD2 ownership, and reduced-motion behaviour remain supported.
- Tracked files and commit messages must not contain the two prohibited assistant-product names specified by the repository owner.

## File Structure

- Modify: `index.html` — Solar data metadata, motion constants, selection behaviour, Sun layers, embedded self-tests, and panel markup.
- Modify: `README.md` — describe immediate non-pausing selection and slower presentation motion.
- Modify: `README.zh-CN.md` — Simplified Chinese user-facing control description.
- Modify: `README.ja.md` — Japanese user-facing control description.
- Modify: `README.ko.md` — Korean user-facing control description.
- Reference only: `images/solar-system/README.md` — authoritative local image provenance used for concise card credits.

---

### Task 1: Immediate Selection and Slower Continuous Motion

**Files:**
- Modify: `index.html:560-690`
- Modify: `index.html:2035-2063`
- Modify: `index.html:2238-2400`

**Interfaces:**
- Consumes: `updateSolarMotion(dt: number)`, `solarSnapshot()`, `updateSolarVisibility()`, `renderSolarPanel(id, lang)`.
- Produces: `SOLAR_ORBIT_RATE: number`, `SOLAR_SPIN_RATE: number`, and `focusSolarBody(id: string): boolean` with no camera or pause side effects.

- [ ] **Step 1: Replace flight-based navigation assertions with failing immediate-selection assertions**

In the `solar-navigation` self-test, snapshot the full camera and motion state before selection and assert immediate card rendering, stable controls, and continued movement:

```js
var cameraBefore = {
  position: solarCamera.position.clone(),
  quaternion: solarCamera.quaternion.clone(),
  target: solarControls.target.clone(),
  min: solarControls.minDistance,
  max: solarControls.maxDistance
};
var elapsedBeforeSelection = solarElapsed;
focusSolarBody('earth');
ok(!solarFlight, 'Earth selection created a camera flight');
ok(solarCardOpen && document.getElementById('bp-name').textContent === SOLAR_BY_ID.earth.info[beaconLang].name, 'Earth selection did not open its card immediately');
ok(solarCamera.position.distanceTo(cameraBefore.position) === 0 && solarCamera.quaternion.angleTo(cameraBefore.quaternion) === 0 && solarControls.target.distanceTo(cameraBefore.target) === 0, 'Earth selection changed the camera');
ok(solarControls.minDistance === cameraBefore.min && solarControls.maxDistance === cameraBefore.max, 'Earth selection changed zoom bounds');
updateSolarMotion(0.05);
ok(solarElapsed > elapsedBeforeSelection && !solarPaused, 'Earth selection stopped Solar motion');
```

Add equivalent Moon assertions after selecting Earth: `focusSolarBody('moon')` must open the Moon card immediately, preserve the same camera snapshot, keep `parentId === 'earth'`, and leave `solarPaused === false`.

- [ ] **Step 2: Run the self-test and confirm the old behaviour fails**

Run a local static server from the worktree and open `http://127.0.0.1:4173/?solarTest=1` in one Playwright Chromium instance.

Expected: failures report that selection created `solarFlight`, did not render immediately, changed the camera after flight, or paused Solar motion.

- [ ] **Step 3: Add explicit presentation-rate constants and apply them once**

Place the constants beside `solarElapsed`:

```js
var SOLAR_ORBIT_RATE = 0.35, SOLAR_SPIN_RATE = 0.20;
```

Keep `solarElapsed` as elapsed simulation time and apply the rates at transform calculation sites:

```js
var orbitElapsed = solarElapsed * SOLAR_ORBIT_RATE;
if (body.id !== 'sun') solarOrbitPoint(body, body.phase + orbitElapsed / object.compressedPeriod, object.positionNode.position);
object.spinNode.rotation.y = solarElapsed * SOLAR_SPIN_RATE / Math.max(0.3, Math.abs(body.rotationHours) / 120);
```

Use `orbitElapsed` for the Ceres-aligned asteroid-belt angle as well. Update the initial belt angle in `buildAsteroidBelt()` to use `solarElapsed * SOLAR_ORBIT_RATE` so construction and animation share the same formula.

- [ ] **Step 4: Make body selection immediate and non-pausing**

In `focusSolarBody()`, preserve the existing hierarchy and snapshot pushes, then replace the flight path with:

```js
clearSolarCard();
setSolarPaused(false);
updateSolarVisibility();
updateSolarNavigationText();
renderSolarPanel(id, beaconLang);
updateSolarLOD();
return true;
```

Do not change `solarCamera`, `solarControls.target`, `minDistance`, `maxDistance`, or `solarControls.enabled`. Remove the complete body-flight path: the `solarFlight` state variable, `settleSolarFlight()`, `startSolarFlight()`, `stepSolarFlight()`, the resize-time flight rewrite, the frame-loop flight step, and all test-fixture snapshots or assertions that exist only for that state. `leaveSolarLevel()` must begin directly with its existing sky/snapshot restoration logic.

Change `frameSolarForViewport()` so opening a compact drawer never reframes the selected body:

```js
function frameSolarForViewport() { return false; }
```

If the function has no caller that needs a return value, remove the function and its call from `refreshSolarResponsiveState()` instead.

- [ ] **Step 5: Verify selection, motion, and hierarchy pass**

Run the embedded self-test again.

Expected: `solar self-tests passed`; selection card is open synchronously, camera and zoom bounds are unchanged, `solarPaused` stays false, elapsed time and transforms advance, Earth-to-Moon hierarchy and Back/Escape tests pass.

- [ ] **Step 6: Commit Task 1**

```bash
git add index.html
git commit -m "fix(solar): keep selection immediate and in motion"
```

---

### Task 2: Layered Galactic-Core Sun

**Files:**
- Modify: `index.html:420-535`
- Modify: `index.html:1640-1710`
- Modify: `index.html:1925-2000`
- Modify: `index.html:2035-2052`

**Interfaces:**
- Consumes: shared `GLOW_TEX`, the Sun's `lodGroup`, `solarReducedMotion()`, `solarShaderTime`, and `applySolarSpecialtyTier()`.
- Produces: `solarSunGlows: Array<{sprite: THREE.Sprite, baseScale: number, baseOpacity: number}>` and `makeSolarCoreLayers(radius: number, parent: THREE.Object3D): Array`.

- [ ] **Step 1: Add failing Sun-layer and reduced-motion assertions**

Add a `solar-sun-core-layers` self-test:

```js
ok(Array.isArray(solarSunGlows) && solarSunGlows.length === 4, 'Sun does not have four galactic-core glow layers');
var colors = solarSunGlows.map(function (layer) { return layer.sprite.material.color.getHex(); });
ok(colors.join(',') === [0xfffdf6, 0xfff3da, 0xffcf78, 0xff9b3f].join(','), 'Sun core glow palette is incorrect');
ok(solarSunGlows.every(function (layer) { return layer.sprite.parent === SOLAR_OBJECTS.sun.lodGroup && layer.sprite.material.blending === THREE.AdditiveBlending; }), 'Sun core layers are not additive children of the Sun LOD group');
var movingScale = solarSunGlows[0].sprite.scale.x;
solarMotionOverride = false; updateSolarMotion(0.15);
ok(solarSunGlows[0].sprite.scale.x !== movingScale, 'Sun core breathing did not advance');
solarMotionOverride = true;
var reducedScale = solarSunGlows[0].sprite.scale.x; updateSolarMotion(0.15);
ok(solarSunGlows[0].sprite.scale.x === reducedScale, 'reduced motion did not freeze Sun breathing');
```

Snapshot and restore `solarMotionOverride`, `solarShaderTime`, and every layer scale in the test fixture.

- [ ] **Step 2: Run the self-test and confirm the missing layers fail**

Run `?solarTest=1` in the single controlled browser.

Expected: failure `solarSunGlows is not defined` or `Sun does not have four galactic-core glow layers`.

- [ ] **Step 3: Build four reusable core layers**

Replace the one-off `solarGlowSprite` path with:

```js
var solarSunGlows = [];
function makeSolarCoreLayers(radius, parent) {
  var layers = [
    { color: 0xfffdf6, scale: 2.15, opacity: 0.78 },
    { color: 0xfff3da, scale: 2.75, opacity: 0.52 },
    { color: 0xffcf78, scale: 3.55, opacity: 0.28 },
    { color: 0xff9b3f, scale: 4.45, opacity: 0.12 }
  ];
  return layers.map(function (layer) {
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: GLOW_TEX, color: layer.color, transparent: true,
      opacity: layer.opacity, depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    var baseScale = radius * layer.scale;
    sprite.scale.set(baseScale, baseScale, 1);
    sprite.userData.solarId = 'sun';
    parent.add(sprite);
    return { sprite: sprite, baseScale: baseScale, baseOpacity: layer.opacity };
  });
}
```

In the Sun branch of `buildSolarBodies()`, assign `solarSunGlows = makeSolarCoreLayers(radius, lodGroup)`. Keep the sphere and shader-noise LOD mesh for depth and surface texture. Retain a faint corona mesh only if it does not visually duplicate the four sprites; otherwise remove `solarGlowSprite` and the old single corona/glow specialty references.

- [ ] **Step 4: Animate one slow breathing cycle without extra render work**

Inside the existing `!solarReducedMotion()` block of `updateSolarMotion()`, replace the 1.7-radian pulse with a 20-second cycle:

```js
var breath = 1 + Math.sin(solarShaderTime * Math.PI / 10) * 0.028;
solarSunGlows.forEach(function (layer, index) {
  var phaseScale = breath + index * 0.002;
  layer.sprite.scale.set(layer.baseScale * phaseScale, layer.baseScale * phaseScale, 1);
});
```

No new clock, event listener, renderer, composer, or animation frame is permitted.

- [ ] **Step 5: Verify Sun visuals and performance structure**

Run the embedded self-test.

Expected: four additive layers with the exact palette, one shared `GLOW_TEX`, no extra canvas renderer, breathing changes under normal motion and remains unchanged under reduced motion.

- [ ] **Step 6: Commit Task 2**

```bash
git add index.html
git commit -m "feat(solar): build a layered stellar core"
```

---

### Task 3: Credited Local Images in Solar Cards

**Files:**
- Modify: `index.html:1450-1570`
- Modify: `index.html:2080-2110`
- Modify: `index.html:200-290`
- Reference: `images/solar-system/README.md:20-55`

**Interfaces:**
- Consumes: `body.maps.albedo`, localized `body.info[L].name`, existing `#bp-img` and `#bp-credit` styles, and `esc()`.
- Produces: `body.cardCredit: string`, `solarSunCardImage(): string`, and Solar panel markup containing `#bp-img` plus `#bp-credit`.

- [ ] **Step 1: Add failing data and panel-image assertions**

Extend the Solar data/card self-test:

```js
SOLAR_BODIES.forEach(function (body) {
  ok(typeof body.cardCredit === 'string' && body.cardCredit.length > 0, body.id + ' card credit missing');
  renderSolarPanel(body.id, 'en');
  var image = document.getElementById('bp-img'), credit = document.getElementById('bp-credit');
  ok(image && credit, body.id + ' card image structure missing');
  ok(image.getAttribute('alt') === body.info.en.name, body.id + ' card image alt is not localized');
  ok(credit.textContent === body.cardCredit, body.id + ' card credit mismatch');
  ok(image.src.indexOf(location.origin + '/') === 0 || image.src.indexOf('data:image/png') === 0, body.id + ' card image is not local');
});
```

Repeat the `alt` assertion for `hans`, `hant`, `ja`, and `ko` during the existing language loop.

- [ ] **Step 2: Run the self-test and confirm cards fail without images**

Run `?solarTest=1`.

Expected: `sun card credit missing` or `card image structure missing`.

- [ ] **Step 3: Add concise credits to the existing Solar records**

Pass `cardCredit` through `solarBody()`:

```js
cardCredit: s.cardCredit,
```

Set the records to these exact concise strings, derived from `images/solar-system/README.md`:

```js
sun: 'Procedural visualization',
mercury: 'USGS Astrogeology · NASA/JHU APL/ASU',
venus: 'NASA/JPL · Magellan',
earth: 'NASA/JPL',
moon: 'NASA SVS · LROC/LOLA',
mars: 'NASA/JPL · Viking/USGS',
ceres: 'USGS Astrogeology · Dawn FC',
jupiter: 'NASA/JPL · Voyager',
io: 'NASA/JPL · USGS/Voyager',
europa: 'NASA/JPL · USGS/Voyager',
ganymede: 'NASA/JPL · USGS/Voyager',
callisto: 'NASA/JPL · USGS/Voyager',
saturn: 'NASA/JPL',
titan: 'NASA/JPL',
uranus: 'NASA/JPL · Voyager 2 reference',
neptune: 'NASA/JPL-Caltech · Don Davis',
triton: 'NASA/JPL-Caltech · USGS/Tammy Becker',
pluto: 'NASA/JPL · David Seal/Pat Rawlings'
```

- [ ] **Step 4: Generate and cache the Sun's static card thumbnail**

Add one lazy cached data URL:

```js
var solarSunCardImageURL = '';
function solarSunCardImage() {
  if (solarSunCardImageURL) return solarSunCardImageURL;
  var canvas = document.createElement('canvas'), context = canvas.getContext('2d');
  canvas.width = 600; canvas.height = 300;
  context.fillStyle = '#030711'; context.fillRect(0, 0, canvas.width, canvas.height);
  var gradient = context.createRadialGradient(300, 150, 0, 300, 150, 132);
  gradient.addColorStop(0, '#fffdf6');
  gradient.addColorStop(0.24, '#fff3da');
  gradient.addColorStop(0.52, '#ffcf78');
  gradient.addColorStop(0.76, 'rgba(255,155,63,.55)');
  gradient.addColorStop(1, 'rgba(255,120,35,0)');
  context.fillStyle = gradient; context.fillRect(150, 0, 300, 300);
  solarSunCardImageURL = canvas.toDataURL('image/png');
  return solarSunCardImageURL;
}
```

This runs only when the Sun card first opens and then reuses the cached string.

- [ ] **Step 5: Reuse beacon image markup in `renderSolarPanel()`**

Before setting `bpBody.innerHTML`, compute:

```js
var imageURL = body.id === 'sun' ? solarSunCardImage() : solarMapValue(body.maps && body.maps.albedo, 2);
```

Insert the image immediately after `#bp-type`:

```js
(imageURL ? '<img id="bp-img" src="' + esc(imageURL) + '" alt="' + esc(info.name) + '" loading="lazy"><div id="bp-credit">' + esc(body.cardCredit) + '</div>' : '') +
```

Do not add a new CSS card component; the existing beacon `#bp-img` and `#bp-credit` rules are the required layout.

- [ ] **Step 6: Verify every body and language**

Run the embedded self-test and a normal browser load.

Expected: every one of the 18 Solar cards has one image, one non-empty credit, localized alt text, no remote image URL, and no local 404. Earth still includes `#bp-earth-sky-link` below its description.

- [ ] **Step 7: Commit Task 3**

```bash
git add index.html
git commit -m "feat(solar): add imagery to body cards"
```

---

### Task 4: Documentation and Full Browser Regression

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `README.ja.md`
- Modify: `README.ko.md`
- Test: `index.html` embedded `?solarTest=1` harness

**Interfaces:**
- Consumes: completed selection, motion, Sun, and card-image behaviour from Tasks 1–3.
- Produces: user documentation matching runtime controls and final browser evidence.

- [ ] **Step 1: Update the four control guides**

Replace descriptions that imply body focus or camera flight with localized wording equivalent to:

```text
Select a body: opens its illustrated information card without moving the camera or stopping the Solar System.
Motion: orbital and axial motion are intentionally slowed for observation; relative directions and periods are preserved as a visual guide.
```

Keep drag, wheel/pinch, Back, staged Escape, `F`, and `M` instructions unchanged.

- [ ] **Step 2: Run static verification**

```bash
git diff --check
rg -n "startSolarFlight|stepSolarFlight|setSolarPaused\(true\)" index.html
rg -n "SOLAR_ORBIT_RATE = 0\.35|SOLAR_SPIN_RATE = 0\.20|solarSunGlows|bp-img|cardCredit" index.html
```

Expected: `git diff --check` prints nothing; obsolete selection flight/pause calls print nothing; the required constants, Sun layers, image markup, and credits are found.

- [ ] **Step 3: Run the full self-test in one browser**

Start one local server, open `http://127.0.0.1:4173/?solarTest=1`, wait for `solar self-tests passed`, and close the browser in `finally`.

Expected: zero self-test failures, zero page errors, zero console errors other than the explicit success message, and zero local 404 responses.

- [ ] **Step 4: Run the interaction smoke test**

In one Chromium session:

1. Enter Solar from the galaxy beacon card.
2. Snapshot camera position, quaternion, target, and zoom bounds.
3. Select Earth; confirm the illustrated card appears immediately and the snapshot is unchanged.
4. Wait one second; confirm Earth orbit/spin and `solarElapsed` advance.
5. Select Jupiter and then Ganymede; confirm both cards have images and the camera remains unchanged.
6. Select the Sun; confirm the four-layer core is visibly hot-white through amber, with no harsh rapid pulsing.
7. Test all five languages, Earth-to-sky-to-Earth, Back, two-stage Escape, and a `390×844` viewport.
8. Capture desktop Solar and mobile illustrated-card screenshots.

Expected: all steps pass without blank frames, unintended camera motion, frozen Solar transforms, missing images, console errors, failed requests, or leaked browser processes.

- [ ] **Step 5: Scan tracked changes and commit documentation**

Run the repository owner's prohibited-word scan over the changed text and commit messages. Expected: no matches.

```bash
git add README.md README.zh-CN.md README.ja.md README.ko.md
git commit -m "docs: describe Solar selection controls"
```

- [ ] **Step 6: Request final code review**

Review the complete range from `c252a44` to the new HEAD against `docs/superpowers/specs/2026-07-22-solar-selection-visual-refresh-design.md`. Any Critical or Important finding must be fixed and re-reviewed before integration.
