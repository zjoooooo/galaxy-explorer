# Painted Milky Way Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Milky Way's nebula-plane look with the approved painted style: a GPU-baked oil-painted disc plus flow-aligned brush strokes, fading to stars up close.

**Architecture:** One new block in `index.html` (`buildPaintedGalaxy`) replaces `nebulaField` and the `?tune` panel. It bakes a fragment shader into a render target progressively (1024² preview, then full-resolution tiles one per frame), draws it on a disc mesh whose shader fades by view depth, and adds an instanced-quad stroke layer. The dust star field, core glows and the FPS watchdog get small edits. Everything rides `galaxyRoot`.

**Tech Stack:** three.js r128 (vendored), WebGL1/2, vanilla JS in one inline script; verification with `test/solar-selftest.js` (`?solarTest=1`), `.github/scripts/validate.mjs`, and Playwright probes in the session scratchpad.

## Global Constraints

- Approved look = scratch sample `scratchpad/paint/index-paint-final.html` (+ the uViewH fix). Final renders must match it at the sample's views.
- Disc bake: 4096² desktop, 2048² touch (`(pointer: coarse)`); half-float target only with WebGL2 + `EXT_color_buffer_float`, else 8-bit.
- Strokes: 150 000 desktop, 60 000 touch; stroke width floor reads the drawing-buffer height every frame; widening capped at 3×.
- Dust stars: 30 000 (was 85 000); brightness `0.75 × (0.3 + 0.9 × smoothstep(450, 150, depth))`.
- Core glows: keep only the 80- and 150-unit sprites, at 0.385 and 0.20 opacity.
- Video mode stays deterministic: bake synchronously in video mode; no `Math.random` in the bake.
- No new dependencies, no build step; `validate.mjs` must pass; the private video patch must still `git apply --check`.

---

### Task 1: Self-test check for the painted galaxy (fails first)

**Files:**
- Modify: `test/solar-selftest.js` (add a check before the final `window.__solarTestResult = …` line)

**Interfaces:**
- Produces: expectations later tasks satisfy — global `paintedGalaxy = { disc, strokes, touch, layers }`, `DUST.count === 30000`, no global `nebMat`.

- [ ] **Step 1: Add the check**

Insert immediately before `    solarMotionOverride = runMotionOverride;`:

```js
    check('painted-galaxy', function () {
      ok(typeof paintedGalaxy === 'object' && paintedGalaxy && paintedGalaxy.disc && paintedGalaxy.strokes, 'painted galaxy missing');
      ok(typeof nebMat === 'undefined', 'old nebula shader still present');
      ok(DUST.count === 30000, 'dust count is not 30000');
      var full = paintedGalaxy.touch ? 60000 : 150000, n = paintedGalaxy.strokes.geometry.instanceCount;
      ok(n === full || n === Math.round(full / 2), 'stroke count ' + n + ' does not match the device tier');
      var buf = renderer.getDrawingBufferSize(new THREE.Vector2());
      paintedGalaxy.strokes.material.uniforms.uViewH.value = 0;
      paintedGalaxy.strokes.onBeforeRender(renderer);
      ok(paintedGalaxy.strokes.material.uniforms.uViewH.value === buf.y, 'stroke view height does not track the drawing buffer');
    });
```

- [ ] **Step 2: Run it and see it fail**

Run (from `/Users/justin/Project/galaxy-pro-video`): `node <scratchpad>/s9/selftest-check.mjs /Users/justin/Project/galaxy-explorer`
Expected: `passed:false`, failure `painted-galaxy: painted galaxy missing`.

- [ ] **Step 3: Commit**

```bash
git add test/solar-selftest.js
git commit -m "test: self-test check for the painted Milky Way"
```

---

### Task 2: Painted disc replaces the nebula plane

**Files:**
- Modify: `index.html` — replace from the line `  // HII / reflection nebula clouds are now rendered IN the nebulaField shader as` through the closing `  })();` of the `?tune` panel IIFE (the line after `    tpOut();`) with the block below.

**Interfaces:**
- Consumes: `DUST`, `galaxyRoot`, `renderer`, `cv`, `videoMode`, `THREE`.
- Produces: global `var paintedGalaxy = { touch, disc, layers, strokes:null, bakeAll }`; Task 3 fills `strokes`.

- [ ] **Step 1: Replace the block**

```js
  // ── painted Milky Way ─────────────────────────────────────────────────────────
  // An oil-painted disc baked once on the GPU (brush strokes smeared along the spiral flow,
  // dark lanes on each arm's inner edge, pink star-forming specks, a cream-gold core) plus
  // instanced brush strokes on top. Far away it reads as a painting; up close the painting
  // fades out and the stars take over. Design: docs/superpowers/specs/2026-10-25-painted-milky-way-design.md
  var paintedGalaxy = null;
  (function buildPaintedGalaxy() {
    var R = DUST.radius, TAU = 6.28318530718;
    var touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    var common =
      'uniform float uR; uniform float uArms; uniform float uTight;' +
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
      'float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }' +
      'float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++){ v += a * noise(p); p = p * 2.03 + 1.7; a *= 0.5; } return v; }' +
      'vec2 flowDir(vec2 p){ float r = max(length(p), 2.0); vec2 er = p / r; vec2 et = vec2(-er.y, er.x); float c = uTight * 6.28318 / uR;' +
      '  vec2 d = normalize(er + et * r * c);' +
      '  float sw = (fbm(p * 0.012 + 3.0) - 0.5) * 1.1;' + // coherent swirl: the strokes wander off the ideal spiral like brushwork
      '  float cs = cos(sw), sn = sin(sw); return vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs); }' +
      'float lic(vec2 p, float freq, float len){ float s = 0.0, w = 0.0; vec2 q = p; vec2 o = vec2(13.1, 7.7);' + // line-integral convolution of noise along the flow = brush strands
      '  for (int i = 0; i < 14; i++){ float t = float(i) / 14.0; float wt = 1.0 - t; s += noise(q * freq + o) * wt; w += wt; q += flowDir(q) * (len / 14.0); }' +
      '  q = p; for (int i = 0; i < 14; i++){ q -= flowDir(q) * (len / 14.0); float t = float(i + 1) / 14.0; float wt = 1.0 - t; s += noise(q * freq + o) * wt; w += wt; }' +
      '  return s / w; }';
    var discFrag =
      'varying vec2 vP; uniform float uBright; uniform float uInter; uniform float uLane; uniform float uHii;' + common +
      'void main(){' +
      '  float r = length(vP), nr = r / uR, ang = atan(vP.y, vP.x);' +
      '  float edgeN = fbm(vP * 0.008 + 21.0);' +
      '  float env = smoothstep(1.12, 0.62, nr + (edgeN - 0.5) * 0.22);' + // soft, ragged rim
      '  if (env <= 0.0 && nr > 0.3) { gl_FragColor = vec4(0.0); return; }' +
      '  vec2 wp = vP * 0.011; float w1 = fbm(wp), w2 = fbm(wp + 4.3);' +
      '  float theta = ang + (w1 - 0.5) * 0.55 - nr * uTight * 6.28318;' + // same winding as the dust arms (beacons keep their places)
      '  float armId = mod(floor(theta * uArms / 6.28318 + 0.5), uArms); float major = 1.0 - step(0.5, mod(armId, 2.0));' +
      '  float arm = pow(max(0.0, cos(uArms * theta) * 0.5 + 0.5), 2.2) * mix(0.62, 1.0, major);' +
      '  float lane = pow(max(0.0, cos(uArms * (theta - 0.12 + (w2 - 0.5) * 0.16)) * 0.5 + 0.5), 7.0) * mix(0.7, 1.0, major);' + // dark lane on the inner (concave) edge of each arm
      '  float fine = lic(vP, 1.25, 7.0);' +    // thin bristle strands
      '  float coarse = lic(vP, 0.22, 34.0);' + // broad brush sweeps
      '  float hair = lic(vP, 2.6, 4.5);' +     // the finest bristles
      '  float strands = clamp((fine - 0.5) * 3.4 + 0.5, 0.0, 1.0) * 0.5 + clamp((coarse - 0.5) * 2.6 + 0.5, 0.0, 1.0) * 0.45 + clamp((hair - 0.5) * 3.0 + 0.5, 0.0, 1.0) * 0.35;' +
      '  float dens = env * (uInter + (1.0 - uInter) * arm) * (0.12 + 1.15 * strands * strands);' +
      '  dens *= 0.55 + 0.6 * fbm(vP * 0.03 + vec2(w1, w2) * 3.0);' + // patchy clouds
      '  float absorb = lane * smoothstep(0.07, 0.24, nr) * smoothstep(1.0, 0.7, nr) * (0.45 + 0.75 * clamp((coarse - 0.35) * 2.5, 0.0, 1.0)) * (0.55 + 0.75 * fbm(vP * 0.045 + 9.0));' +
      '  dens *= 1.0 - uLane * clamp(absorb * 1.5, 0.0, 1.0);' +
      // palette: warm core → lavender → blue rim; arms cooler and whiter, the gaps purpler, a few violet patches
      '  float patchy = fbm(vP * 0.006 + 40.0);' +
      '  vec3 col = mix(vec3(1.0, 0.74, 0.66), vec3(0.60, 0.60, 1.0), smoothstep(0.1, 0.4, nr));' +
      '  col = mix(col, vec3(0.26, 0.44, 1.0), smoothstep(0.32, 0.85, nr + (patchy - 0.5) * 0.5));' +
      '  col = mix(col, vec3(0.72, 0.44, 0.98), smoothstep(0.58, 0.78, patchy) * 0.4 * smoothstep(0.15, 0.4, nr));' +
      '  col = mix(col * vec3(0.92, 0.72, 1.05), col * vec3(0.95, 1.0, 1.06) + 0.05, arm);' +
      '  col += (coarse - 0.5) * vec3(0.10, 0.04, 0.14);' +
      // pink star-forming specks, clustered along the arms
      '  float kn = smoothstep(0.62, 0.8, noise(vP * 0.55 + 31.0) * 0.55 + noise(vP * 1.6 + 5.0) * 0.45) * (0.35 + 0.65 * arm) * smoothstep(0.16, 0.34, nr) * env * (0.4 + 0.8 * smoothstep(0.4, 0.7, fbm(vP * 0.02 + 70.0)));' +
      '  col = mix(col, vec3(1.0, 0.26, 0.42), clamp(kn * 1.8, 0.0, 1.0) * uHii);' +
      '  dens += kn * uHii * (1.0 - uLane * clamp(absorb, 0.0, 1.0));' +
      // the bulge: cream-gold, brushwork too (the two glow sprites add the hot centre)
      '  float core = exp(-pow(nr / 0.19, 1.4));' +
      '  col = mix(col, vec3(1.0, 0.80, 0.52), clamp(core * 1.3, 0.0, 1.0));' +
      '  float inten = dens * uBright * 0.62 + core * (0.25 + 0.75 * strands) * uBright * 0.85;' +
      '  gl_FragColor = vec4(col * inten, 1.0);' +
      '}';
    var size = touch ? 2048 : 4096, tiles = size / (touch ? 256 : 512); // full-res bake in tiles, one per frame
    var half = renderer.capabilities.isWebGL2 && renderer.extensions.has('EXT_color_buffer_float');
    function makeRT(n) { return new THREE.WebGLRenderTarget(n, n, { format: THREE.RGBAFormat, type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true }); }
    var span = R * 2.5, geo = new THREE.PlaneGeometry(span, span, 1, 1);
    var bakeMat = new THREE.ShaderMaterial({
      uniforms: { uR: { value: R }, uArms: { value: DUST.arms }, uTight: { value: DUST.tight }, uBright: { value: 1.0 }, uInter: { value: 0.32 }, uLane: { value: 0.95 }, uHii: { value: 1.0 } },
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: discFrag, blending: THREE.NoBlending, depthWrite: false
    });
    var bakeScene = new THREE.Scene(); bakeScene.add(new THREE.Mesh(geo, bakeMat));
    var bakeCam = new THREE.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, 0.1, 10); bakeCam.position.z = 1; bakeCam.lookAt(0, 0, 0);
    function bakeTile(rt, tile, grid) { // render one cell of a grid×grid split of the target (grid 1 = whole target)
      var n = rt.width / grid, cc = renderer.getClearColor(new THREE.Color()), ca = renderer.getClearAlpha();
      rt.scissor.set((tile % grid) * n, Math.floor(tile / grid) * n, n, n); rt.scissorTest = grid > 1;
      renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(bakeScene, bakeCam);
      renderer.setRenderTarget(null); renderer.setClearColor(cc, ca); rt.scissorTest = false;
    }
    var preview = makeRT(1024), full = makeRT(size), mapU = { value: preview.texture }, next = 0;
    bakeTile(preview, 0, 1); // ~1/16 of the full cost: the disc is there on the first frame
    function finish() { mapU.value = full.texture; if (preview) { preview.dispose(); preview = null; } }
    function bakeAll() { for (var t = 0; t < tiles * tiles; t++) bakeTile(full, t, tiles); next = tiles * tiles; finish(); }
    function stepBake() { if (next >= tiles * tiles) return; bakeTile(full, next++, tiles); if (next < tiles * tiles) requestAnimationFrame(stepBake); else finish(); }
    if (videoMode) bakeAll(); else requestAnimationFrame(stepBake); // captures need the final texture on their first frame
    cv.addEventListener('webglcontextrestored', bakeAll); // a restored context brings the target back empty
    // the disc: the painting fades by view depth, so whatever is close to the camera dissolves into stars.
    // Two faint copies above/below give it some body edge-on; they only draw at grazing angles.
    var layers = [0, 3.5, -3.5].map(function (y, i) {
      var m = new THREE.ShaderMaterial({
        uniforms: { uMap: mapU, uGain: { value: i ? 0 : 1 } },
        vertexShader: 'varying vec2 vUv; varying float vDepth; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDepth = -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform sampler2D uMap; uniform float uGain; varying vec2 vUv; varying float vDepth;' +
          'void main(){ float near = mix(0.15, 1.0, smoothstep(40.0, 240.0, vDepth)); gl_FragColor = vec4(texture2D(uMap, vUv).rgb * near * uGain, 1.0); }',
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      });
      var mesh = new THREE.Mesh(geo, m); mesh.rotation.x = Math.PI / 2; mesh.position.y = y; mesh.frustumCulled = false; mesh.visible = !i;
      galaxyRoot.add(mesh);
      return mesh;
    });
    paintedGalaxy = {
      touch: touch, disc: layers[0], layers: layers, strokes: null, bakeAll: bakeAll,
      updateView: function (cam) { // edge-on body: fade the two copies in below ~14° elevation
        var sinEl = Math.abs(cam.position.y) / Math.max(cam.position.length(), 1e-3), g = Math.max(0, 1 - sinEl / 0.25) * 0.35;
        layers[0].material.uniforms.uGain.value = 1 - g;
        for (var k = 1; k < 3; k++) { layers[k].visible = g > 0.001; layers[k].material.uniforms.uGain.value = g; }
      }
    };
  })();
```

- [ ] **Step 2: Call `updateView` each frame**

In `frame()`, immediately before the line that starts `    var cbk = 0.0012 * camera.position.length()`, add:

```js
    if (paintedGalaxy) paintedGalaxy.updateView(camera);
```

- [ ] **Step 3: Static checks**

Run: `node .github/scripts/validate.mjs` → `✓ All checks passed.`
Run: `grep -c "nebMat\|tp_copy\|[?&]tune" index.html` → `0`.

- [ ] **Step 4: Self-test still fails only on strokes**

Run the self-test probe (Task 1 Step 2). Expected failure: `painted-galaxy: …` mentions strokes (`Cannot read properties of null` or count), not "painted galaxy missing".

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: painted Milky Way disc replaces the nebula plane"
```

---

### Task 3: Brush strokes and the watchdog rung

**Files:**
- Modify: `index.html` — append the stroke block inside `buildPaintedGalaxy`, after the `paintedGalaxy = { … };` statement; add a rung to `degradeRendering`; add `perfStrokesHalved` to the perf-flag `var` line.

**Interfaces:**
- Consumes: `paintedGalaxy` from Task 2.
- Produces: `paintedGalaxy.strokes` (Mesh with `InstancedBufferGeometry`, `instanceCount` = tier count, material uniform `uViewH`).

- [ ] **Step 1: Add the strokes** (inside `buildPaintedGalaxy`, after `paintedGalaxy = { … };`)

```js
    // brush strokes: thin instanced quads lying in the disc, each aligned with the local spiral flow
    var C = DUST.tight * TAU / R, N = touch ? 60000 : 150000;
    function h(n) { var s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
    function vn(x, y) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = h(xi * 57 + yi * 131), b = h((xi + 1) * 57 + yi * 131), c = h(xi * 57 + (yi + 1) * 131), d = h((xi + 1) * 57 + (yi + 1) * 131);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
    var quad = new THREE.InstancedBufferGeometry();
    quad.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
    quad.setIndex([0, 1, 2, 0, 2, 3]);
    var iPos = new Float32Array(N * 3), iDir = new Float32Array(N * 2), iSize = new Float32Array(N * 2), iCol = new Float32Array(N * 3);
    var col = new THREE.Color(), cA = new THREE.Color(0xffc2a8), cB = new THREE.Color(0x9a9cff), cC = new THREE.Color(0x4c74ff), cW = new THREE.Color(0xe8eeff), cP = new THREE.Color(0xff4470);
    for (var i = 0; i < N; i++) {
      var onArm = Math.random() < 0.72, rf = Math.min(1.08, Math.pow(Math.random(), 0.78) * 1.06), r = rf * R;
      var idx = Math.floor(Math.random() * DUST.arms), major = idx % 2 === 0;
      if (onArm && !major && Math.random() < 0.35) { idx = (idx + 1) % DUST.arms; major = true; } // the major arms carry more paint
      var spread = onArm ? (Math.random() + Math.random() + Math.random() - 1.5) * 0.32 : Math.random() * TAU;
      var ang = idx * (TAU / DUST.arms) + rf * DUST.tight * TAU + spread + (vn(r * 0.02, idx * 3.1) - 0.5) * 0.5;
      var x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      iPos[i * 3] = x; iPos[i * 3 + 2] = z; iPos[i * 3 + 1] = (Math.random() + Math.random() - 1) * (5 + 9 * (1 - rf));
      var er = Math.max(r, 2), ex = x / er, ez = z / er, kk = er * C, dx = ex - ez * kk, dz = ez + ex * kk, dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
      var sw = (vn(x * 0.012 + 3, z * 0.012 + 3) - 0.5) * 1.1 + (Math.random() - 0.5) * 0.25, cs = Math.cos(sw), sn = Math.sin(sw);
      iDir[i * 2] = dx * cs - dz * sn; iDir[i * 2 + 1] = dx * sn + dz * cs;
      iSize[i * 2] = 1.6 + Math.random() * Math.random() * 6.5; iSize[i * 2 + 1] = 0.28 + Math.random() * 0.3;
      col.copy(cA).lerp(cB, Math.min(1, Math.max(0, (rf - 0.12) / 0.38)));
      if (rf > 0.45) col.lerp(cC, Math.min(1, (rf - 0.45) / 0.5));
      var roll = Math.random();
      if (roll < 0.03 && rf > 0.2) col.copy(cW);
      else if (roll < 0.10 && rf > 0.18) { col.copy(cP); iSize[i * 2] = 0.5 + Math.random() * 0.5; iSize[i * 2 + 1] *= 1.3; } // pink HII specks: dots, not dashes
      var bright = (onArm ? (major ? 1.0 : 0.7) : 0.45) * (0.45 + Math.random() * 0.75) * (rf < 0.12 ? 0.6 : 1) * (1 - 0.6 * Math.max(0, (rf - 0.82) / 0.26));
      var th = ang - rf * DUST.tight * TAU, ln = Math.pow(Math.max(0, Math.cos(DUST.arms * (th - 0.12)) * 0.5 + 0.5), 7) * (rf > 0.08 && rf < 1 ? 1 : 0);
      bright *= 1 - 0.85 * ln; // strokes avoid the dust lanes too
      iCol[i * 3] = col.r * bright; iCol[i * 3 + 1] = col.g * bright; iCol[i * 3 + 2] = col.b * bright;
    }
    quad.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
    quad.setAttribute('iDir', new THREE.InstancedBufferAttribute(iDir, 2));
    quad.setAttribute('iSize', new THREE.InstancedBufferAttribute(iSize, 2));
    quad.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
    quad.instanceCount = N;
    var strokeMat = new THREE.ShaderMaterial({
      uniforms: { uViewH: { value: 1 }, uGain: { value: 0.8 } },
      vertexShader:
        'attribute vec3 iPos; attribute vec2 iDir; attribute vec2 iSize; attribute vec3 iCol; uniform float uViewH; uniform float uGain; varying vec2 vUv; varying vec3 vCol;' +
        'void main(){ vec4 mc = modelViewMatrix * vec4(iPos, 1.0);' +
        '  float pxPerU = projectionMatrix[1][1] * uViewH * 0.5 / max(-mc.z, 0.1);' +
        '  float k = clamp(1.1 / max(iSize.y * pxPerU, 1e-3), 1.0, 3.0);' + // never thinner than ~1px: widen (at most 3x) and dim instead, so far strokes don't shimmer
        '  vec3 d = vec3(iDir.x, 0.0, iDir.y), n = vec3(-iDir.y, 0.0, iDir.x);' +
        '  vec3 off = d * position.x * iSize.x + n * position.y * iSize.y * k;' +
        '  gl_Position = projectionMatrix * (mc + modelViewMatrix * vec4(off, 0.0));' +
        '  vUv = position.xy; vCol = iCol * uGain / k; }',
      fragmentShader: 'varying vec2 vUv; varying vec3 vCol; void main(){ float a = pow(max(0.0, 1.0 - vUv.x * vUv.x), 1.5) * exp(-vUv.y * vUv.y * 2.2); gl_FragColor = vec4(vCol * a, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    var strokes = new THREE.Mesh(quad, strokeMat); strokes.frustumCulled = false; galaxyRoot.add(strokes);
    var bufSize = new THREE.Vector2();
    strokes.onBeforeRender = function (r) { strokeMat.uniforms.uViewH.value = r.getDrawingBufferSize(bufSize).y; }; // the real buffer height every frame (a 0-height first layout once blew every stroke up 1100x)
    paintedGalaxy.strokes = strokes;
```

- [ ] **Step 2: Watchdog rung**

Change `  var perfVolHalved = false, perfVolHidden = false, perfBloomOff = false;` to

```js
  var perfVolHalved = false, perfVolHidden = false, perfBloomOff = false, perfStrokesHalved = false;
```

In `degradeRendering`, insert before `    if (withVolumes && !perfVolHidden && galaxyVols.length) {`:

```js
    if (withVolumes && !perfStrokesHalved && paintedGalaxy && paintedGalaxy.strokes) { // the painted disc's brush strokes: half of them (they are generated in random order)
      perfStrokesHalved = true;
      paintedGalaxy.strokes.geometry.instanceCount = Math.round(paintedGalaxy.strokes.geometry.instanceCount / 2);
      return 'brush strokes reduced';
    }
```

- [ ] **Step 3: Checks**

`node .github/scripts/validate.mjs` → pass. Self-test → only `dust count is not 30000` remains.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: flow-aligned brush strokes on the painted disc"
```

---

### Task 4: Dust stars and core glows for the painted look

**Files:**
- Modify: `index.html` — `DUST` tunables, `buildDust` material, `centralBulge` glows.

- [ ] **Step 1: Dust count** — in `var DUST = { count: 85000, …` change `count: 85000` to `count: 30000`.

- [ ] **Step 2: Distance-dependent dust brightness** — in `buildDust`, replace the material's `uniforms` and `vertexShader` lines with:

```js
      uniforms: { uSize: { value: DUST.size * renderer.getPixelRatio() }, uCap: { value: 34 * renderer.getPixelRatio() } },
      vertexShader: 'uniform float uSize; uniform float uCap; attribute float aScale; attribute vec3 aColor; varying vec3 vColor;' +
        'void main(){ vec4 mp = modelMatrix * vec4(position,1.0); vec4 vp = viewMatrix * mp; gl_Position = projectionMatrix * vp;' +
        ' gl_PointSize = min(uSize * aScale * (300.0 / -vp.z), uCap); vColor = aColor * 0.75 * (0.3 + 0.9 * smoothstep(450.0, 150.0, -vp.z)); }', // quiet over the painting from afar, sparkling up close
```

- [ ] **Step 3: Core glows** — in `centralBulge`, replace the `var glows = [ … ];` line with:

```js
    var glows = [{ c: 0xfffdf6, s: 80, o: 0.385 }, { c: 0xfff3da, s: 150, o: 0.20 }]; // the painted disc paints its own core; only the hot centre stays a glow
```

- [ ] **Step 4: Checks** — `validate.mjs` passes; self-test passes (Chromium) including `painted-galaxy`.

- [ ] **Step 5: Visual match against the approved sample** — render the six sample views (`<scratchpad>/paint/shots.mjs`) on a scratch site built from the working tree and compare side by side with `paint/v5/*`. They must match closely (same palette, strokes, lanes, core). Fix any drift before committing.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: dust stars and core glows tuned for the painted disc"
```

---

### Task 5: Docs

**Files:**
- Modify: `README.md`, `README.zh-CN.md`, `README.ja.md`, `README.ko.md`, `CONTRIBUTING.md`, `docs/superpowers/specs/2026-10-25-painted-milky-way-design.md` (core glows wording).

- [ ] **Step 1:** In each README, replace the "Spiral disc" and "Volumetric-looking nebula" feature bullets with one bullet describing the painted disc (brush strokes along the spiral, dust lanes, pink star-forming specks, warm core, ~30,000 stars that brighten up close, 150,000 brush strokes); delete the `?tune=1` bullet; update the "How it works" steps 1–2 and the `DUST` tunables snippet (`count: 30000`). Same meaning in all four languages.
- [ ] **Step 2:** `CONTRIBUTING.md`: drop "and `?tune=1` for the nebula shader sliders".
- [ ] **Step 3:** Spec: "Core glows" line → "the 440- and 270-unit halos are removed; the 80- and 150-unit glows are dimmed".
- [ ] **Step 4:** `validate.mjs` passes; commit `docs: README and contributing notes for the painted Milky Way`.

---

### Task 6: Verification, review, PR

- [ ] Build a scratch site from the branch (`<scratchpad>/v10/mksite.sh`), render `vshots.mjs` and the six sample views against `base`/`main`; also a below-the-disc view (camera `(420, -330, 760)`), an edge-on view, and the zero-height regression (load with `viewport.height` tiny, then resize, check `uViewH` equals the buffer height and no stroke is wider than 3×).
- [ ] Perf (`<scratchpad>/paint/perf.mjs`): desktop @2x and phone profile, main vs branch; record startup long tasks (the tiled bake must not add a long task over ~50 ms on desktop).
- [ ] WebKit: self-test and a screenshot.
- [ ] Video: `video-compare.mjs` audit state identical except the expected look; `git apply --check` of the private patch.
- [ ] Adversarial review workflow; fix confirmed findings.
- [ ] Push, open the PR with before/after numbers.

---

## Review outcome (2026-10-25)

The adversarial review found that the stroke layer of Task 3 faced −y and was back-face culled in every view above the disc, so the approved sample never showed it; from below it washed the arms white, and made double-sided it erased the dust lanes. Task 3's strokes, its watchdog rung and its self-test asserts were removed; the painted disc alone is the approved look. The review also led to `depthBuffer: false` on the bake targets (32 MiB saved on desktop), mipmaps generated only once the last tile is baked, and four stale comments fixed.
