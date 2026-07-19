# In-Galaxy Object Detection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After flying into an external galaxy, a "scan" sweep reveals beacons for notable objects *inside* it — each a real, dynamic 3D feature with a full five-language photo card.

**Architecture:** Internal objects are **child beacons** — ordinary `BEACONS` entries flagged `child`, carrying a parent-galaxy catalog and a position `lp` in the galaxy's local frame. They project through the parent galaxy's `Points.matrixWorld` (so they co-rotate), stay hidden until `revealed`, and reuse the existing card panel/selection/declutter. A scan controller sweeps a screen-space line top→bottom and flips `revealed` as it passes each object; each object also renders a small animated 3D feature attached under the parent's `Points`.

**Tech Stack:** Vanilla JS, three.js r128 (vendored), single-file `index.html`, no build step, no test framework.

## Global Constraints

- Single file: **all** code changes are in `index.html` (data + images + `THIRD-PARTY-NOTICES.md` for Task 6).
- No new runtime dependencies; three.js r128 only.
- Five languages everywhere a card has text: `en, hans, hant, ja, ko`. Use established astronomical names per language.
- Photos: real Wikimedia Commons images, **public domain or CC BY / CC BY-SA only**, credited in `THIRD-PARTY-NOTICES.md`.
- No automated tests exist. Verification = the `assertBeaconInfo()` console self-check + explicit in-browser checks. Serve over HTTP (`python3 -m http.server 8123`) — `file://` blocks textures.
- Reuse, don't duplicate: `BEACONS`, `renderPanel`/`selectBeacon`, `updateBeacons`, `galaxyLODs`, `GLOW_TEX`, the `uTime` twinkle-shader pattern, the fly-to/return plumbing, the translation + Commons-photo workflow.
- Anchor edits by **function name / nearby code**, not line numbers (the file is edited heavily; line numbers drift).
- Pilot objects (exactly these four): M31 → NGC 206, G1; Centaurus A (`catalog: 'NGC 5128'`) → jet, dust-lane star-forming region.

---

## Task 1: Child-beacon registry, projection, and reveal gate

**Files:**
- Modify `index.html` — the beacons IIFE (the `DEFS` → `BEACONS` loop, near `var host = document.createElement('div'); host.id = 'beacons';`), `updateBeacons()`, and `assertBeaconInfo()`.

**Interfaces:**
- Produces: `BEACONS` entries with `{ child:true, parent:<catalog>, lp:THREE.Vector3, feat:{kind,...}, revealed:false, parentPts:<set in Task 2>, feature:<set in Task 2> }`. Each child's world position is `parentPts.matrixWorld · lp`.
- Consumes: existing `selectBeacon(i)`, `renderPanel`, `beaconTmp`, `galaxyRoot`.

- [ ] **Step 1: Add the `CHILDREN` array and register child beacons.** Immediately after the existing `for (var i = 0; i < DEFS.length; i++) { ... BEACONS.push({...}); }` loop (still inside the beacons IIFE, where `host` is in scope), add:

```js
// ── internal objects, revealed by scanning a galaxy. Child beacons project
// through their parent galaxy's world matrix, so they co-rotate with it.
// lp = position in the galaxy's LOCAL frame (disc in XZ, +Y = disc normal),
// scaled to the parent's radius (M31 R≈132, Cen A R≈120). Tunable in-browser.
var CHILDREN = [
  { parent: 'M31', lp: new THREE.Vector3(80, 6, 34), feat: { kind: 'starcloud' },
    t: { en: ['NGC 206', 'star cloud'], hans: ['NGC 206', '恒星云'], hant: ['NGC 206', '恆星雲'], ja: ['NGC 206', '星の雲'], ko: ['NGC 206', '별구름'] },
    info: { en: { type: 'Star cloud · inside M31', facts: [['Type', 'OB association'], ['Host', 'Andromeda']], desc: 'PLACEHOLDER — replaced in Task 6.', catalog: 'NGC 206' } },
    img: 'images/ngc206.jpg', credit: '' },
  { parent: 'M31', lp: new THREE.Vector3(-46, 54, -30), feat: { kind: 'globular' },
    t: { en: ['G1 (Mayall II)', 'globular cluster'], hans: ['G1（梅奥尔 II）', '球状星团'], hant: ['G1（梅奧爾 II）', '球狀星團'], ja: ['G1（メイオールII）', '球状星団'], ko: ['G1 (메이올 II)', '구상성단'] },
    info: { en: { type: 'Globular cluster · inside M31', facts: [['Mass', '~10 million suns'], ['Host', 'Andromeda']], desc: 'PLACEHOLDER — replaced in Task 6.', catalog: 'G1 / Mayall II' } },
    img: 'images/g1.jpg', credit: '' },
  { parent: 'NGC 5128', lp: new THREE.Vector3(24, 78, 8), feat: { kind: 'jet', dir: new THREE.Vector3(0.22, 0.95, 0.1).normalize(), len: 168 },
    t: { en: ['Relativistic jet', 'from the black hole'], hans: ['相对论喷流', '来自黑洞'], hant: ['相對論噴流', '來自黑洞'], ja: ['相対論的ジェット', 'ブラックホールから'], ko: ['상대론적 제트', '블랙홀에서'] },
    info: { en: { type: 'Relativistic jet · Centaurus A', facts: [['Length', 'thousands of ly'], ['Source', 'central black hole']], desc: 'PLACEHOLDER — replaced in Task 6.', catalog: 'Cen A jet' } },
    img: 'images/cena-jet.jpg', credit: '' },
  { parent: 'NGC 5128', lp: new THREE.Vector3(48, 2, -22), feat: { kind: 'nebula' },
    t: { en: ['Star-forming region', 'in the dust lane'], hans: ['恒星形成区', '尘埃带中'], hant: ['恆星形成區', '塵埃帶中'], ja: ['星形成領域', 'ダストレーン内'], ko: ['별 형성 영역', '먼지 띠 속'] },
    info: { en: { type: 'Star-forming region · Centaurus A', facts: [['Contains', 'young blue clusters'], ['Trigger', 'galaxy merger']], desc: 'PLACEHOLDER — replaced in Task 6.', catalog: 'Cen A HII' } },
    img: 'images/cena-sfr.jpg', credit: '' }
];
CHILDREN.forEach(function (c) {
  var el = document.createElement('div');
  el.className = 'beacon child';
  el.innerHTML = '<div class="b-mark"><span class="b-ring"></span><span class="b-ring r2"></span><span class="b-dot"></span></div><div class="b-label"></div>';
  host.appendChild(el);
  var idx = BEACONS.length;
  (function (i) { el.addEventListener('click', function (e) { e.stopPropagation(); selectBeacon(i); }); })(idx);
  BEACONS.push({ el: el, t: c.t, info: c.info, child: true, parent: c.parent, lp: c.lp, feat: c.feat, img: c.img, credit: c.credit, revealed: false, parentPts: null, feature: null, shown: false });
});
```

- [ ] **Step 2: Project children through the parent matrix + reveal gate in `updateBeacons()`.** In `updateBeacons()`, replace the body of the per-beacon loop's position block. Find:

```js
      var b = BEACONS[i];
      beaconTmp.copy(b.p); if (!b.fixed) beaconTmp.applyMatrix4(galaxyRoot.matrixWorld); // external galaxies stay put on the far sky, not co-rotating with the disc
      beaconTmp.project(camera);
```

and replace with:

```js
      var b = BEACONS[i];
      if (b.child) {
        if (!b.revealed || !b.parentPts) { if (b.shown) { b.el.style.display = 'none'; b.shown = false; } continue; }
        beaconTmp.copy(b.lp).applyMatrix4(b.parentPts.matrixWorld); // ride the parent galaxy's transform (co-rotates)
      } else {
        beaconTmp.copy(b.p); if (!b.fixed) beaconTmp.applyMatrix4(galaxyRoot.matrixWorld); // external galaxies stay put on the far sky, not co-rotating with the disc
      }
      beaconTmp.project(camera);
```

(The declutter loop below already skips beacons whose `shown` is false, so unrevealed children are naturally excluded.)

- [ ] **Step 2b: Skip the 3D highlight ring for children in `openBeaconExtras`.** Children have no `.p`, so the ring's `beaconRing.position.copy(BEACONS[i].p)` would set NaN. Find:

```js
    if (BEACONS[i].fixed) { beaconRing.visible = false; return; } // no 3D ring for far-sky external galaxies
```

and change to:

```js
    if (BEACONS[i].fixed || BEACONS[i].child) { beaconRing.visible = false; return; } // no 3D ring for far-sky galaxies or in-galaxy objects
```

- [ ] **Step 3: Make `distance`/`constellation` optional for children in `assertBeaconInfo()`.** In `assertBeaconInfo()`, find the field-check loop:

```js
      langs.forEach(function (L) {
        var o = b.info[L];
        if (!o) throw new Error('beacon ' + i + ' missing info.' + L);
        fields.forEach(function (f) { if (o[f] == null) throw new Error('beacon ' + i + ' info.' + L + '.' + f + ' missing'); });
```

and change the inner `fields.forEach` to skip the two optional fields for children:

```js
      langs.forEach(function (L) {
        var o = b.info[L];
        if (!o) throw new Error('beacon ' + i + ' missing info.' + L);
        fields.forEach(function (f) {
          if (b.child && (f === 'distance' || f === 'constellation')) return; // internal objects may omit these
          if (o[f] == null) throw new Error('beacon ' + i + ' info.' + L + '.' + f + ' missing');
        });
```

- [ ] **Step 4: Verify in-browser.** Serve (`python3 -m http.server 8123`) and open `http://localhost:8123/index.html`. In the console:

```js
BEACONS.filter(b => b.child).length          // expect 4
// children are hidden (unrevealed) — none visible yet:
BEACONS.filter(b => b.child && b.shown).length // expect 0
```

`assertBeaconInfo()` throws only because `parentPts` isn't linked yet (position projects to origin) — that's fine; the important check is that it does **not** throw a missing-field error. Run `assertBeaconInfo()` and confirm any error is NOT `info.<lang>.<field> missing`. (Full green in Task 2.)

- [ ] **Step 5: Commit.**

```bash
git add index.html
git commit -m "feat: register in-galaxy child beacons (hidden, parent-projected)"
```

---

## Task 2: Feature renderers (static) + link children to parent galaxies

**Files:**
- Modify `index.html` — the galaxies IIFE (`buildGalaxyStars` call site, and after it), add a `buildFeature()` function and a linking pass.

**Interfaces:**
- Consumes: `galaxyLODs` (each entry `{pts, mat, center, maxN, refDist, baseSize, q0, axis, spin}`), `GLOW_TEX`, `GLOW_FRAG`, `renderer`, child beacons from Task 1.
- Produces: `galaxyLODs[i].cat` (parent catalog string); each child gets `b.parentPts` (parent `Points`) and `b.feature = { group:THREE.Group, update:function(t){} }`. `buildFeature(feat)` returns `{ group, update }`.

- [ ] **Step 1: Tag each LOD with its galaxy catalog.** In the galaxies IIFE, find the loop that builds galaxies:

```js
    for (var gi = 0; gi < BEACONS.length; gi++) {
      var b = BEACONS[gi]; if (b.gal && b.gal.stars) buildGalaxyStars(b.p, b.gal.stars); // real 3D particle galaxy
    }
```

Change the loop to pass the catalog and tag the freshly-pushed LOD:

```js
    for (var gi = 0; gi < BEACONS.length; gi++) {
      var b = BEACONS[gi]; if (b.gal && b.gal.stars) { buildGalaxyStars(b.p, b.gal.stars); galaxyLODs[galaxyLODs.length - 1].cat = b.info.en.catalog; }
    }
    linkGalaxyChildren();
```

- [ ] **Step 2: Add `buildFeature()` and `linkGalaxyChildren()`.** Inside the galaxies IIFE, before the build loop, add these two functions. All features are additive `Points`/`Sprite` groups; `update(t)` is a no-op for static features (animation lands in Task 3).

```js
    function starPoints(n, spread, color, sizeMul, flatten) { // small additive point clump
      var pos = new Float32Array(n * 3), scl = new Float32Array(n), col = new Float32Array(n * 3), c = new THREE.Color(color);
      for (var i = 0; i < n; i++) {
        var u = Math.random() * 2 - 1, ph = Math.random() * 6.283, s = Math.sqrt(1 - u * u), t = Math.pow(Math.random(), 0.6) * spread;
        pos[i * 3] = s * Math.cos(ph) * t; pos[i * 3 + 1] = u * t * (flatten || 1); pos[i * 3 + 2] = s * Math.sin(ph) * t;
        scl[i] = (0.5 + Math.random() * 1.2) * (sizeMul || 1);
        var v = 0.8 + Math.random() * 0.3; col[i * 3] = c.r * v; col[i * 3 + 1] = c.g * v; col[i * 3 + 2] = c.b * v;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3)); g.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
      return new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: { uSize: { value: 2.4 * renderer.getPixelRatio() } },
        vertexShader: 'uniform float uSize; attribute float aScale; attribute vec3 aColor; varying vec3 vColor; void main(){ vec4 vp = viewMatrix * modelMatrix * vec4(position,1.0); gl_Position = projectionMatrix * vp; gl_PointSize = uSize * aScale * (300.0/-vp.z); vColor = aColor; }',
        fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
    }
    function buildFeature(feat) {
      var group = new THREE.Group(), update = function () {};
      if (feat.kind === 'globular') {
        group.add(starPoints(220, 9, 0xfff0d8, 1.0));                     // old warm stars, tight
        var core = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffe8c8, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); core.scale.set(14, 14, 1); group.add(core);
      } else if (feat.kind === 'starcloud') {
        group.add(starPoints(150, 16, 0xdbeaff, 1.1, 0.5));               // hot blue-white young stars, flattened into the disc
      } else if (feat.kind === 'nebula') {
        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xff6aa8, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(34, 24, 1); group.add(glow); group.userData.glow = glow;
        group.add(starPoints(26, 12, 0xcfe0ff, 1.2, 0.6));               // hot blue stars inside
      } else if (feat.kind === 'jet') {
        group.add(buildJet(feat));                                       // animated in Task 3
      }
      return { group: group, update: update };
    }
    function buildJet(feat) { // placeholder straight beam (animated in Task 3); dir/len in local units
      var n = 300, len = feat.len || 150, dir = (feat.dir || new THREE.Vector3(0, 1, 0)).clone().normalize();
      var pos = new Float32Array(n * 3), aT = new Float32Array(n), col = new Float32Array(n * 3), c = new THREE.Color(0xbfd6ff), tmp = new THREE.Vector3();
      for (var i = 0; i < n; i++) {
        var t = Math.pow(Math.random(), 0.7), r = (0.02 + t * 0.10) * len * (Math.random() - 0.5) * 2; // slight cone flare
        tmp.copy(dir).multiplyScalar(t * len); pos[i * 3] = tmp.x + r; pos[i * 3 + 1] = tmp.y + r * 0.6; pos[i * 3 + 2] = tmp.z + r;
        aT[i] = t; var v = 1 - t * 0.7; col[i * 3] = c.r * v; col[i * 3 + 1] = c.g * v; col[i * 3 + 2] = c.b; // fade to tip
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 1)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
      return new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: { uSize: { value: 3.0 * renderer.getPixelRatio() } },
        vertexShader: 'uniform float uSize; attribute float aT; attribute vec3 aColor; varying vec3 vColor; void main(){ vec4 vp = viewMatrix * modelMatrix * vec4(position,1.0); gl_Position = projectionMatrix * vp; gl_PointSize = uSize * (1.5 - aT) * (300.0/-vp.z); vColor = aColor; }',
        fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
    }
    function linkGalaxyChildren() {
      BEACONS.forEach(function (c) {
        if (!c.child) return;
        var lod = null; for (var i = 0; i < galaxyLODs.length; i++) if (galaxyLODs[i].cat === c.parent) { lod = galaxyLODs[i]; break; }
        if (!lod) return;
        c.parentPts = lod.pts;
        c.feature = buildFeature(c.feat);
        c.feature.group.position.copy(c.feat.kind === 'jet' ? new THREE.Vector3(0, 0, 0) : c.lp); // jet emanates from the nucleus; others sit at lp
        c.feature.group.visible = false;
        lod.pts.add(c.feature.group);
      });
    }
```

- [ ] **Step 3: Verify in-browser.** Reload. In the console, reveal both M31 children and show their features:

```js
BEACONS.filter(b => b.child && b.parent === 'M31').forEach(b => { b.revealed = true; b.feature.group.visible = true; });
// then fly to M31 to look:  (paste the aim helper you use, or click M31 → 🚀)
```

Confirm: the star cloud (blue clump) and globular (warm knot) appear at their spots inside M31 and **co-rotate** with the galaxy (watch a few seconds). `assertBeaconInfo()` now runs clean for the field check.

- [ ] **Step 4: Commit.**

```bash
git add index.html
git commit -m "feat: build in-galaxy 3D features and link children to parent galaxies"
```

---

## Task 3: Animate the features (uTime)

**Files:**
- Modify `index.html` — `buildFeature`/`buildJet` (add `uTime` + `update`), and the `frame()` loop (drive `update(t)` for revealed children).

**Interfaces:**
- Consumes: `t` (seconds) in `frame()`, the `galaxyLODs`/child structures.
- Produces: each `c.feature.update(t)` animates; jet material gains `uTime` uniform.

- [ ] **Step 1: Give the jet a flowing `uTime` shader.** In `buildJet`, change the `ShaderMaterial` to add `uTime` and flow the brightness outward:

```js
      return new THREE.Points(g, new THREE.ShaderMaterial({
        uniforms: { uSize: { value: 3.0 * renderer.getPixelRatio() }, uTime: { value: 0 } },
        vertexShader: 'uniform float uSize; uniform float uTime; attribute float aT; attribute vec3 aColor; varying vec3 vColor;' +
          'void main(){ vec4 vp = viewMatrix * modelMatrix * vec4(position,1.0); gl_Position = projectionMatrix * vp;' +
          ' float flow = 0.55 + 0.45*sin(aT*14.0 - uTime*3.0 + aColor.r*20.0);' +      // plasma pulses stream outward
          ' float knot = pow(max(0.0, sin(aT*6.0 - uTime*2.2)), 8.0);' +               // sharper travelling knots
          ' gl_PointSize = uSize * (1.5 - aT) * (300.0/-vp.z);' +
          ' vColor = aColor * (flow + knot); }',
        fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
```

- [ ] **Step 2: Give each feature an `update(t)`.** In `buildFeature`, replace the returns so animated kinds set `update`:

```js
    function buildFeature(feat) {
      var group = new THREE.Group(), update = function () {};
      if (feat.kind === 'globular') {
        group.add(starPoints(220, 9, 0xfff0d8, 1.0));
        var core = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffe8c8, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); core.scale.set(14, 14, 1); group.add(core);
        // static on purpose (old, quiet cluster)
      } else if (feat.kind === 'starcloud') {
        var scPts = starPoints(150, 16, 0xdbeaff, 1.1, 0.5); group.add(scPts);
        update = function (t) { scPts.material.uniforms.uSize.value = (2.4 + 0.9 * Math.sin(t * 3.1)) * renderer.getPixelRatio(); }; // collective young-star shimmer
      } else if (feat.kind === 'nebula') {
        var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xff6aa8, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(34, 24, 1); group.add(glow);
        var nbPts = starPoints(26, 12, 0xcfe0ff, 1.2, 0.6); group.add(nbPts);
        update = function (t) { var b = 0.5 + 0.5 * Math.sin(t * 0.62); glow.material.opacity = 0.4 + 0.28 * b; var s = 30 + 8 * b; glow.scale.set(s, s * 0.7, 1); nbPts.material.uniforms.uSize.value = (2.4 + 1.1 * Math.sin(t * 2.3)) * renderer.getPixelRatio(); }; // slow breathe + twinkle
      } else if (feat.kind === 'jet') {
        var jet = buildJet(feat); group.add(jet);
        update = function (t) { jet.material.uniforms.uTime.value = t; };
      }
      return { group: group, update: update };
    }
```

- [ ] **Step 3: Drive `update(t)` from the frame loop.** In `frame()`, inside the main-view section (right after the existing `galaxyLODs` LOD/spin loop), add:

```js
    for (var ci = 0; ci < BEACONS.length; ci++) { var cb = BEACONS[ci]; if (cb.child && cb.revealed && cb.feature) cb.feature.update(t); }
```

- [ ] **Step 4: Verify in-browser.** Reveal Cen A's children (`BEACONS.filter(b=>b.child&&b.parent==='NGC 5128').forEach(b=>{b.revealed=true;b.feature.group.visible=true;})`), fly to Cen A. Confirm: the jet's bright pulses **flow outward** from the nucleus; the nebula **breathes** (glow grows/shrinks) and its stars twinkle. No console errors; FPS still ~60.

- [ ] **Step 5: Commit.**

```bash
git add index.html
git commit -m "feat: animate in-galaxy features (jet flow, nebula breathe, starcloud shimmer)"
```

---

## Task 4: Scan controller — button, sweep line, reveal-by-position, reset

**Files:**
- Modify `index.html` — CSS (add `#scan-btn`, `#scan-line`), the fly plumbing (show `#scan-btn` on arrival), a new `scanController`, `frame()` (advance the sweep), and the exit path (`flyHome` + a distance check) to hide/reset.

**Interfaces:**
- Consumes: `flyToBeacon`/`showReturnBtn` completion, `beaconLang`, `BEACONS`, `galaxyLODs`, `camera`.
- Produces: `scanState` (`{ galaxyCat, y, active }` or null), `startScan(galaxyCat)`, `stepScan()`, `hideChildren(galaxyCat)`, `#scan-btn`, `#scan-line`.

- [ ] **Step 1: CSS for the scan button and sweep line.** Near the `#return-mw` CSS, add:

```css
  #scan-btn { position: fixed; top: 16px; left: 50%; transform: translateX(calc(-50% + 150px)); z-index: 50; display: none;
    padding: 8px 16px; border-radius: 20px; cursor: pointer; background: rgba(20,40,60,.72);
    border: 1px solid rgba(120,200,255,.3); color: #bfe6ff; font-size: 13px; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  #scan-btn:hover { background: rgba(30,60,90,.9); color: #fff; }
  #scan-line { position: fixed; left: 0; width: 100%; height: 2px; z-index: 45; display: none; pointer-events: none;
    background: linear-gradient(90deg, transparent, #7fd0ff, #eaf8ff, #7fd0ff, transparent);
    box-shadow: 0 0 18px 4px rgba(120,208,255,.55); }
```

- [ ] **Step 2: Add the scan controller.** Next to the fly code (`flyToBeacon`/`stepFly`), add:

```js
  var SCAN_TXT = { en: '🔍 Scan this galaxy', hans: '🔍 扫描本星系', hant: '🔍 掃描本星系', ja: '🔍 この銀河をスキャン', ko: '🔍 이 은하 스캔' };
  var scanBtn = null, scanLine = null, scanState = null;
  function galaxyChildren(cat) { return BEACONS.filter(function (b) { return b.child && b.parent === cat; }); }
  function ensureScanEls() {
    if (scanBtn) return;
    scanBtn = document.createElement('div'); scanBtn.id = 'scan-btn';
    scanBtn.addEventListener('click', function (e) { e.stopPropagation(); if (scanBtn.dataset.cat) startScan(scanBtn.dataset.cat); });
    document.body.appendChild(scanBtn);
    scanLine = document.createElement('div'); scanLine.id = 'scan-line'; document.body.appendChild(scanLine);
  }
  function showScanBtn(cat) { // cat = galaxy catalog, or null to hide
    ensureScanEls();
    if (cat && galaxyChildren(cat).length) { scanBtn.dataset.cat = cat; scanBtn.textContent = SCAN_TXT[beaconLang] || SCAN_TXT.en; scanBtn.style.display = 'block'; }
    else { scanBtn.style.display = 'none'; delete scanBtn.dataset.cat; }
  }
  function hideChildren(cat) { galaxyChildren(cat).forEach(function (c) { c.revealed = false; if (c.feature) c.feature.group.visible = false; c.el.style.display = 'none'; c.shown = false; }); }
  function startScan(cat) {
    ensureScanEls(); hideChildren(cat);
    scanState = { cat: cat, start: performance.now(), dur: 1800 };
    scanLine.style.display = 'block'; scanLine.style.opacity = '1';
  }
  var scanTmp = new THREE.Vector3();
  function stepScan() { // called each frame; advances the sweep + reveals crossed children
    if (!scanState) return;
    var k = Math.min(1, (performance.now() - scanState.start) / scanState.dur);
    var e = 1 - Math.pow(1 - k, 2); // ease-out
    var yPx = e * window.innerHeight;
    scanLine.style.top = yPx + 'px';
    galaxyChildren(scanState.cat).forEach(function (c) {
      if (c.revealed || !c.parentPts) return;
      scanTmp.copy(c.lp).applyMatrix4(c.parentPts.matrixWorld).project(camera);
      var sy = (-scanTmp.y * 0.5 + 0.5) * window.innerHeight;
      if (scanTmp.z < 1 && yPx >= sy) revealChild(c); // line has passed it
    });
    if (k >= 1) { scanLine.style.opacity = '0'; setTimeout(function () { if (scanLine) scanLine.style.display = 'none'; }, 400); scanState = null; }
  }
  function revealChild(c) { c.revealed = true; if (c.feature) c.feature.group.visible = true; } // per-type reveal anim added in Task 5
```

- [ ] **Step 3: Show the scan button when a galaxy fly-in completes.** In `flyToBeacon`, the `onDone` currently calls `showReturnBtn(true)`. Change it to also offer the scan:

```js
    flyTo(gp.clone().addScaledVector(dir, galR * 3.0), gp, 2400, function () { showReturnBtn(true); showScanBtn(b.info.en.catalog); }); // frame the whole galaxy
```

- [ ] **Step 4: Advance the sweep in `frame()`, and hide/reset on exit.** In `frame()`, right after `if (!stepFly()) controls.update();`, add `stepScan();`. Then add an exit check: after the `galaxyLODs` loop in `frame()`, add

```js
    if (scanBtn && scanBtn.dataset.cat) { // left the galaxy? hide its children + scan UI
      var scat = scanBtn.dataset.cat, slod = null; for (var si = 0; si < galaxyLODs.length; si++) if (galaxyLODs[si].cat === scat) { slod = galaxyLODs[si]; break; }
      if (slod && camera.position.distanceTo(slod.center) > slod.refDist * 2.2) { hideChildren(scat); showScanBtn(null); scanState = null; if (scanLine) scanLine.style.display = 'none'; }
    }
```

Also in `flyHome` (the return-to-Milky-Way path), the `onDone` calls `showReturnBtn(false)`; add hide there too:

```js
  function flyHome() { flyTo(new THREE.Vector3(0, 390, 520), new THREE.Vector3(0, 0, 0), 2200, function () { showReturnBtn(false); }); if (scanBtn && scanBtn.dataset.cat) { hideChildren(scanBtn.dataset.cat); showScanBtn(null); } }
```

- [ ] **Step 5: Refresh the scan button label on language change.** In `setBeaconLang`, next to the `#return-mw` refresh line, add:

```js
    if (scanBtn && scanBtn.style.display === 'block') scanBtn.textContent = SCAN_TXT[lang] || SCAN_TXT.en;
```

- [ ] **Step 6: Verify in-browser.** Click M31 → 🚀 fly in → the **🔍 扫描本星系** button appears. Click it → a bright line sweeps top→bottom and NGC 206 + G1 beacons + features reveal as it passes them. Click a revealed beacon → its card opens. Click **← 返回银河系** → children hide, buttons reset. Fly back to M31, re-scan → reveals again. Repeat for Cen A. No console errors.

- [ ] **Step 7: Commit.**

```bash
git add index.html
git commit -m "feat: scan controller — sweep line reveals in-galaxy objects, resets on exit"
```

---

## Task 5: Detection ping ring + per-type reveal animations

**Files:**
- Modify `index.html` — `revealChild` (add ping + reveal animation), plus a `pingRing` helper.

**Interfaces:**
- Consumes: `revealChild(c)` from Task 4, `GLOW_TEX`/ring texture, `frame()` loop for animating transient rings.
- Produces: a `detectPings` array of transient screen-space rings advanced in `frame()`.

- [ ] **Step 1: Add a screen-space detection ring.** Near the scan controller, add a CSS ring + a JS pool:

```css
  .detect-ring { position: fixed; z-index: 46; pointer-events: none; border: 2px solid rgba(150,225,255,.9); border-radius: 50%; }
```

```js
  function pingAt(sx, sy) {
    var r = document.createElement('div'); r.className = 'detect-ring'; document.body.appendChild(r);
    var t0 = performance.now();
    (function anim() {
      var k = Math.min(1, (performance.now() - t0) / 600), d = 8 + k * 90;
      r.style.width = d + 'px'; r.style.height = d + 'px'; r.style.left = (sx - d / 2) + 'px'; r.style.top = (sy - d / 2) + 'px'; r.style.opacity = String(1 - k);
      if (k < 1) requestAnimationFrame(anim); else r.remove();
    })();
  }
```

- [ ] **Step 2: Per-type reveal animation + ping in `revealChild`.** Replace `revealChild`:

```js
  function revealChild(c) {
    c.revealed = true;
    if (c.parentPts) { scanTmp.copy(c.lp).applyMatrix4(c.parentPts.matrixWorld).project(camera); pingAt((scanTmp.x * 0.5 + 0.5) * window.innerWidth, (-scanTmp.y * 0.5 + 0.5) * window.innerHeight); }
    if (!c.feature) return;
    var grp = c.feature.group; grp.visible = true;
    var t0 = performance.now(), kind = c.feat.kind;
    (function grow() {
      var k = Math.min(1, (performance.now() - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      if (kind === 'jet') grp.scale.setScalar(e);                 // shoots out from the nucleus
      else if (kind === 'nebula') grp.scale.setScalar(0.3 + 0.7 * e); // blooms open
      else grp.scale.setScalar(0.4 + 0.6 * e);                    // starcloud / globular pop in
      if (k < 1) requestAnimationFrame(grow); else grp.scale.setScalar(1);
    })();
  }
```

- [ ] **Step 3: Verify in-browser.** Fly into Cen A, scan. Confirm: as the line passes each object a **ring pings** at its position, the **jet visibly shoots out** from the nucleus, the **nebula blooms open**. Repeat M31 (star cloud / globular pop in). No console errors; FPS steady.

- [ ] **Step 4: Commit.**

```bash
git add index.html
git commit -m "feat: detection ping ring + per-type reveal animations"
```

---

## Task 6: Real cards — five-language content + Commons photos

**Files:**
- Modify `index.html` — replace the four `CHILDREN` `info`/`t`/`credit` placeholders with authored English + reviewed translations.
- Create `images/ngc206.jpg`, `images/g1.jpg`, `images/cena-jet.jpg`, `images/cena-sfr.jpg`.
- Modify `THIRD-PARTY-NOTICES.md`.

**Interfaces:**
- Consumes: the `CHILDREN` array from Task 1 (same object shape).
- Produces: full five-language `info` per child; real credited photos.

- [ ] **Step 1: Author English cards.** Write the English `info.en` for the four objects (concise, teaching, in the existing card voice). Facts as `[key, value]` pairs; `catalog` set; `distance`/`constellation` omitted (optional for children). Example (NGC 206):

```js
info: { en: { type: 'Star cloud · inside M31', facts: [['Type', 'OB star association'], ['Host', 'Andromeda (M31)']], desc: 'The brightest star cloud in the Andromeda Galaxy — a vast association of hot young blue stars, one of the largest star-forming complexes in the Local Group.', catalog: 'NGC 206' } }
```

Author the other three similarly: **G1 (Mayall II)** — most massive globular in the Local Group, orbits Andromeda's halo, may host an intermediate-mass black hole; **Cen A jet** — a relativistic jet launched by the central black hole, glowing in radio and X-rays, imaged by the EHT in 2021; **Cen A star-forming region** — young blue star clusters and pink hydrogen glowing in the warped dust lane, triggered by a galaxy merger.

- [ ] **Step 2: Translate to the four languages via the workflow.** Reuse the established translation workflow (see `scratchpad/galaxy-cards-wf.js` from the galaxy bundle): feed the four English cards, get reviewed `hans/hant/ja/ko` for both `t` (name, subtitle) and `info` (type, facts, desc; keep `catalog` identical). Paste results into each `CHILDREN` entry.

- [ ] **Step 3: Fetch the four photos from Wikimedia Commons.** Reuse the Commons API script pattern (`scratchpad/commons_dl*.py`). Pick PD/CC-BY files, e.g.:
  - `ngc206.jpg` — a Hubble/large-telescope image of NGC 206 in M31
  - `g1.jpg` — the Hubble image of Mayall II / G1
  - `cena-jet.jpg` — a Chandra X-ray (or radio) image of the Centaurus A jet
  - `cena-sfr.jpg` — a Hubble image of the Centaurus A dust-lane / star-forming knots

  Download at ~1000px, resize (`sips --resampleHeightWidthMax 1000 -s formatOptions 82`), and record each `[LicenseShortName, Artist, source URL]`. Set each `CHILDREN[i].credit` to the short author string.

- [ ] **Step 4: Add attributions.** In `THIRD-PARTY-NOTICES.md`, under the external-galaxy images (or a new `### In-galaxy object images` subsection), add one credited line per image (matching the existing `- \`images/x.jpg\` — Author · License · [source](url)` format).

- [ ] **Step 5: Verify in-browser + self-check.** Reload. `assertBeaconInfo()` returns without throwing (all four children now have complete five-language cards). Fly into each galaxy, scan, click each revealed beacon → its card shows the five-language content (switch language via the selector) and the real photo (Network tab: each image is `200`). No console errors.

- [ ] **Step 6: Commit.**

```bash
git add index.html THIRD-PARTY-NOTICES.md images/ngc206.jpg images/g1.jpg images/cena-jet.jpg images/cena-sfr.jpg
git commit -m "feat: five-language cards + real photos for the four in-galaxy objects"
```

---

## Final verification (after Task 6)

- [ ] `assertBeaconInfo()` — no throw.
- [ ] Full loop for **both** pilot galaxies: click galaxy → 🚀 fly in → 🔍 scan → sweep reveals features + beacons with pings → click each → five-language photo card → ← back → children hidden/reset → re-enter → re-scan works.
- [ ] Features co-rotate with their galaxy; jet flows, nebula breathes, globular is quiet.
- [ ] No console errors; FPS ~60 at all steps.
- [ ] Run `superpowers:finishing-a-development-branch`.
