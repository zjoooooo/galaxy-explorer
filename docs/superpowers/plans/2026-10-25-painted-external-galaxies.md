# Painted External Galaxies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Paint all seven external galaxies in the Milky Way's oil-paint style, each with colours from telescope images of that galaxy (spec: `docs/superpowers/specs/2026-10-25-painted-external-galaxies-design.md`).

**Architecture:** The Milky Way's tile bake becomes a shared queue (`paintQueue`, one tile per frame). One uber fragment shader (`EXT_PAINT_FRAG`, kinds 0 spiral / 1 spheroid / 2 photo plate) bakes each external galaxy into an 8-bit sqrt-encoded target. That target is drawn on a disc plane, or on a camera-facing spheroid impostor, mounted as a child of the galaxy's star points. Per-galaxy specs live in `gal.stars.paint`.

**Tech Stack:** three.js r128 (vendored), a single-file `index.html` (one classic inline script), `test/solar-selftest.js` (`?solarTest=1`), `.github/scripts/validate.mjs`, Playwright probes in the session scratchpad.

## Global Constraints

- The Milky Way's bake shader text, uniforms, render-target settings, tile grid and display layers stay byte-for-byte unchanged. Verify with a texture readback hash against main.
- External targets: `THREE.UnsignedByteType`, the colour stored as `sqrt(c)` plus a 1-LSB dither and squared back in the display shader. 2048² on desktop, 1024² on touch (`paintedGalaxy.touch`). Tiles are 512² on desktop and 256² on touch. LinearMipmapLinear, max anisotropy, mips generated only on the last tile.
- No `Math.random` in any bake. Video mode bakes synchronously. `webglcontextrestored` re-bakes every job.
- Plate guides are CPU-downsampled canvases (64² and 32², LinearFilter, no mipmaps). No mip-biased `texture2D` in the bake.
- No painted material may own a uniform named `uSize` or `uCap`; `rescalePointSizes` rescales those.
- Paint meshes are children of the galaxy's `pts`. Disc planes use `rotation.x = +Math.PI/2`, so `vP = (local x, local z)`. Plate uv is `(x/span + 0.5, 0.5 - z/span)`.
- Palette hexes are linearised (`convertSRGBToLinear`) before upload.
- Comments and code idiom follow the surrounding `index.html` (short `//` notes at line ends, `var`, ES5).
- Never push `galaxy-pro-video`. Its readiness change is committed locally only.

## Files

- Modify: `index.html`. Shared bake queue (above the Milky Way block, ~L747); the Milky Way block switches to it; `EXT_PAINT_FRAG` + `paintGalaxy` (inside `galaxies()`, above `buildGalaxyStars`); `buildGalaxyStars` hooks; the frame loop's fade-in; the galaxy DEFS; the LMC child beacon; watchdog comments.
- Modify: `test/solar-selftest.js`. Add a new `painted-external` check.
- Modify: `README.md`, `README.zh-CN.md`, `README.ja.md`, `README.ko.md`. Photo-sampled galaxies paragraph.
- Modify (private, local commit only): `/Users/justin/Project/galaxy-pro-video/runtime/hooks.js` and `runtime/director.mjs`. Readiness waits for `paintPending() === 0`.
- Scratch tools (not committed): `$S/pg/extshots.mjs`, `$S/pg/grid.py`, `$S/pg/compare.py`, `$S/pm/selftest.mjs`, `$S/pm/mksite.sh`, plus a new `$S/pg/mwhash.mjs`. Here `$S = /private/tmp/claude-501/-Users-justin-Project-galaxy-explorer/3f4cfd11-04d0-473d-a109-d641cc1421d5/scratchpad`.

**Render loop for every visual task.** Run from `/Users/justin/Project/galaxy-pro-video`:
```bash
S=/private/tmp/claude-501/-Users-justin-Project-galaxy-explorer/3f4cfd11-04d0-473d-a109-d641cc1421d5/scratchpad/pg
node $S/extshots.mjs /Users/justin/Project/galaxy-explorer $S/ab/<tag>-<CAT> <CAT>
python3 -I $S/grid.py $S/ab/<tag>.png 0.5 main=$S/ab/main-<CAT> new=$S/ab/<tag>-<CAT> -- far arrive close oblique under
```
`<CAT>` is the beacon catalog: `M31`, `M33`, `M104`, `M87`, `NGC 5128`, `LMC`, `SMC`. Main baselines are rendered from `$S/pg/site-main`.

---

### Task 1: Shared paint bake queue (Milky Way unchanged)

**Files:**
- Modify: `index.html`: insert the queue block above `var paintedGalaxy = null;`; in `buildPaintedGalaxy` replace `bakeTile`/`stepBake`/`bakeAll`.
- Create: `$S/pg/mwhash.mjs`

**Interfaces:**
- Produces: `paintQueue` (array), `paintSchedule(job)`, `paintFinish(job)`, `paintFlush()`, `paintPending()`, `paintWaiting` (number). A job is `{ rt: WebGLRenderTarget, scene: Scene, cam: Camera, grid: int, next: int, done: function }`.

- [ ] **Step 1: Write the Milky Way texture hash probe** (`$S/pg/mwhash.mjs`). It draws the Milky Way's baked map onto a 512² 8-bit target through a plain quad, reads the pixels back and prints an FNV hash. Run it on main to get the baseline.

```js
// usage: node mwhash.mjs <root>  — hash of the Milky Way's finished painted texture (drawn 1:1 onto 512² RGBA8)
import { chromium } from '/Users/justin/Project/galaxy-pro-video/node_modules/playwright/index.mjs';
import { startServer } from '/Users/justin/Project/galaxy-pro-video/src/server.mjs';
import { GPU_LAUNCH_ARGS } from '/Users/justin/Project/galaxy-pro-video/src/browser.mjs';
const [root] = process.argv.slice(2);
const s = await startServer({ root });
const b = await chromium.launch({ headless: true, executablePath: '/Users/justin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: [...GPU_LAUNCH_ARGS, '--mute-audio'] });
try {
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(s.url, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof paintedGalaxy !== 'undefined' && paintedGalaxy && paintedGalaxy.disc.material.uniforms.uMap.value.image.width > 1024, null, { timeout: 60000 });
  const h = await p.evaluate(() => {
    const rt = new THREE.WebGLRenderTarget(512, 512), sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { m: { value: paintedGalaxy.disc.material.uniforms.uMap.value } },
      vertexShader: 'varying vec2 u; void main(){ u = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform sampler2D m; varying vec2 u; void main(){ gl_FragColor = vec4(texture2D(m, u).rgb, 1.0); }' })));
    renderer.setRenderTarget(rt); renderer.render(sc, cam); const px = new Uint8Array(512 * 512 * 4); renderer.readRenderTargetPixels(rt, 0, 0, 512, 512, px); renderer.setRenderTarget(null);
    let x = 2166136261; for (let i = 0; i < px.length; i++) { x ^= px[i]; x = Math.imul(x, 16777619) >>> 0; } return x.toString(16);
  });
  console.log(JSON.stringify({ root, hash: h, errs }));
} finally { await b.close(); await s.close(); }
```
Run: `cd /Users/justin/Project/galaxy-pro-video && node $S/mwhash.mjs $S/site-main` (run it twice). Expected: the same hash both times. Record it as BASE.

- [ ] **Step 2: Insert the queue block** directly above `  var paintedGalaxy = null;` (it shares the existing section comment):

```js
  // Big painted textures are filled one tile per frame from a shared queue: the Milky Way first, then the
  // external galaxies (photo-plate ones join when their plate loads). Video mode bakes each job at once.
  var paintQueue = [], paintRaf = 0, paintWaiting = 0; // paintWaiting: photo plates still loading
  function paintTile(job) { // render one cell of a grid×grid split of the job's target (grid 1 = whole target)
    var rt = job.rt, grid = job.grid, tile = job.next++, n = rt.width / grid, cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
    rt.scissor.set((tile % grid) * n, Math.floor(tile / grid) * n, n, n); rt.scissorTest = grid > 1;
    rt.texture.generateMipmaps = tile === grid * grid - 1; // three remips the whole target after every render; only the finished bake is ever sampled
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(job.scene, job.cam);
    renderer.setRenderTarget(null); renderer.setClearColor(cc, ca); rt.scissorTest = false;
  }
  function paintFinish(job) { // bake whatever is left of a job right now
    while (job.next < job.grid * job.grid) paintTile(job);
    var i = paintQueue.indexOf(job); if (i >= 0) paintQueue.splice(i, 1);
    job.done();
  }
  function paintStep() {
    paintRaf = 0;
    var job = paintQueue[0]; if (!job) return;
    paintTile(job);
    if (job.next >= job.grid * job.grid) { paintQueue.shift(); job.done(); }
    if (paintQueue.length) paintRaf = requestAnimationFrame(paintStep);
  }
  function paintSchedule(job) {
    if (videoMode) { paintFinish(job); return; } // captures need every painting on their first frame
    paintQueue.push(job);
    if (!paintRaf) paintRaf = requestAnimationFrame(paintStep);
  }
  function paintFlush() { while (paintQueue.length) paintFinish(paintQueue[0]); }
  function paintPending() { return paintQueue.length + paintWaiting; }
```

- [ ] **Step 3: Switch the Milky Way block to the queue.** In `buildPaintedGalaxy`, delete the `function bakeTile(rt, tile, grid) { … }` body and replace everything from `var preview = makeRT(1024)` through `cv.addEventListener('webglcontextrestored', bakeAll);` with:

```js
    var preview = makeRT(1024), full = makeRT(size), mapU = { value: preview.texture };
    paintFinish({ rt: preview, scene: bakeScene, cam: bakeCam, grid: 1, next: 0, done: function () {} }); // ~1/16 of the full cost: the disc is there on the first frame
    function finish() { mapU.value = full.texture; if (preview) { preview.dispose(); preview = null; } }
    var job = { rt: full, scene: bakeScene, cam: bakeCam, grid: tiles, next: 0, done: finish };
    function bakeAll() { job.next = 0; paintFinish(job); }
    paintSchedule(job);
    cv.addEventListener('webglcontextrestored', bakeAll); // a restored context brings the target back empty
```

- [ ] **Step 4: Verify.** Run `node .github/scripts/validate.mjs` (expected: passes). Build a scratch site from the working tree (`bash $S/../pm/mksite.sh $S/site-b1`), run `node $S/mwhash.mjs $S/site-b1`, and compare with BASE. Expected: identical. Then run `node $S/../pm/selftest.mjs /Users/justin/Project/galaxy-explorer` (expected: `passed: true`).

- [ ] **Step 5: Commit.**
```bash
git add index.html && git commit -m "refactor: shared tile-bake queue for painted textures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: External paint engine + M31 (kind 0)

**Files:**
- Modify: `index.html`: add `EXT_PAINT_FRAG`, the vertex/display shaders and `paintGalaxy` above `function buildGalaxyStars(P, o) {`; hooks in `buildGalaxyStars`; the frame-loop fade; the M31 DEF.
- Modify: `test/solar-selftest.js`: add the `painted-external` check.

**Interfaces:**
- Consumes: `paintSchedule`, `paintFinish`, `paintWaiting` (Task 1), `paintedGalaxy.touch`.
- Produces: `paintGalaxy(L, spec, R, plate, plateSpan)`. It pushes `{ mesh, mat, size, born }` onto `L.paint` (an array). `spec` fields: `kind` (0/1/2), `seed`, `span` (×R; kind 2 uses plateSpan), `size` (optional override), `detail`, `bright`, `gain`, `near` [a, b, floor] (×R), `arm` [arms, tight, armPow, swirl], `rim` [outer, inner, rag], `body` (per kind, see the shader comment), `ring` [nr, width, emphasis], `lane` [strength, sharp, phase], `core` [r, strength, strandMix, pow], `tint` [youngAmt, blueLo, blueHi, paletteJitter], `pal` [[stop, hex] ×6], `young`, `hiiCol`, `hii` [amt, plateFloor, glow, thresholdShift], `anchors` [[x, z, r, gain, hex] ≤4], `plate` [norm, gamma, paletteByBrightness], `q` (impostor axis ratio). Star option `o.starGain` scales star colours.

- [ ] **Step 1: Write the failing self-test check.** In `test/solar-selftest.js`, after the `painted-galaxy` check:

```js
    check('painted-external', function () {
      paintFlush(); // analytic paintings bake now; photo-plate ones join the queue when their plate loads
      var want = { M31: 1 }, size = paintedGalaxy.touch ? 1024 : 2048;
      galaxyLODs.forEach(function (L) {
        if (!want[L.cat]) return;
        ok(L.paint && L.paint.length === want[L.cat], L.cat + ' has no painting');
        L.paint.forEach(function (P) {
          ok(P.mesh.parent === L.pts, L.cat + ' painting is not mounted on its stars');
          var m = P.mat.uniforms.uMap.value; ok(m && m.image.width === P.size && P.size <= size, L.cat + ' painting is not baked at its size');
          ok(!P.mat.uniforms.uSize && !P.mat.uniforms.uCap, L.cat + ' painting would be rescaled as a point layer');
        });
      });
      ok(typeof paintPending === 'function', 'paintPending missing');
    });
```
Run the self-test probe. Expected: FAIL with `painted-external: M31 has no painting` (or `paintFlush is not defined` if Task 1 is missing).

- [ ] **Step 2: Add the engine.** Insert above `    function buildGalaxyStars(P, o) {`:

```js
    // ── painted external galaxies ──
    // The Milky Way's oil-paint idea (noise smeared along a flow field = brush strands), one shared bake program
    // for all seven. Each galaxy brings its own shape and a palette sampled from telescope images, so none is a
    // recoloured Milky Way. kind 0 = spiral disc, 1 = spheroid (drawn on a camera-facing impostor), 2 = photo plate.
    // uBody per kind — 0: [old-disc scale, old weight, arm weight, inter-arm floor]; 1: [core radius, slope, -, stroke contrast];
    // 2: [plate sky level, stroke contrast]. Positions are in the galaxy's local units; p is the Milky Way bake frame (R = 360).
    var EXT_PAINT_FRAG =
      'varying vec2 vP;' +
      'uniform float uScale; uniform float uKind; uniform vec2 uSeed; uniform float uDetail; uniform float uBright;' +
      'uniform vec4 uArm; uniform vec4 uRim; uniform vec4 uBody; uniform vec4 uRing; uniform vec4 uLane; uniform vec4 uCore; uniform vec4 uTint;' +
      'uniform vec3 uPal[6]; uniform float uStop[6]; uniform vec3 uYoung; uniform vec3 uHiiCol; uniform vec4 uHii;' +
      'uniform vec4 uAnchor[4]; uniform vec3 uAnchorCol[4]; uniform sampler2D uGuideLo; uniform sampler2D uGuideMid; uniform vec4 uPlateP;' +
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
      'float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
      'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++){ v += a * noise(p); p = p * 2.03 + 1.7; a *= 0.5; } return v; }' +
      'vec2 plateUv(vec2 l){ return vec2(l.x / uPlateP.x + 0.5, 0.5 - l.y / uPlateP.x); }' + // plate rows run top-down; the guide textures are flipped
      'float plum(vec2 l){ return dot(texture2D(uGuideLo, plateUv(l)).rgb, vec3(0.3, 0.5, 0.2)); }' +
      'vec2 flowDir(vec2 p){ float r = max(length(p), 2.0); vec2 er = p / r; vec2 et = vec2(-er.y, er.x); vec2 d = et;' +
      '  if (uKind < 0.5) d = normalize(er + et * r * uArm.y * 6.28318 / 360.0);' + // spiral: the same winding as the star arms
      '  else if (uKind > 1.5) { vec2 l = p / uScale; float h = uPlateP.x * 0.04; vec2 g = vec2(plum(l + vec2(h, 0.0)) - plum(l - vec2(h, 0.0)), plum(l + vec2(0.0, h)) - plum(l - vec2(0.0, h)));' +
      '    if (dot(g, g) > 1e-7) d = normalize(vec2(-g.y, g.x)); }' + // photo: strokes follow the plate's brightness contours
      '  float sw = (fbm(p * 0.012 + 3.0 + uSeed) - 0.5) * uArm.w; float cs = cos(sw), sn = sin(sw); return vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs); }' +
      'float lic(vec2 p, float freq, float len){ float s = 0.0, w = 0.0; vec2 q = p; vec2 o = vec2(13.1, 7.7) + uSeed;' +
      '  for (int i = 0; i < 14; i++){ float t = float(i) / 14.0; float wt = 1.0 - t; s += noise(q * freq + o) * wt; w += wt; q += flowDir(q) * (len / 14.0); }' +
      '  q = p; for (int i = 0; i < 14; i++){ q -= flowDir(q) * (len / 14.0); float t = float(i + 1) / 14.0; float wt = 1.0 - t; s += noise(q * freq + o) * wt; w += wt; }' +
      '  return s / w; }' +
      'void main(){' +
      '  vec2 p = vP * uScale; float r = length(p), nr = r / 360.0, ang = atan(p.y, p.x);' +
      '  float edgeN = fbm(p * 0.008 + 21.0 + uSeed), env = smoothstep(uRim.x, uRim.y, nr + (edgeN - 0.5) * uRim.z);' +
      '  vec3 pl = vec3(0.0); float G = 0.0;' +
      '  if (uKind > 1.5) { pl = texture2D(uGuideMid, plateUv(vP)).rgb; env = smoothstep(uRim.x, uRim.y, plum(vP) + (edgeN - 0.5) * uRim.z);' + // photo: the rim follows the plate itself
      '    G = pow(clamp((dot(pl, vec3(0.3, 0.5, 0.2)) - uBody.x) / (uPlateP.y - uBody.x), 0.0, 1.0), uPlateP.z); }' +
      '  float pli = dot(pl, vec3(0.3, 0.5, 0.2)) + 0.02, blue = (pl.b - pl.r) / pli, red = (pl.r - pl.g) / pli;' + // the plates are colour-graded: read their hue, not their colours
      '  if (env <= 0.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }' +
      '  vec2 wp = p * 0.011 + uSeed; float w1 = fbm(wp), w2 = fbm(wp + 4.3);' +
      '  float theta = ang + (w1 - 0.5) * 0.55 - nr * uArm.y * 6.28318;' +
      '  float arm = uKind < 0.5 ? pow(max(0.0, cos(uArm.x * theta) * 0.5 + 0.5), uArm.z) : 0.0;' +
      '  float lane = uKind < 0.5 ? pow(max(0.0, cos(uArm.x * (theta - uLane.z + (w2 - 0.5) * 0.16)) * 0.5 + 0.5), uLane.y) : 0.0;' +
      '  float fine = lic(p, 1.25 * uDetail, 7.0 / uDetail), coarse = lic(p, 0.22 * uDetail, 34.0 / uDetail);' +
      '  float strands = clamp((fine - 0.5) * 3.4 + 0.5, 0.0, 1.0) * 0.6 + clamp((coarse - 0.5) * 2.6 + 0.5, 0.0, 1.0) * 0.5;' +
      '  float young = arm * mix(1.0, exp(-pow((nr - uRing.x) / uRing.y, 2.0)), uRing.z);' +
      '  float dens = uKind > 1.5 ? G * mix(1.0, 0.12 + 1.15 * strands * strands, uBody.y)' +
      '    : uKind > 0.5 ? pow(1.0 + nr * nr / (uBody.x * uBody.x), -uBody.y) * mix(1.0, 0.12 + 1.15 * strands * strands, uBody.w)' +
      '    : exp(-nr / uBody.x) * uBody.y * (0.7 + 0.3 * strands) + (uBody.w + (1.0 - uBody.w) * young) * uBody.z * (0.12 + 1.15 * strands * strands);' +
      '  dens *= env * (0.6 + 0.55 * fbm(p * 0.03 + vec2(w1, w2) * 3.0));' + // patchy
      '  float absorb = lane * smoothstep(0.12, 0.3, nr) * smoothstep(1.0, 0.75, nr) * (0.45 + 0.75 * clamp((coarse - 0.35) * 2.5, 0.0, 1.0)) * (0.55 + 0.75 * fbm(p * 0.045 + 9.0 + uSeed));' +
      '  absorb = clamp(absorb * 1.5, 0.0, 1.0) * uLane.x; dens *= 1.0 - absorb;' + // dark lanes on each arm's inner edge
      '  float t = mix(nr, 1.0 - G, uPlateP.w) + (fbm(p * 0.006 + 40.0 + uSeed) - 0.5) * uTint.w;' + // palette by radius, or by plate brightness
      '  vec3 col = uPal[0]; for (int i = 1; i < 6; i++) col = mix(col, uPal[i], smoothstep(uStop[i - 1], uStop[i], t));' +
      '  col *= mix(vec3(1.0), vec3(1.0, 0.78, 0.62), absorb);' + // lane rims redden (brown dust)
      '  float yw = uKind > 1.5 ? smoothstep(uTint.y, uTint.z, blue) : young * strands;' +
      '  col = mix(col, uYoung, clamp(yw * uTint.x, 0.0, 1.0));' + // young blue stars: on the arms, or where the plate is blue
      '  float kn = smoothstep(0.62 - uHii.w, 0.8 - uHii.w, noise(p * 0.55 * uDetail + 31.0 + uSeed) * 0.55 + noise(p * 1.6 * uDetail + 5.0 + uSeed) * 0.45) * env * (0.4 + 0.8 * smoothstep(0.4, 0.7, fbm(p * 0.02 + 70.0 + uSeed)));' +
      '  kn *= uKind > 1.5 ? (uHii.y + (1.0 - uHii.y) * smoothstep(0.22, 0.32, red)) * smoothstep(0.05, 0.3, G) : (0.35 + 0.65 * young) * smoothstep(0.16, 0.34, nr);' +
      '  col = mix(col, uHiiCol, clamp(kn * 1.8, 0.0, 1.0) * uHii.x); dens += kn * uHii.x * uHii.z * (1.0 - absorb);' + // pink star-forming specks
      '  for (int i = 0; i < 4; i++){ vec4 A = uAnchor[i]; if (A.w > 0.0) { float d = length(vP - A.xy) / A.z;' + // named nebulae / star clouds under their markers
      '    float a = exp(-d * d) * A.w * (0.2 + 1.4 * strands * strands) * (0.6 + 0.8 * fbm(p * 0.05 + float(i) * 7.0)), hot = exp(-d * d * 6.0) * A.w;' +
      '    col = mix(col, uAnchorCol[i], clamp(a * 1.5, 0.0, 1.0)); col = mix(col, vec3(1.0, 0.92, 0.94), clamp(hot, 0.0, 0.7)); dens += a + hot * 0.6; } }' +
      '  float core = exp(-pow(nr / uCore.x, uCore.w));' +
      '  col = mix(col, uPal[0], clamp(core * 1.3, 0.0, 1.0));' +
      '  vec3 c = col * (dens * 0.62 + core * uCore.y * (1.0 - uCore.z + uCore.z * strands)) * uBright;' +
      '  gl_FragColor = vec4(sqrt(clamp(c, 0.0, 1.0)) + (hash(gl_FragCoord.xy) - 0.5) / 255.0, 1.0);' + // sqrt-encoded 8-bit: dark outskirts keep their gradations
      '}';
    var EXT_DISC_VERT = 'varying vec2 vUv; varying float vDepth; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }';
    var EXT_IMPOSTOR_VERT = // spheroid: a quad facing the camera, squashed along the projected short axis by the axis ratio this view sees
      'uniform vec3 uAxis; uniform float uQ; varying vec2 vUv; varying float vDepth;' +
      'void main(){ vec3 C = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz, V = normalize(cameraPosition - C); float ci = dot(uAxis, V);' +
      '  vec3 n = uAxis - V * ci; n = dot(n, n) > 1e-6 ? normalize(n) : normalize(cross(V, abs(V.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));' +
      '  vec3 wp = C + cross(n, V) * position.x + n * position.y * sqrt(ci * ci + uQ * uQ * (1.0 - ci * ci));' +
      '  vUv = uv; vec4 mv = viewMatrix * vec4(wp, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }';
    var EXT_DISPLAY_FRAG = 'uniform sampler2D uMap; uniform float uGain; uniform float uFade; uniform vec3 uNear; varying vec2 vUv; varying float vDepth;' +
      'void main(){ vec3 c = texture2D(uMap, vUv).rgb; c *= c; gl_FragColor = vec4(c * mix(uNear.z, 1.0, smoothstep(uNear.x, uNear.y, vDepth)) * uGain * uFade, 1.0); }';
    function paintGalaxy(L, sp, R, plate, plateSpan) { // bake one painting and mount it under the galaxy's stars (plate: the 256² canvas of its photo)
      var touch = paintedGalaxy.touch, size = sp.size ? (touch ? sp.size / 2 : sp.size) : (touch ? 1024 : 2048), kind = sp.kind || 0;
      var span = kind === 2 ? plateSpan : R * (sp.span || 2.5);
      function lin(h) { return new THREE.Color(h).convertSRGBToLinear(); }
      function v4(a, d) { a = a || d; return new THREE.Vector4(a[0], a[1], a[2] || 0, a[3] || 0); }
      function guide(n) { var src = plate; while (src.width > n) { var h = document.createElement('canvas'); h.width = h.height = src.width / 2; h.getContext('2d').drawImage(src, 0, 0, h.width, h.height); src = h; } // box-halve down to n²
        var t = new THREE.CanvasTexture(src); t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; }
      var an = sp.anchors || [], anchors = [], anchorCols = [];
      for (var ai = 0; ai < 4; ai++) { anchors.push(an[ai] ? new THREE.Vector4(an[ai][0], an[ai][1], an[ai][2], an[ai][3]) : new THREE.Vector4()); anchorCols.push(lin(an[ai] ? an[ai][4] : 0)); }
      var pl = sp.plate || [1, 1, 0];
      var u = {
        uScale: { value: 360 / R }, uKind: { value: kind }, uSeed: { value: new THREE.Vector2(sp.seed || 0, (sp.seed || 0) * 0.37) },
        uDetail: { value: sp.detail || 0.6 }, uBright: { value: sp.bright || 1 },
        uArm: { value: v4(sp.arm, [2, 1, 2, 0.8]) }, uRim: { value: v4(sp.rim, [1.12, 0.62, 0.22]) }, uBody: { value: v4(sp.body, [0.3, 0, 1, 0.3]) },
        uRing: { value: v4(sp.ring, [0.5, 0.2, 0]) }, uLane: { value: v4(sp.lane, [0, 7, 0.12]) }, uCore: { value: v4(sp.core, [0.15, 0, 0.5, 1.4]) },
        uTint: { value: v4(sp.tint, [0, 0.12, 0.25, 0.12]) },
        uPal: { value: sp.pal.map(function (s) { return lin(s[1]); }) }, uStop: { value: sp.pal.map(function (s) { return s[0]; }) },
        uYoung: { value: lin(sp.young || 0xdbe4ff) }, uHiiCol: { value: lin(sp.hiiCol || 0xe85a72) }, uHii: { value: v4(sp.hii, [0, 0, 1, 0]) },
        uAnchor: { value: anchors }, uAnchorCol: { value: anchorCols },
        uGuideLo: { value: plate ? guide(32) : null }, uGuideMid: { value: plate ? guide(64) : null },
        uPlateP: { value: new THREE.Vector4(span, pl[0], pl[1], pl[2]) } // span, brightness norm, gamma, palette-by-brightness
      };
      var rt = new THREE.WebGLRenderTarget(size, size, { depthBuffer: false, format: THREE.RGBAFormat, type: THREE.UnsignedByteType, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true });
      rt.texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      var geo = new THREE.PlaneGeometry(span, span, 1, 1), bakeScene = new THREE.Scene();
      bakeScene.add(new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, fragmentShader: EXT_PAINT_FRAG, blending: THREE.NoBlending, depthWrite: false,
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }' })));
      var bakeCam = new THREE.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, 0.1, 10); bakeCam.position.z = 1; bakeCam.lookAt(0, 0, 0);
      var near = sp.near || [0.35, 1.5, 0.12], mapU = { value: null };
      var mat = new THREE.ShaderMaterial({
        uniforms: { uMap: mapU, uGain: { value: sp.gain || 1 }, uFade: { value: 0 }, uNear: { value: new THREE.Vector3(near[0] * R, near[1] * R, near[2]) }, uAxis: { value: L.axis }, uQ: { value: sp.q || 1 } },
        vertexShader: kind === 1 ? EXT_IMPOSTOR_VERT : EXT_DISC_VERT, fragmentShader: EXT_DISPLAY_FRAG,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      var mesh = new THREE.Mesh(geo, mat); mesh.visible = false; // shown once baked, then fades in
      if (kind === 1) mesh.frustumCulled = false; else mesh.rotation.x = Math.PI / 2; // plane (x, y) → the galaxy's (x, z), the frame of its stars
      L.pts.add(mesh);
      var P = { mesh: mesh, mat: mat, size: size, born: null };
      (L.paint = L.paint || []).push(P);
      var job = { rt: rt, scene: bakeScene, cam: bakeCam, grid: size / (touch ? 256 : 512), next: 0,
        done: function () { mapU.value = rt.texture; mesh.visible = true; if (P.born === null) P.born = -1; } };
      paintSchedule(job);
      cv.addEventListener('webglcontextrestored', function () { job.next = 0; paintFinish(job); }); // a restored context brings the target back empty
    }
```

- [ ] **Step 3: Hook `buildGalaxyStars`.**
  (a) Right before `      var g = new THREE.BufferGeometry();` (the one followed by `g.setAttribute('position', new THREE.BufferAttribute(pos, 3));`):
```js
      if (o.starGain) for (i = 0; i < N * 3; i++) colA[i] *= o.starGain; // painted galaxies: the painting carries the light, the stars dress it
      var paints = o.paint ? [].concat(o.paint) : [];
      if (o.photo && paints.some(function (s) { return s.kind === 2; })) paintWaiting++;
```
  (b) In the photo `im.onload`, replace `          pa.needsUpdate = ca.needsUpdate = sa.needsUpdate = true;` with:
```js
          if (o.starGain) for (var di = 0; di < NN * 3; di++) ca.array[di] *= o.starGain;
          pa.needsUpdate = ca.needsUpdate = sa.needsUpdate = true;
          if (paints.some(function (s) { return s.kind === 2; })) { paints.forEach(function (s) { if (s.kind === 2) paintGalaxy(selfLOD, s, R, pc, span); }); paintWaiting--; }
```
  and add `        im.onerror = function () { if (paints.some(function (s) { return s.kind === 2; })) paintWaiting--; }; // no plate: keep the procedural stars, unpainted` before `        im.src = o.photo.src;`.
  (c) After `      var lodRef = galaxyLODs[galaxyLODs.length - 1];` add:
```js
      var selfLOD = lodRef;
      paints.forEach(function (s) { if (s.kind !== 2) paintGalaxy(lodRef, s, R); }); // photo-plate paintings wait for their plate
```
  (d) `bulge()`: use `!= null` defaults and skip zero-opacity sprites:
```js
      function bulge(sz, op, hex) { if (!op) return; var s = …unchanged… }
      bulge(R * (o.haloSize || 0.62), o.haloOpacity != null ? o.haloOpacity : 0.16, o.halo || 0xffcf8a);
      bulge(R * (o.coreSize || 0.2), o.coreOpacity != null ? o.coreOpacity : 0.9, o.core || 0xfff1dc);
```

- [ ] **Step 4: Fade-in in the frame loop.** In the per-galaxy LOD loop, after the `L.pts.quaternion` line:
```js
      if (L.paint) for (var pj = 0; pj < L.paint.length; pj++) { var PJ = L.paint[pj]; if (PJ.born === -1) PJ.born = t; // painting fades in when its bake lands
        if (PJ.born !== null) PJ.mat.uniforms.uFade.value = videoMode || solarReducedMotion() ? 1 : Math.min(1, (t - PJ.born) / 0.6); }
```

- [ ] **Step 5: M31 DEF.** Replace the M31 `stars: { … }` object with:
```js
stars: { count: 26000, radius: 132, arms: 2, tight: 1.5, inc: 1.3, roll: 0.6, warm: 0.32, warmK: 2.2, starGain: 0.45, // tight = the painted arcs' winding
        paint: { kind: 0, seed: 31, arm: [2, 1.5, 1.6, 0.6], rim: [1.2, 0.6, 0.2], body: [0.36, 1.0, 0.7, 0.12], ring: [0.66, 0.2, 0.75], lane: [0.9, 9, 0.12], core: [0.14, 0.9, 0.15, 1.2], tint: [0.35, 0, 0, 0.12],
          pal: [[0, 0xfff1dc], [0.2, 0xffe2c0], [0.42, 0xf4c49a], [0.55, 0xe9c4d2], [0.8, 0xb8c2ff], [1.0, 0xa6b2f4]], young: 0xdbe4ff, hiiCol: 0xe85a72, hii: [0.45, 0, 1],
          anchors: [[80, 34, 8, 0.6, 0xcfdcff]], bright: 0.55 } } // telescope palette: cream nucleus, tan inner disc, mauve, blue-violet ring; NGC 206 at its marker
```

- [ ] **Step 6: Verify.** Run validate.mjs and the self-test (expected: `passed: true`, including `painted-external`). Then the render loop for `M31` with tag `t2`. Expected: matches `$S/pg/ab/v3-M31` (the approved sample). Differences are allowed only from the 0.6 s fade (screenshots wait ≥ 0.9 s per view).

- [ ] **Step 7: Commit.** `git commit -m "feat: painted external galaxies engine; paint Andromeda"`

### Task 3: Photo-plate kind + LMC

**Files:** `index.html` (LMC DEF and the Tarantula child), `test/solar-selftest.js`.

- [ ] **Step 1:** Extend the self-test to assert the Clouds lost their volume: add `ok(galaxyVols.length === 2, 'expected only the SMC volume and the Cen A lane');`. This becomes `=== 1` in Task 8. Run it. Expected: FAIL (`3`).
- [ ] **Step 2: LMC DEF.** Drop `veils` and `vol` and add:
```js
starGain: 0.7, paint: { kind: 2, seed: 21.7, arm: [0, 0, 1, 0.8], rim: [0.07, 0.17, 0.08], body: [0.075, 0.75], core: [0.1, 0, 0, 1], tint: [0.6, 0.12, 0.25, 0.08], plate: [0.75, 1.2, 1],
  pal: [[0, 0xf6efe4], [0.25, 0xece4d6], [0.55, 0xc9cbd6], [0.75, 0xaeb8cf], [1.0, 0x7c8db5], [1.01, 0x7c8db5]], young: 0x9db8f2, hiiCol: 0xe57a8e, hii: [0.8, 0.15, 1],
  anchors: [[-8, -27, 9, 1.2, 0xf2b0bc], [-22, -24, 7, 0.6, 0xe57a8e], [96, 36, 7, 0.6, 0xe57a8e], [36, -7, 5, 0.4, 0xe57a8e]], bright: 0.9 } // bar, blue disc, 30 Dor + N11 from the plate
```
Change the Tarantula child to `lp: new THREE.Vector3(-8, 3, -27), feat: { kind: 'nebula', size: 0.8, color: 0xff5f98, stars: 46 }` (the plate's 30 Dor).
- [ ] **Step 3: Verify.** Self-test passes. Render loop `LMC` tag `t3`: it matches `$S/pg/ab/v3-LMC`. The guide textures replace mip bias, so if the strokes or rim differ, tune `rim` and the gradient step (`uPlateP.x * 0.04`) until they match. The plate is registered: 30 Dor's painted heart sits under the plate's brightest pink stars.
- [ ] **Step 4: Commit.** `feat: paint the Large Magellanic Cloud from its plate`

### Task 4: M33 (flocculent spiral)

- [ ] **Step 1:** Self-test `want` gains `M33: 1`. Run it. Expected: FAIL `M33 has no painting`.
- [ ] **Step 2: M33 DEF**, starting values:
```js
stars: { count: 16000, radius: 108, arms: 2, tight: 0.72, inc: 0.78, roll: 2.2, warm: 0.04, warmK: 4, hii: 0.015, clumps: 300, armJitter: 1.4, haloOpacity: 0, coreSize: 0.06, coreOpacity: 0.5, starGain: 0.5,
  paint: { kind: 0, seed: 33, arm: [2, 0.72, 1.2, 1.1], rim: [1.08, 0.7, 0.3], body: [0.24, 0.55, 0.75, 0.4], ring: [0.5, 0.3, 0], lane: [0.45, 5, 0.1], core: [0.04, 1.2, 0.0, 1.3], tint: [0.4, 0, 0, 0.12],
    pal: [[0, 0xfff4e0], [0.08, 0xead8b8], [0.3, 0xc8d2ec], [0.55, 0xaac4f0], [0.8, 0x8aa2d8], [1.0, 0x6c86c8]], young: 0xd6e4ff, hiiCol: 0xff5f96, hii: [1.0, 0, 1.3, 0.06],
    anchors: [[58, 30, 5, 1.4, 0xe0507a]], bright: 0.7 } }
```
Shrink the NGC 604 child: `feat: { kind: 'nebula', size: 0.75, color: 0xff6a98, stars: 34 }`.
- [ ] **Step 3: Verify and tune.** Render loop `M33` tag `t4` plus `compare.py` against `images/m33.jpg`. Acceptance:
  - blue-white disc, cream centre, no bulge;
  - arm contrast clearly below M31's;
  - many small pink knots;
  - NGC 604 reads as a pink-rose patch under its marker;
  - at the far view it is a blue-white oval, not pink.
- [ ] **Step 4: Commit.** `feat: paint the Triangulum Galaxy`

### Task 5: M104 (disc + spheroid crown)

- [ ] **Step 1:** `want.M104 = 2`. Run the self-test. Expected: FAIL.
- [ ] **Step 2: M104 DEF.** Keep the stars' structure. Remove the `halo`/`halo2`/`core` sprites (`haloOpacity: 0, coreOpacity: 0`, delete the `halo2*` keys). Keep `nucleusSize` at 0.05. Add `starGain: 0.5` and:
```js
paint: [
  { kind: 0, seed: 104, arm: [4, 2.1, 1.2, 0.35], rim: [1.08, 0.95, 0.06], body: [0.45, 0.55, 0.6, 0.7], ring: [0.86, 0.07, 0.8], lane: [0, 7, 0], core: [0.1, 0.2, 0, 1.4], tint: [0.25, 0, 0, 0.06],
    pal: [[0, 0xfff6e8], [0.3, 0xe6dccb], [0.6, 0xd8d4de], [0.85, 0xc4c2cc], [1.0, 0xb4b6c8], [1.1, 0x9a9cb0]], young: 0xc9d4ef, hiiCol: 0xe3a0b0, hii: [0.15, 0, 0.6], bright: 0.6, span: 2.4 }, // the thin disc and its star ring
  { kind: 1, seed: 105, q: 0.7, size: 1024, span: 2.5, arm: [0, 0, 1, 0.5], rim: [1.25, 0.7, 0.06], body: [0.07, 0.95, 0, 0.25], core: [0.05, 0.6, 0, 1.2], tint: [0, 0, 0, 0.05],
    pal: [[0, 0xfffaf0], [0.05, 0xf7efe1], [0.3, 0xe6dccb], [0.5, 0xb5a998], [0.8, 0x8f867b], [1.2, 0x554f49]], bright: 0.8, near: [0.4, 2.2, 0] } // the ivory crown
]
```
- [ ] **Step 3: Verify and tune** against `images/m104.jpg`. Acceptance:
  - from the arrival view, an ivory crown flattened about 0.7 sits behind a thin bright disc;
  - the existing dark ring lane still reads in front of the crown;
  - the brightness is not blown out;
  - the impostor never shows a quad edge.
- [ ] **Step 4: Commit.** `feat: paint the Sombrero Galaxy`

### Task 6: M87 (spheroid)

- [ ] **Step 1:** `want.M87 = 1`. Run the self-test. Expected: FAIL.
- [ ] **Step 2: M87 DEF.** Set `haloOpacity: 0`, `coreOpacity: 0.35`, `starGain: 0.6`, and:
```js
paint: { kind: 1, seed: 87, q: 0.82, span: 2.6, arm: [0, 0, 1, 0.5], rim: [1.3, 0.8, 0.06], body: [0.06, 0.85, 0, 0.3], core: [0.05, 0.5, 0, 1.2], tint: [0, 0, 0, 0.06],
  pal: [[0, 0xffe3bd], [0.1, 0xffe8cc], [0.4, 0xf5e6d1], [0.8, 0xe0d9cc], [1.1, 0xc8c2b8], [1.3, 0xa8a49c]], bright: 0.9, near: [0.9, 2.2, 0] }
```
- [ ] **Step 3: Verify and tune** against `images/m87.jpg`. Acceptance:
  - a smooth warm-cream glow with gentle isophote texture;
  - the jet is still visible and correctly placed;
  - no quad edge;
  - not brighter than the Milky Way core from the load view.
- [ ] **Step 4: Commit.** `feat: paint M87`

### Task 7: Centaurus A (spheroid halo, lane kept)

- [ ] **Step 1:** `want['NGC 5128'] = 1`. Run the self-test. Expected: FAIL.
- [ ] **Step 2: Cen A DEF.** Set `haloOpacity: 0, coreOpacity: 0` and drop the 18-unit veil (keep the 7-unit AGN veil). Keep `dustVol`, `photo` and `dustBand`. Add:
```js
paint: { kind: 1, seed: 128, q: 0.92, span: 3.2, arm: [0, 0, 1, 0.7], rim: [1.5, 0.9, 0.06], body: [0.075, 0.7, 0, 0.3], core: [0.06, 0.5, 0, 1.2], tint: [0, 0, 0, 0.06],
  pal: [[0, 0xfff4e6], [0.15, 0xf2e2c8], [0.4, 0xcfc4b2], [0.8, 0x8f8a82], [1.2, 0x9ba1ad], [1.5, 0x7d828c]], bright: 0.85, near: [0.9, 2.2, 0.35] }
```
- [ ] **Step 3: Verify and tune** against `images/cen-a.jpg`. Acceptance:
  - a round cream halo;
  - the raymarched lane still darkens it;
  - the jets show;
  - the plate stars sit inside the halo.
- [ ] **Step 4: Commit.** `feat: paint Centaurus A's halo`

### Task 8: SMC (photo plate)

- [ ] **Step 1:** Change the volume assertion to `ok(galaxyVols.length === 1, …)`. Run it. Expected: FAIL (`2`).
- [ ] **Step 2: SMC DEF.** Drop `vol` and `veils`; keep `photo` and `coreOpacity: 0`; set `haloOpacity: 0, starGain: 0.7`; add:
```js
paint: { kind: 2, seed: 8.3, arm: [0, 0, 1, 0.9], rim: [0.07, 0.17, 0.08], body: [0.075, 0.75], core: [0.1, 0, 0, 1], tint: [0.5, 0.1, 0.25, 0.08], plate: [0.7, 1.2, 1],
  pal: [[0, 0xeef2ff], [0.3, 0xc6d3f2], [0.6, 0xd8cfbe], [0.8, 0xb8bccb], [1.0, 0x8a92b0], [1.01, 0x8a92b0]], young: 0xc6d3f2, hiiCol: 0xff7aa6, hii: [0.8, 0.15, 1],
  anchors: [[-5, 30, 6, 0.8, 0xff6f9e]], bright: 0.9 } // NGC 346 at its marker
```
- [ ] **Step 3: Verify and tune** against `images/smc-plate.png` and `images/ngc346.jpg`. Acceptance:
  - a blue-white elongated bar with a cream fringe;
  - pink knots where the plate is red;
  - NGC 346 sits under its marker;
  - no hard rim.
- [ ] **Step 4: Commit.** `feat: paint the Small Magellanic Cloud`

### Task 9: Whole-sky balance, performance, video, docs

- [ ] **Step 1: Load view and video presets.** Render the load view and the presets `andromeda-disk-approach`, `magellanic-clouds-wide`, `m87-jet-axis` and `centaurus-a-dust-lane-and-jet` (galaxy-pro-video `bin/` preview or `pm/video.mjs`), main vs branch. Tune each galaxy's `gain` so that no external galaxy outshines the Milky Way core from the load view.
- [ ] **Step 2: Performance.** Measure, desktop and phone profile:
  - frame time at the load view and at each arrival;
  - startup long task;
  - total time until `paintPending() === 0`;
  - compile time of `EXT_PAINT_FRAG`.
  If the first-tile compile hitch is over 100 ms mid-animation, call `renderer.compile(bakeScene, bakeCam)` for the first job at build time instead and re-measure. WebKit and reduced-motion self-tests must pass.
- [ ] **Step 3: Video readiness (private repo, local commit).**
  - In `galaxy-pro-video/runtime/hooks.js`'s `videoBridge`, add `paintPending: function () { return typeof paintPending === 'function' ? paintPending() : 0; },`.
  - In `runtime/director.mjs` `ready()`, require `(!bridge.paintPending || bridge.paintPending() === 0)` alongside the frame and message checks.
  - Run the video audit (`pm/video.mjs`). Expected: ready, deterministic.
  - Check the patch still applies: `git apply --check` of `patches/video-mode.patch` against the branch.
- [ ] **Step 4: Docs and comments.**
  - README paragraph "Photo-sampled neighbour galaxies" in all four languages: the external galaxies are painted from telescope palettes; the Clouds and Cen A paint from their plates; "raymarched volumes" goes.
  - Update the watchdog comment `(~13x near the LMC)`.
  - Self-test final (`want` covers all five analytic galaxies; volumes `=== 1`).
- [ ] **Step 5: Commit**, then adversarial review, PR, and a report to the owner in Chinese.
