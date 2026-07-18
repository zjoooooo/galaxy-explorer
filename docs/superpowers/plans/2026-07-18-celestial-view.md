# Celestial View (12 Zodiac Constellations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Earth-centred 3D sky view showing the 12 zodiac constellations as real star stick-figures, entered from a link in the Solar System beacon card, with per-constellation info cards.

**Architecture:** A second `THREE.Scene` (`skyScene`) sharing the existing renderer and rAF loop; a `viewMode` flag picks which scene renders. Constellations are drawn per-constellation (own `Points` + `LineSegments` so select/dim is a material tweak). HTML name labels reuse the beacon screen-projection idea; the info card reuses the `#beacon-panel` DOM with a different fill function.

**Tech Stack:** Vanilla JS + three.js r128 (vendored), single-file `index.html`, no build, no new dependencies.

## Global Constraints

- Single file: all changes in `index.html`. No new files, no new dependencies, no build step.
- Languages `en`/`hans`/`hant` follow the existing `gx-lang` mechanism; sky labels and cards re-render on switch.
- Galaxy view stays untouched while in sky view (state preserved; rendering skipped).
- No bloom for the sky view (plain `renderer.render`). No URL routing. No non-zodiac constellations.
- Esc semantics in sky view: card open → close card; else → exit to galaxy. Galaxy-view Esc behaviour unchanged.
- `F` cinema hides sky labels, back button, and panel like other chrome.
- Verification = serve over HTTP (`python3 -m http.server 8123`), drive the browser, plus `assertZodiacData()` self-check.

---

### Task 1: View-switch skeleton — sky scene, backdrop, enter/exit

**Files:**
- Modify: `index.html` — CSS (back-button style + cinema rule), body markup (back button), JS (sky scene + `viewMode` + `frame()` branch + resize).

**Interfaces:**
- Consumes: existing `renderer`, `frame()` loop, `toggleCinema`, `clearSelection`, `BEACONS` overlay `#beacons`.
- Produces: `viewMode` (`'galaxy'|'sky'`), `skyScene`, `skyCamera`, `skyControls`, `skyTwinkleMat`, `SKY_R`, `raDecDir(raHours, decDeg)`, `enterSky()`, `exitSky()`, back-button DOM `#skyback`.

- [ ] **Step 1: CSS.** In the cinema rule, add the two new ids; then add the back-button style. Replace:

```css
  body.gx-cinema #title, body.gx-cinema #audio, body.gx-cinema #beacons, body.gx-cinema #lang { display: none !important; }
```

with:

```css
  body.gx-cinema #title, body.gx-cinema #audio, body.gx-cinema #beacons, body.gx-cinema #lang,
  body.gx-cinema #skyback, body.gx-cinema #skylabels { display: none !important; }
```

After the `#lang:hover` rule add:

```css
  /* sky view: back-to-galaxy button */
  #skyback { top: 64px; left: 18px; z-index: 6; display: none; cursor: pointer; font-size: 13px;
    color: #cbd5e1; background: rgba(10,14,24,.72); border: 1px solid #243049; border-radius: 8px; padding: 6px 12px; }
  #skyback:hover { border-color: #6366f1; color: #fff; }
```

- [ ] **Step 2: Markup.** After the `<select id="lang" …></select>` element add:

```html
<div id="skyback" class="overlay">← Back to Galaxy</div>
```

- [ ] **Step 3: Sky scene JS.** Insert a new section right BEFORE the `// ── render loop` comment:

```js
  // ── celestial sky view: an Earth-centred rotatable star dome ────────────────
  var viewMode = 'galaxy';
  var SKY_R = 1000;
  function raDecDir(raHours, decDeg) { // J2000 → unit direction on the sky sphere
    var ra = raHours / 24 * Math.PI * 2, dec = decDeg * Math.PI / 180;
    return new THREE.Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), -Math.cos(dec) * Math.sin(ra));
  }
  var skyScene = new THREE.Scene();
  var skyCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
  skyCamera.position.set(0, 0, 0.1); // tiny offset: OrbitControls needs a nonzero radius to orbit
  var skyControls = new THREE.OrbitControls(skyCamera, renderer.domElement);
  skyControls.enablePan = false; skyControls.enableZoom = false;
  skyControls.enableDamping = true; skyControls.dampingFactor = 0.08;
  skyControls.rotateSpeed = -0.35;              // inverted: drag the SKY, not the camera
  skyControls.autoRotate = true; skyControls.autoRotateSpeed = 0.12; // slow idle drift
  skyControls.enabled = false;                  // only active in sky view
  var skyTwinkleMat = null;
  (function skyBackdrop() {
    // faint twinkling background stars
    var N = 2500, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), phs = new Float32Array(N), spd = new Float32Array(N), c = new THREE.Color();
    for (var i = 0; i < N; i++) {
      var th = Math.random() * 6.28318, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = SKY_R * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = SKY_R * Math.cos(ph); pos[i * 3 + 2] = SKY_R * Math.sin(ph) * Math.sin(th);
      var b = 0.35 + Math.random() * 0.55, tint = Math.random();
      if (tint < 0.12) c.setRGB(b * 0.74, b * 0.85, b); else if (tint < 0.2) c.setRGB(b, b * 0.85, b * 0.65); else c.setRGB(b, b, b);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      phs[i] = Math.random() * 6.28318; spd[i] = 0.5 + Math.random() * 1.4;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phs, 1));
    g.setAttribute('aSpd', new THREE.BufferAttribute(spd, 1));
    skyTwinkleMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: 3.0 * renderer.getPixelRatio() } },
      vertexShader: 'uniform float uTime; uniform float uSize; attribute vec3 aColor; attribute float aPhase; attribute float aSpd; varying vec3 vColor;' +
        'void main(){ vec4 vp = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * vp;' +
        ' float tw = 0.75 + 0.25 * sin(uTime * aSpd + aPhase);' +
        ' gl_PointSize = uSize * (0.7 + 0.5 * tw); vColor = aColor * tw; }',
      fragmentShader: 'varying vec3 vColor; void main(){ float d = distance(gl_PointCoord, vec2(0.5)); if (d > 0.5) discard; float s = pow(max(0.0, 1.0 - d * 2.0), 1.4); gl_FragColor = vec4(vColor, s); }',
      transparent: true, depthWrite: false
    });
    skyScene.add(new THREE.Points(g, skyTwinkleMat));
    // the Milky Way as a faint band: points scattered around the galactic equator
    // (galactic north pole: RA 12.857h, Dec +27.13°)
    var pole = raDecDir(12.857, 27.13);
    var u = new THREE.Vector3(0, 1, 0).cross(pole).normalize(), v = pole.clone().cross(u);
    var M = 1600, mp = new Float32Array(M * 3), mc = new Float32Array(M * 3);
    function gs() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; } // ~gaussian −1..1
    for (var m = 0; m < M; m++) {
      var phi = Math.random() * 6.28318, lat = gs() * 0.12; // ±~7° gaussian band
      var d3 = u.clone().multiplyScalar(Math.cos(phi)).addScaledVector(v, Math.sin(phi)).addScaledVector(pole, lat).normalize();
      mp[m * 3] = d3.x * SKY_R; mp[m * 3 + 1] = d3.y * SKY_R; mp[m * 3 + 2] = d3.z * SKY_R;
      var mb = 0.10 + Math.random() * 0.22;
      mc[m * 3] = mb; mc[m * 3 + 1] = mb; mc[m * 3 + 2] = mb * 1.12;
    }
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    mg.setAttribute('color', new THREE.BufferAttribute(mc, 3));
    skyScene.add(new THREE.Points(mg, new THREE.PointsMaterial({ size: 7, vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })));
    // faint ecliptic circle (obliquity 23.44°) — the zodiac's spine
    var E = 128, ep = new Float32Array(E * 3), eps = 23.439 * Math.PI / 180;
    for (var e = 0; e < E; e++) {
      var lam = e / E * 6.28318;
      var raE = Math.atan2(Math.sin(lam) * Math.cos(eps), Math.cos(lam)), decE = Math.asin(Math.sin(eps) * Math.sin(lam));
      var ed = new THREE.Vector3(Math.cos(decE) * Math.cos(raE), Math.sin(decE), -Math.cos(decE) * Math.sin(raE));
      ep[e * 3] = ed.x * SKY_R; ep[e * 3 + 1] = ed.y * SKY_R; ep[e * 3 + 2] = ed.z * SKY_R;
    }
    var eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    skyScene.add(new THREE.LineLoop(eg, new THREE.LineBasicMaterial({ color: 0xc9a86a, transparent: true, opacity: 0.22 })));
  })();
  var skybackEl = document.getElementById('skyback');
  function enterSky() {
    if (viewMode === 'sky') return;
    clearSelection();                          // close the beacon panel + ring
    viewMode = 'sky';
    controls.enabled = false; skyControls.enabled = true;
    document.getElementById('beacons').style.display = 'none';
    skybackEl.style.display = 'block';
  }
  function exitSky() {
    if (viewMode === 'galaxy') return;
    if (window.clearSkySelection) clearSkySelection(); // close a sky card if open (Task 5)
    viewMode = 'galaxy';
    skyControls.enabled = false; controls.enabled = true;
    document.getElementById('beacons').style.display = '';
    skybackEl.style.display = 'none';
    perfLast = 0;                              // don't feed the sky stint into the FPS watchdog
  }
  skybackEl.addEventListener('click', exitSky);
  window.addEventListener('keydown', function (e) {
    if ((e.key || '').toLowerCase() !== 'escape' || viewMode !== 'sky') return;
    if (window.skySelected != null) return;    // Task 5's handler closes the card first
    exitSky();
  });
```

- [ ] **Step 4: `frame()` branch.** In `frame()`, right after `var t = (performance.now() - t0) / 1000;` insert:

```js
    if (viewMode === 'sky') {
      if (skyTwinkleMat) skyTwinkleMat.uniforms.uTime.value = t;
      skyControls.update();
      renderer.render(skyScene, skyCamera);
      if (window.updateSkyLabels) updateSkyLabels(); // Task 3
      rafId = requestAnimationFrame(frame);
      return;
    }
```

- [ ] **Step 5: Resize.** In the existing `resize` listener, after `camera.updateProjectionMatrix();` add:

```js
    skyCamera.aspect = window.innerWidth / window.innerHeight; skyCamera.updateProjectionMatrix();
```

- [ ] **Step 6: Verify.** Serve + load. In console: `enterSky()` → galaxy disappears, a dark dome of faint twinkling stars with a soft Milky-Way band and a faint gold ecliptic circle; drag rotates the view (sky follows the drag); back button top-left and Esc both return to the untouched galaxy view. Cinema `F` hides the back button. No console errors.

- [ ] **Step 7: Commit.**

```bash
git add index.html
git commit -m "Add celestial sky view skeleton with backdrop and view switching"
```

---

### Task 2: ZODIAC data + self-check

**Files:**
- Modify: `index.html` — add `ZODIAC` array + `assertZodiacData()` right after the sky-backdrop IIFE from Task 1.

**Interfaces:**
- Consumes: nothing (pure data).
- Produces: global `ZODIAC` (12 entries: `{key, symbol, t:{en,hans,hant}, stars:[[raH,dec,mag]…], starNames:[…], lines:[[i,j]…], info:{en,hans,hant:{dates,brightest,desc}}}`), `assertZodiacData()`.

- [ ] **Step 1: Insert the data block.**

```js
  // ── the 12 zodiac constellations: real J2000 star positions + traditional figures ──
  // (authored + adversarially cross-checked; raHours decimal, decDeg, visual mag)
  var ZODIAC = [
    { key:"aries", symbol:"♈",
      t:{"en":"Aries","hans":"白羊座","hant":"白羊座"},
      stars:[[2.12,23.46,2],[1.91,20.81,2.64],[1.89,19.29,3.86],[2.83,27.26,3.63],[3.19,19.73,4.35]],
      starNames:["Hamal","Sheratan","Mesarthim","Bharani (41 Ari)","Botein"],
      lines:[[2,1],[1,0],[0,3],[3,4]],
      info:{
        en:{"dates":"Mar 21 – Apr 19","brightest":"Hamal","desc":"Aries represents the golden-fleeced ram of Greek myth that rescued Phrixus and carried him across the sea; its fleece became the Golden Fleece sought by Jason and the Argonauts. Around 2,000 years ago the Sun crossed the vernal equinox here, which is why that point is still called the First Point of Aries. Its brightest star, Hamal, is an orange giant about 66 light-years away."},
        hans:{"dates":"3月21日 – 4月19日","brightest":"娄宿三","desc":"白羊座源自希腊神话中背负王子佛里克索斯渡海逃生的金毛公羊，它的羊毛就是伊阿宋与阿尔戈英雄们苦苦追寻的金羊毛。约两千年前春分点位于此座，因此春分点至今仍被称为“白羊宫第一点”。座内最亮星娄宿三是一颗距离地球约66光年的橙色巨星。"},
        hant:{"dates":"3月21日 – 4月19日","brightest":"婁宿三","desc":"白羊座源自希臘神話中背負王子佛里克索斯渡海脫險的金毛公羊，其羊毛正是伊阿宋與阿爾戈英雄們追尋的金羊毛。約兩千年前春分點位於此座，故春分點至今仍稱為「白羊宮第一點」。座內最亮星婁宿三是一顆距離地球約66光年的橙色巨星。"} } },
    { key:"taurus", symbol:"♉",
      t:{"en":"Taurus","hans":"金牛座","hant":"金牛座"},
      stars:[[4.599,16.51,0.85],[5.438,28.61,1.65],[5.627,21.14,2.97],[4.477,19.18,3.53],[4.382,17.54,3.77],[4.33,15.63,3.65],[4.478,15.87,3.4],[4.011,12.49,3.47],[3.453,9.73,3.74]],
      starNames:["Aldebaran","Elnath","Tianguan (ζ Tau)","Ain (ε Tau)","δ Tauri","γ Tauri","Chamukuy (θ² Tau)","λ Tauri","ξ Tauri"],
      lines:[[0,2],[3,1],[3,4],[4,5],[5,6],[6,0],[5,7],[7,8]],
      info:{
        en:{"dates":"Apr 20 – May 20","brightest":"Aldebaran","desc":"Taurus represents the bull whose form Zeus took to carry the princess Europa across the sea. Its fiery orange eye is Aldebaran, a red giant star, set within the V-shaped Hyades cluster that outlines the bull's face, while the horns stretch to Elnath and Zeta Tauri. The constellation also hosts the famous Pleiades cluster and the Crab Nebula, remnant of a supernova seen in 1054 AD."},
        hans:{"dates":"4月20日 – 5月20日","brightest":"毕宿五","desc":"金牛座源自希腊神话:宙斯化身为一头雪白的公牛,驮着腓尼基公主欧罗巴渡海而去。橙红色的红巨星毕宿五是\"公牛之眼\",镶嵌在勾勒牛脸的V字形毕星团中,双角则伸向五车五和天关。座内还有著名的昴星团(七姐妹星团)以及公元1054年超新星遗迹——蟹状星云。"},
        hant:{"dates":"4月20日 – 5月20日","brightest":"畢宿五","desc":"金牛座源自希臘神話:宙斯化身為一頭雪白的公牛,馱著腓尼基公主歐羅巴渡海而去。橙紅色的紅巨星畢宿五是「公牛之眼」,鑲嵌在勾勒牛臉的V字形畢星團中,雙角則伸向五車五與天關。座內還有著名的昴星團(七姊妹星團)以及公元1054年超新星遺跡——蟹狀星雲。"} } },
    { key:"gemini", symbol:"♊",
      t:{"en":"Gemini","hans":"双子座","hant":"雙子座"},
      stars:[[7.577,31.89,1.58],[7.755,28.03,1.14],[6.629,16.4,1.92],[7.335,21.98,3.53],[6.732,25.13,3.06],[6.383,22.51,2.87],[6.248,22.51,3.31],[7.068,20.57,3.93],[6.755,12.9,3.35],[7.741,24.4,3.57]],
      starNames:["Castor","Pollux","Alhena","Wasat","Mebsuta","Tejat","Propus","Mekbuda","Alzirr","Kappa Gem"],
      lines:[[0,1],[0,4],[4,5],[5,6],[1,9],[1,3],[3,7],[7,2],[3,8]],
      info:{
        en:{"dates":"May 21 – Jun 21","brightest":"Pollux","desc":"Gemini represents the twin brothers Castor and Pollux of Greek myth, inseparable heroes whom Zeus placed together in the sky. Its brightest star, Pollux, is an orange giant only 34 light-years away that hosts a confirmed exoplanet, while Castor is actually a remarkable system of six stars bound together."},
        hans:{"dates":"5月21日 – 6月21日","brightest":"北河三","desc":"双子座代表希腊神话中的孪生兄弟卡斯托耳与波吕丢刻斯，宙斯将这对形影不离的英雄一同升上夜空。最亮星北河三是一颗距离地球约34光年的橙色巨星，拥有一颗已确认的系外行星；而北河二实际上是由六颗恒星组成的罕见聚星系统。"},
        hant:{"dates":"5月21日 – 6月21日","brightest":"北河三","desc":"雙子座代表希臘神話中的孿生兄弟卡斯托耳與波呂丟刻斯，宙斯將這對形影不離的英雄一同升上夜空。最亮星北河三是一顆距離地球約34光年的橙色巨星，擁有一顆已確認的系外行星；而北河二實際上是由六顆恆星組成的罕見聚星系統。"} } },
    { key:"cancer", symbol:"♋",
      t:{"en":"Cancer","hans":"巨蟹座","hant":"巨蟹座"},
      stars:[[8.28,9.19,3.52],[8.74,18.15,3.94],[8.72,21.47,4.66],[8.97,11.86,4.25],[8.78,28.76,4.02]],
      starNames:["Tarf","Asellus Australis","Asellus Borealis","Acubens","Iota Cnc"],
      lines:[[4,2],[2,1],[1,3],[1,0]],
      info:{
        en:{"dates":"Jun 21 – Jul 22","brightest":"Tarf (β Cancri)","desc":"In Greek myth, Cancer is the crab sent by Hera to hinder Heracles during his battle with the Hydra; crushed underfoot, it was honored with a place among the stars. Though its stars are faint, the constellation contains the famous Beehive Cluster (M44, Praesepe), a naked-eye swarm of hundreds of stars lying between the two \"donkey\" stars, Asellus Borealis and Asellus Australis."},
        hans:{"dates":"6月21日 – 7月22日","brightest":"柳宿增十（Tarf）","desc":"在希腊神话中，巨蟹是天后赫拉派去妨碍赫拉克勒斯斩杀九头蛇许德拉的螃蟹，被英雄踩碎后获赫拉升上天空，化为星座。巨蟹座的恒星虽然黯淡，却拥有著名的鬼星团（蜂巢星团，M44），它位于“南北二驴”鬼宿三与鬼宿四之间，晴夜肉眼即可望见。"},
        hant:{"dates":"6月21日 – 7月22日","brightest":"柳宿增十（Tarf）","desc":"希臘神話中，巨蟹是天后赫拉派去妨礙海克力士斬殺九頭蛇的螃蟹，遭英雄踩碎後被赫拉升上天空，化作星座。巨蟹座的恆星雖然黯淡，卻擁有著名的鬼宿星團（蜂巢星團，M44），位於「南北二驢」鬼宿三與鬼宿四之間，晴朗夜晚肉眼即可見。"} } },
    { key:"leo", symbol:"♌",
      t:{"en":"Leo","hans":"狮子座","hant":"獅子座"},
      stars:[[10.139,11.97,1.36],[11.818,14.57,2.14],[10.333,19.84,2.01],[11.235,20.52,2.56],[11.237,15.43,3.34],[10.278,23.42,3.43],[9.764,23.77,2.98],[9.879,26.01,3.88],[10.122,16.76,3.49]],
      starNames:["Regulus","Denebola","Algieba","Zosma","Chertan","Adhafera","Ras Elased Australis","Rasalas","Eta Leonis"],
      lines:[[0,8],[8,2],[2,5],[5,7],[7,6],[2,3],[3,1],[1,4],[4,3],[4,0]],
      info:{
        en:{"dates":"Jul 23 – Aug 22","brightest":"Regulus","desc":"Leo depicts the Nemean Lion, the invulnerable beast Heracles strangled as the first of his twelve labors. Its brightest star, Regulus — \"the little king\" — sits almost exactly on the ecliptic and is regularly occulted by the Moon. The famous Sickle asterism, a backwards question mark of six stars, traces the lion's head and mane."},
        hans:{"dates":"7月23日 – 8月22日","brightest":"轩辕十四","desc":"狮子座代表希腊神话中的涅墨亚猛狮，赫拉克勒斯在十二项功绩的第一项中将其扼杀。其最亮星轩辕十四（Regulus）意为\"小王\"，几乎正好位于黄道上，因此常被月球掩食。由六颗星组成的\"镰刀\"星群形似反写的问号，勾勒出狮子的头部和鬃毛。"},
        hant:{"dates":"7月23日 – 8月22日","brightest":"軒轅十四","desc":"獅子座代表希臘神話中的涅墨亞巨獅，海克力斯在十二項偉業的第一項中將牠扼殺。其最亮星軒轅十四（Regulus）意為「小王」，幾乎恰好位於黃道上，因此經常被月球掩蔽。由六顆星組成的「鐮刀」星群形似反寫的問號，描繪出獅子的頭部與鬃毛。"} } },
    { key:"virgo", symbol:"♍",
      t:{"en":"Virgo","hans":"室女座","hant":"室女座"},
      stars:[[13.42,-11.16,0.98],[11.84,1.76,3.61],[12.69,-1.45,2.74],[12.93,3.4,3.38],[13.04,10.96,2.83],[13.58,-0.6,3.37],[12.33,-0.67,3.89],[13.17,-5.54,4.38],[14.27,-6,4.08],[14.72,-5.66,3.88]],
      starNames:["Spica","Zavijava","Porrima","Auva","Vindemiatrix","Heze","Zaniah","Theta Virginis","Syrma","Rijl al Awwa"],
      lines:[[1,6],[6,2],[2,3],[3,4],[2,7],[7,0],[3,5],[0,5],[5,8],[8,9]],
      info:{
        en:{"dates":"Aug 23 – Sep 22","brightest":"Spica","desc":"Virgo depicts a maiden holding an ear of wheat, identified in Greek myth with the harvest goddess Demeter or with Astraea, goddess of justice. Its brightest star Spica is a hot blue-white binary about 250 light-years away, and the constellation also hosts the Virgo Cluster, a swarm of some 2,000 galaxies at the heart of our local supercluster."},
        hans:{"dates":"8月23日 – 9月22日","brightest":"角宿一","desc":"室女座常被描绘为手持麦穗的少女，在希腊神话中与丰收女神得墨忒耳或正义女神阿斯特赖亚相联系。其最亮星角宿一是一对距离约250光年的蓝白色双星；座内还坐落着拥有约两千个成员星系的室女座星系团，是本超星系团的中心所在。"},
        hant:{"dates":"8月23日 – 9月22日","brightest":"角宿一","desc":"室女座常被描繪為手持麥穗的少女，在希臘神話中與豐收女神狄蜜特或正義女神阿斯特莉亞相聯繫。其最亮星角宿一是一對距離約250光年的藍白色雙星；座內還坐落著擁有約兩千個成員星系的室女座星系團，是本超星系團的中心所在。"} } },
    { key:"libra", symbol:"♎",
      t:{"en":"Libra","hans":"天秤座","hant":"天秤座"},
      stars:[[15.283,-9.38,2.61],[14.848,-16.04,2.75],[15.592,-14.79,3.91],[15.068,-25.28,3.29],[15.617,-28.13,3.58],[15.644,-29.78,3.66]],
      starNames:["Zubeneschamali","Zubenelgenubi","Zubenelhakrabi","Brachium","Upsilon Librae","Tau Librae"],
      lines:[[0,1],[0,2],[1,2],[1,3],[2,4],[4,5]],
      info:{
        en:{"dates":"Sep 23 – Oct 22","brightest":"Zubeneschamali","desc":"Libra depicts the scales of justice held by the goddess Astraea, making it the only zodiac constellation representing an inanimate object. Its two brightest stars, Zubenelgenubi and Zubeneschamali, bear Arabic names meaning the southern and northern claws, recalling an era when they marked the claws of neighboring Scorpius. Zubeneschamali is famously reported by some observers to glint faintly green, a rarity among naked-eye stars."},
        hans:{"dates":"9月23日 – 10月22日","brightest":"氐宿四","desc":"天秤座象征正义女神阿斯特赖亚手中衡量善恶的天平，是黄道十二星座中唯一以非生命物体为形象的星座。座内两颗主星氐宿一与氐宿四的阿拉伯名分别意为“南爪”和“北爪”，源于古代它们曾被视为天蝎座的巨螯。最亮星氐宿四常被观测者形容为带有罕见的淡绿色光芒。"},
        hant:{"dates":"9月23日 – 10月22日","brightest":"氐宿四","desc":"天秤座象徵正義女神阿斯特賴亞手中衡量善惡的天平，是黃道十二星座中唯一以無生命物體為形象的星座。座內兩顆主星氐宿一與氐宿四的阿拉伯名分別意為「南爪」和「北爪」，源自古代它們曾被視為天蠍座的巨螯。最亮星氐宿四常被觀測者形容為帶有罕見的淡綠色光芒。"} } },
    { key:"scorpius", symbol:"♏",
      t:{"en":"Scorpius","hans":"天蝎座","hant":"天蠍座"},
      stars:[[16.09,-19.8,2.62],[16.01,-22.6,2.29],[15.98,-26.1,2.89],[16.35,-25.6,2.88],[16.49,-26.4,0.96],[16.6,-28.2,2.82],[16.84,-34.3,2.29],[16.91,-42.4,3.59],[17.2,-43.2,3.33],[17.62,-43,1.86],[17.71,-39,2.39],[17.56,-37.1,1.62]],
      starNames:["Acrab","Dschubba","Fang","Alniyat","Antares","Paikauhale","Larawag","ζ Sco","η Sco","Sargas","κ Sco","Shaula"],
      lines:[[0,1],[2,1],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]],
      info:{
        en:{"dates":"Oct 23 – Nov 21","brightest":"Antares","desc":"In Greek myth, Scorpius is the scorpion sent by Gaia to slay the boastful hunter Orion; the gods placed the two on opposite sides of the sky so they are never seen together. Its heart is marked by Antares, a red supergiant roughly 700 times the Sun's diameter, whose ruddy glow earned it the name 'rival of Mars.' The long curved tail, tipped by the bright sting star Shaula, makes it one of the most recognizable figures of the summer sky."},
        hans:{"dates":"10月23日 – 11月21日","brightest":"心宿二","desc":"天蝎座源自希腊神话:大地女神盖亚派出毒蝎蜇死了狂妄的猎人俄里翁,众神将两者置于天空两端,使它们永不相见。其最亮星心宿二是一颗红超巨星,直径约为太阳的700倍,火红的色泽令古人称它为“火星的对手”。蝎尾末端的亮星尾宿八勾勒出经典的蝎钩,是夏夜星空中最易辨认的形象之一。"},
        hant:{"dates":"10月23日 – 11月21日","brightest":"心宿二","desc":"天蠍座源自希臘神話:大地女神蓋亞派出毒蠍螫死了狂妄的獵人俄里翁,眾神將兩者置於天空兩端,使它們永不相見。其最亮星心宿二是一顆紅超巨星,直徑約為太陽的700倍,火紅的色澤令古人稱它為「火星的對手」。蠍尾末端的亮星尾宿八勾勒出經典的蠍鉤,是夏夜星空中最易辨認的形象之一。"} } },
    { key:"sagittarius", symbol:"♐",
      t:{"en":"Sagittarius","hans":"人马座","hant":"人馬座"},
      stars:[[18.4,-34.38,1.85],[18.35,-29.83,2.7],[18.1,-30.42,2.98],[18.47,-25.42,2.81],[18.76,-27,3.17],[18.92,-26.3,2.05],[19.12,-27.67,3.32],[19.04,-29.88,2.6]],
      starNames:["Kaus Australis","Kaus Media","Alnasl","Kaus Borealis","Phi Sgr","Nunki","Tau Sgr","Ascella"],
      lines:[[2,1],[2,0],[1,0],[1,3],[3,4],[1,4],[4,7],[0,7],[7,6],[6,5],[5,4]],
      info:{
        en:{"dates":"Nov 22 – Dec 21","brightest":"Kaus Australis","desc":"Sagittarius is the Archer, a centaur drawing his bow toward the heart of neighboring Scorpius, often identified with Crotus or the wise Chiron. The constellation lies toward the center of the Milky Way, home of the supermassive black hole Sagittarius A*, and eight of its bright stars form the famous Teapot asterism."},
        hans:{"dates":"11月22日 – 12月21日","brightest":"箕宿三","desc":"人马座是希腊神话中弯弓搭箭的半人马射手,常被认为是克罗托斯或智者喀戎,箭尖直指邻近天蝎座的心脏。银河系中心的超大质量黑洞人马座A*就位于这一方向,其中八颗亮星组成著名的\"茶壶\"星群,是夏季南天最易辨认的标志之一。"},
        hant:{"dates":"11月22日 – 12月21日","brightest":"箕宿三","desc":"人馬座是希臘神話中彎弓搭箭的半人馬射手,常被認為是克羅托斯或智者凱隆,箭尖直指鄰近天蠍座的心臟。銀河系中心的超大質量黑洞人馬座A*就位於這一方向,其中八顆亮星組成著名的「茶壺」星群,是夏季南天最易辨認的標誌之一。"} } },
    { key:"capricornus", symbol:"♑",
      t:{"en":"Capricornus","hans":"摩羯座","hant":"摩羯座"},
      stars:[[20.3,-12.54,3.57],[20.35,-14.78,3.08],[20.77,-25.27,4.14],[20.86,-26.92,4.11],[21.44,-22.41,3.74],[21.62,-19.47,4.51],[21.78,-16.13,2.85],[21.67,-16.66,3.67],[21.37,-16.83,4.28],[21.1,-17.23,4.07]],
      starNames:["Algedi (α²)","Dabih (β)","Psi Cap (ψ)","Omega Cap (ω)","Zeta Cap (ζ)","Castra (ε)","Deneb Algedi (δ)","Nashira (γ)","Iota Cap (ι)","Dorsum (θ)"],
      lines:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0]],
      info:{
        en:{"dates":"Dec 22 – Jan 19","brightest":"Deneb Algedi","desc":"Capricornus, the Sea Goat, depicts the god Pan, who grew a fish's tail to escape the monster Typhon by diving into the Nile. Its brightest star, Deneb Algedi, marks the goat's tail, and the constellation's arrowhead outline is drawn from two horn stars, Algedi and Dabih, down to the tail. Neptune was discovered within Capricornus in 1846."},
        hans:{"dates":"12月22日 – 1月19日","brightest":"垒壁阵四","desc":"摩羯座又称海山羊，源自希腊神话：牧神潘为躲避怪物提丰跃入尼罗河，下半身化作鱼尾。其最亮星垒壁阵四位于羊尾处，整个星座呈倒三角形，从羊角的牛宿二（Algedi）与牛宿一（Dabih）延伸至鱼尾。1846年，海王星正是在摩羯座天区被发现的。"},
        hant:{"dates":"12月22日 – 1月19日","brightest":"壘壁陣四","desc":"摩羯座又稱海山羊，源自希臘神話：牧神潘為躲避怪物提豐躍入尼羅河，下半身化作魚尾。其最亮星壘壁陣四位於羊尾處，整個星座呈倒三角形，從羊角的牛宿二（Algedi）與牛宿一（Dabih）延伸至魚尾。1846年，海王星正是在摩羯座天區被發現的。"} } },
    { key:"aquarius", symbol:"♒",
      t:{"en":"Aquarius","hans":"宝瓶座","hant":"寶瓶座"},
      stars:[[21.526,-5.57,2.87],[22.096,-0.32,2.94],[22.911,-15.82,3.27],[20.795,-9.5,3.77],[22.361,-1.39,3.85],[22.481,-0.02,3.65],[22.589,-0.12,4.04],[22.421,1.38,4.66],[22.281,-7.78,4.16],[22.877,-7.58,3.73]],
      starNames:["Sadalsuud","Sadalmelik","Skat","Albali","Sadachbia","Zeta Aquarii","Eta Aquarii","Pi Aquarii","Ancha","Hydor"],
      lines:[[3,0],[0,1],[1,4],[4,5],[5,6],[5,7],[1,8],[8,9],[9,2]],
      info:{
        en:{"dates":"Jan 20 – Feb 18","brightest":"Sadalsuud","desc":"Aquarius, the Water Bearer, represents Ganymede, the beautiful youth whom Zeus carried to Olympus to serve as cupbearer to the gods, forever pouring water from his jar. Its brightest star, Sadalsuud, is a rare yellow supergiant, and the constellation also hosts the Helix Nebula, one of the closest planetary nebulae to Earth."},
        hans:{"dates":"1月20日 – 2月18日","brightest":"虚宿一","desc":"宝瓶座又称水瓶座，象征希腊神话中被宙斯带上奥林匹斯山、为众神斟酒的美少年伽倪墨得斯，他手中的水瓶不断倾泻清泉。座内最亮星虚宿一是一颗罕见的黄超巨星；著名的螺旋星云也位于此，是距离地球最近的行星状星云之一。"},
        hant:{"dates":"1月20日 – 2月18日","brightest":"虛宿一","desc":"寶瓶座又稱水瓶座，象徵希臘神話中被宙斯帶上奧林帕斯山、為眾神斟酒的美少年伽倪墨得斯，他手中的水瓶不斷傾瀉清泉。座內最亮星虛宿一是一顆罕見的黃超巨星；著名的螺旋星雲也位於此，是距離地球最近的行星狀星雲之一。"} } },
    { key:"pisces", symbol:"♓",
      t:{"en":"Pisces","hans":"双鱼座","hant":"雙魚座"},
      stars:[[23.286,3.28,3.7],[23.466,6.38,4.28],[23.666,5.63,4.13],[23.701,1.78,4.5],[23.449,1.26,4.94],[23.989,6.86,4.01],[0.811,7.59,4.43],[1.049,7.89,4.27],[1.69,5.49,4.44],[2.034,2.76,3.82],[1.757,9.16,4.26],[1.525,15.35,3.62]],
      starNames:["Gamma Psc","Theta Psc","Iota Psc","Lambda Psc","Kappa Psc","Omega Psc","Delta Psc","Epsilon Psc","Nu Psc","Alrescha","Omicron Psc","Alpherg"],
      lines:[[0,1],[1,2],[2,3],[3,4],[4,0],[2,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]],
      info:{
        en:{"dates":"Feb 19 – Mar 20","brightest":"Alpherg (Eta Piscium)","desc":"In Greek myth, Pisces depicts Aphrodite and her son Eros, who turned into two fish tied together by a cord to escape the monster Typhon. The western fish is marked by the Circlet asterism, and the cords meet at the star Alrescha, \"the knot\". The constellation also contains the vernal equinox point, where the Sun crosses the celestial equator each March."},
        hans:{"dates":"2月19日 – 3月20日","brightest":"右更二（双鱼座η）","desc":"双鱼座源自希腊神话：爱与美之神阿佛洛狄忒与其子厄洛斯为躲避怪物提丰而化身为鱼，并用丝带系住彼此的尾巴。两条丝带在“天绳之结”外屏七（Alrescha）处相连。如今的春分点正位于双鱼座内，是太阳每年三月穿越天赤道的地方。"},
        hant:{"dates":"2月19日 – 3月20日","brightest":"右更二（雙魚座η）","desc":"雙魚座源自希臘神話：愛與美之神阿芙蘿黛蒂與其子厄洛斯為躲避怪物提豐而化身為魚，並以絲帶繫住彼此的尾巴。兩條絲帶在「天繩之結」外屏七（Alrescha）處相連。如今的春分點正位於雙魚座內，是太陽每年三月穿越天赤道之處。"} } }
  ];
```

*(Dataset above was authored per-constellation and adversarially verified by a
24-agent workflow during planning: star identities, J2000 positions, magnitudes,
figures, dates, and all three languages cross-checked.)*

- [ ] **Step 2: Add the self-check after the array.**

```js
  function assertZodiacData() {
    if (ZODIAC.length !== 12) throw new Error('need 12 zodiac entries, got ' + ZODIAC.length);
    var langs = ['en', 'hans', 'hant'];
    ZODIAC.forEach(function (z, zi) {
      if (!z.key || !z.symbol) throw new Error('zodiac ' + zi + ' missing key/symbol');
      langs.forEach(function (L) {
        if (!z.t[L]) throw new Error(z.key + ' missing name ' + L);
        var o = z.info[L];
        if (!o || !o.dates || !o.brightest || !o.desc) throw new Error(z.key + ' missing info.' + L);
      });
      if (z.stars.length < 4) throw new Error(z.key + ' needs >=4 stars');
      if (z.starNames.length !== z.stars.length) throw new Error(z.key + ' starNames length mismatch');
      z.stars.forEach(function (s, si) {
        if (s[0] < 0 || s[0] >= 24) throw new Error(z.key + ' star ' + si + ' RA out of range');
        if (s[1] < -90 || s[1] > 90) throw new Error(z.key + ' star ' + si + ' Dec out of range');
      });
      z.lines.forEach(function (l) {
        if (l[0] >= z.stars.length || l[1] >= z.stars.length || l[0] < 0 || l[1] < 0) throw new Error(z.key + ' line index out of range');
      });
    });
    return true;
  }
```

- [ ] **Step 3: Verify.** Reload; console `assertZodiacData()` → `true`, no errors.

- [ ] **Step 4: Commit.**

```bash
git add index.html
git commit -m "Add verified zodiac constellation dataset with self-check"
```

---

### Task 3: Zodiac layer — stars, figures, labels

**Files:**
- Modify: `index.html` — CSS (sky label styles), JS (per-constellation objects + label projection) after `assertZodiacData`.

**Interfaces:**
- Consumes: `ZODIAC`, `raDecDir`, `SKY_R`, `skyScene`, `skyCamera`, `beaconLang`, `viewMode`.
- Produces: `SKY_CONS` array (`{lineMat, starMat, el, dir}` per constellation), `updateSkyLabels()` (global on `window`), label container `#skylabels`.

- [ ] **Step 1: Label CSS.** After the `#skyback:hover` rule add:

```css
  #skylabels { position: fixed; inset: 0; z-index: 4; pointer-events: none; }
  .skylabel { position: absolute; transform: translate(-50%, -50%); pointer-events: auto; cursor: pointer;
    font-size: 13px; letter-spacing: .08em; color: #cfe0ff; white-space: nowrap; text-align: center;
    text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 10px rgba(120,170,255,.45); transition: opacity .2s ease; }
  .skylabel small { display: block; font-size: 10px; color: #8fa3c8; letter-spacing: .12em; }
  .skylabel.dim { opacity: .35; }
  .skylabel.sel { color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.9), 0 0 14px rgba(150,190,255,.9); }
```

- [ ] **Step 2: Build the layer.** Insert after `assertZodiacData()`:

```js
  var SKY_CONS = [];
  (function buildZodiac() {
    var host = document.createElement('div'); host.id = 'skylabels'; document.body.appendChild(host);
    var starVert = 'uniform float uSize; uniform float uMul; attribute float aScale; varying float vA;' +
      'void main(){ vec4 vp = viewMatrix * modelMatrix * vec4(position,1.0); gl_Position = projectionMatrix * vp;' +
      ' gl_PointSize = uSize * aScale * uMul; vA = uMul; }';
    var starFrag = 'varying float vA; void main(){ float d = distance(gl_PointCoord, vec2(0.5)); if (d > 0.5) discard;' +
      ' float s = pow(max(0.0, 1.0 - d * 2.0), 1.6); gl_FragColor = vec4(vec3(0.86, 0.92, 1.0) * vA, s); }';
    ZODIAC.forEach(function (z, zi) {
      var n = z.stars.length, pos = new Float32Array(n * 3), scl = new Float32Array(n), centroid = new THREE.Vector3();
      var dirs = z.stars.map(function (s) { return raDecDir(s[0], s[1]); });
      dirs.forEach(function (d, i) {
        pos[i * 3] = d.x * SKY_R; pos[i * 3 + 1] = d.y * SKY_R; pos[i * 3 + 2] = d.z * SKY_R;
        scl[i] = Math.max(0.55, Math.pow(1.45, 2.0 - z.stars[i][2])); // brighter (lower mag) → bigger
        centroid.add(d);
      });
      centroid.normalize();
      var sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      sg.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));
      var sm = new THREE.ShaderMaterial({ uniforms: { uSize: { value: 5.5 * renderer.getPixelRatio() }, uMul: { value: 1 } },
        vertexShader: starVert, fragmentShader: starFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      skyScene.add(new THREE.Points(sg, sm));
      var lp = new Float32Array(z.lines.length * 6);
      z.lines.forEach(function (l, li) {
        var a = dirs[l[0]], b = dirs[l[1]];
        lp[li * 6] = a.x * SKY_R; lp[li * 6 + 1] = a.y * SKY_R; lp[li * 6 + 2] = a.z * SKY_R;
        lp[li * 6 + 3] = b.x * SKY_R; lp[li * 6 + 4] = b.y * SKY_R; lp[li * 6 + 5] = b.z * SKY_R;
      });
      var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
      var lm = new THREE.LineBasicMaterial({ color: 0x6f9fe8, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending });
      skyScene.add(new THREE.LineSegments(lg, lm));
      var el = document.createElement('div'); el.className = 'skylabel';
      host.appendChild(el);
      SKY_CONS.push({ z: z, el: el, dir: centroid, lineMat: lm, starMat: sm, shown: true });
    });
    paintSkyLabels(beaconLang);
  })();
  function paintSkyLabels(lang) {
    SKY_CONS.forEach(function (c) {
      c.el.innerHTML = (c.z.t[lang] || c.z.t.en) + '<small>' + c.z.symbol + '</small>';
    });
  }
  var skyTmp = new THREE.Vector3();
  window.updateSkyLabels = function () {
    for (var i = 0; i < SKY_CONS.length; i++) {
      var c = SKY_CONS[i];
      skyTmp.copy(c.dir).multiplyScalar(SKY_R).project(skyCamera);
      var vis = viewMode === 'sky' && skyTmp.z < 1 && skyTmp.x > -1.05 && skyTmp.x < 1.05 && skyTmp.y > -1.05 && skyTmp.y < 1.05;
      if (vis !== c.shown) { c.el.style.display = vis ? '' : 'none'; c.shown = vis; }
      if (vis) {
        c.el.style.left = ((skyTmp.x * 0.5 + 0.5) * window.innerWidth) + 'px';
        c.el.style.top = ((-skyTmp.y * 0.5 + 0.5) * window.innerHeight) + 'px';
      }
    }
  };
```

- [ ] **Step 3: Hide labels outside sky view.** In `enterSky()` add `document.getElementById('skylabels').style.display = '';` and in `exitSky()` add `document.getElementById('skylabels').style.display = 'none';` — and set the container hidden initially by adding `document.getElementById('skylabels').style.display = 'none';` right after `buildZodiac` runs (one line after the IIFE call).

- [ ] **Step 4: Verify.** Serve + reload → `enterSky()`: 12 stick-figure constellations along the gold ecliptic circle, star sizes varying with brightness, each labelled with a localized name + symbol; labels track while dragging and hide behind the camera; figures land ON the ecliptic (sanity: the circle threads through all 12). Switch language in galaxy view, re-enter sky → labels localized. No console errors.

- [ ] **Step 5: Commit.**

```bash
git add index.html
git commit -m "Draw the 12 zodiac constellations with labels on the sky dome"
```

---

### Task 4: Entry link in the Solar System card

**Files:**
- Modify: `index.html` — CSS (link style), `renderPanel` (append link when Solar System), delegated click.

**Interfaces:**
- Consumes: `renderPanel(i, lang)`, `bpBody`, `enterSky`.
- Produces: `#bp-zodiac-link` element inside the Solar System card.

- [ ] **Step 1: CSS.** After the `#bp-cat` rule add:

```css
  #bp-zodiac-link { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.07);
    color: #9cc0ff; cursor: pointer; font-size: 13px; }
  #bp-zodiac-link:hover { color: #cfe2ff; }
```

- [ ] **Step 2: Append the link in `renderPanel`.** At the end of `renderPanel`, after the `bpBody.innerHTML = …;` statement, add:

```js
    if (i === 0) { // Solar System card → doorway to the Earth-sky view
      var zl = { en: '♈ Zodiac Constellations · view the sky →', hans: '♈ 十二星座 · 查看星空 →', hant: '♈ 十二星座 · 查看星空 →' };
      bpBody.innerHTML += '<div id="bp-zodiac-link">' + (zl[lang] || zl.en) + '</div>';
    }
```

- [ ] **Step 3: Delegated click.** Next to the existing `bpEl.addEventListener('click', …)` line add:

```js
  bpBody.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'bp-zodiac-link') enterSky();
  });
```

- [ ] **Step 4: Verify.** Click the Solar System beacon → card shows the zodiac link in the current language; clicking it enters the sky view (panel closes, beacons hide). Other beacons' cards have no link. Back/Esc returns.

- [ ] **Step 5: Commit.**

```bash
git add index.html
git commit -m "Add zodiac sky-view entry link to the Solar System card"
```

---

### Task 5: Constellation selection, info card, language link, regression

**Files:**
- Modify: `index.html` — JS: `skySelected`, `selectSky`/`clearSkySelection`, `renderConstellationPanel`, label clicks, Esc two-stage, outside-click, `setBeaconLang` hook.

**Interfaces:**
- Consumes: `SKY_CONS`, `bpEl`/`bpBody`, `esc()` helper, `beaconLang`, `enterSky`/`exitSky`, `viewMode`.
- Produces: `window.skySelected` (number|null), `selectSky(i)`, `window.clearSkySelection()`, `renderConstellationPanel(i, lang)`.

- [ ] **Step 1: Selection + panel fill.** Insert after `window.updateSkyLabels`:

```js
  window.skySelected = null;
  function renderConstellationPanel(i, lang) {
    var z = SKY_CONS[i].z, o = z.info[lang] || z.info.en, name = z.t[lang] || z.t.en;
    var K = { en: ['Zodiac constellation', 'Dates', 'Brightest star', 'Main stars'], hans: ['黄道星座', '日期', '最亮星', '主要亮星'], hant: ['黃道星座', '日期', '最亮星', '主要亮星'] };
    var k = K[lang] || K.en;
    bpBody.innerHTML =
      '<div id="bp-name" style="color:#9cc0ff">' + esc(name) + ' ' + z.symbol + '</div>' +
      '<span id="bp-type">' + esc(k[0]) + '</span>' +
      '<div class="bp-row"><span class="k">' + esc(k[1]) + '</span><span class="v">' + esc(o.dates) + '</span></div>' +
      '<div class="bp-row"><span class="k">' + esc(k[2]) + '</span><span class="v">' + esc(o.brightest) + '</span></div>' +
      '<div class="bp-row"><span class="k">' + esc(k[3]) + '</span><span class="v">' + z.stars.length + '</span></div>' +
      '<div id="bp-desc">' + esc(o.desc) + '</div>' +
      '<div id="bp-cat">' + z.symbol + ' · ' + esc(z.t.en) + '</div>';
  }
  function selectSky(i) {
    if (i === skySelected) { clearSkySelection(); return; }
    window.skySelected = i;
    SKY_CONS.forEach(function (c, ci) {
      c.el.classList.toggle('sel', ci === i);
      c.el.classList.toggle('dim', ci !== i);
      c.lineMat.opacity = ci === i ? 0.9 : 0.12;
      c.starMat.uniforms.uMul.value = ci === i ? 1.5 : 0.4;
    });
    renderConstellationPanel(i, beaconLang);
    bpEl.classList.add('open');
  }
  window.clearSkySelection = function () {
    window.skySelected = null;
    SKY_CONS.forEach(function (c) {
      c.el.classList.remove('sel', 'dim');
      c.lineMat.opacity = 0.45;
      c.starMat.uniforms.uMul.value = 1;
    });
    bpEl.classList.remove('open');
  };
```

- [ ] **Step 2: Label clicks.** Inside `buildZodiac`'s `ZODIAC.forEach`, right after `host.appendChild(el);` add:

```js
      (function (idx) { el.addEventListener('click', function (e) { e.stopPropagation(); selectSky(idx); }); })(zi);
```

- [ ] **Step 3: Esc + outside click.** The Task 1 Esc handler already defers while `skySelected != null`. Add the card-closing Esc + outside click (place next to the beacon panel's listeners):

```js
  window.addEventListener('keydown', function (e) {
    if ((e.key || '').toLowerCase() === 'escape' && viewMode === 'sky' && skySelected != null) clearSkySelection();
  });
  window.addEventListener('click', function () { if (viewMode === 'sky' && skySelected != null) clearSkySelection(); });
```

(The panel's own click handler already `stopPropagation()`s, so clicks inside the card don't close it; the `#bp-close` × button calls `clearSelection()` which is galaxy-side — extend it: in the `bp-close` listener replace `clearSelection()` with `viewMode === 'sky' ? clearSkySelection() : clearSelection()`.)

- [ ] **Step 4: Language hook.** At the end of `setBeaconLang`, after the beacon-panel re-render line, add:

```js
    if (typeof paintSkyLabels === 'function') paintSkyLabels(lang);
    if (typeof skySelected !== 'undefined' && skySelected !== null && typeof renderConstellationPanel === 'function') renderConstellationPanel(skySelected, lang);
```

- [ ] **Step 5: Full regression.** Desktop: enter via Solar System card link; click each of the 12 labels → correct card (spot-check Scorpius: Antares; Taurus: Aldebaran), selected figure brightens & others fade; swap without closing; close via × / outside / Esc; second Esc exits to galaxy; galaxy state intact (camera, beacons, selection cleared). Language switch re-renders labels + open card in all 3 languages. Mobile (375px): card is a bottom drawer; rotation by touch-drag works. Cinema `F` hides labels/back/panel. `assertZodiacData()` true; no console errors.

- [ ] **Step 6: Commit.**

```bash
git add index.html
git commit -m "Add constellation selection, info cards, and language link to sky view"
```

---

## Self-Review

**Spec coverage:** entry link (Task 4) ✓ · separate scene + shared renderer + viewMode (Task 1) ✓ · rotate-only controls + idle drift (Task 1) ✓ · backdrop stars + Milky-Way band + ecliptic (Task 1) ✓ · real-star figures + labels (Tasks 2–3) ✓ · info cards, select brighten/dim, same panel DOM (Task 5) ✓ · Esc two-stage + cinema + mobile (Tasks 1, 5) ✓ · language everywhere (Tasks 3–5) ✓ · self-check (Task 2) ✓ · non-goals untouched ✓

**Placeholder scan:** one deliberate insertion marker — `/* ZODIAC_DATA_INSERT */` in Task 2 — replaced by the verified dataset before this plan is finalized (workflow output). No other TBDs.

**Type consistency:** `raDecDir(raHours, decDeg)`, `SKY_R`, `SKY_CONS[{z,el,dir,lineMat,starMat,shown}]`, `enterSky`/`exitSky`, `selectSky`/`clearSkySelection`, `renderConstellationPanel(i,lang)`, `paintSkyLabels(lang)`, `updateSkyLabels()` used consistently across tasks; `esc()` and `bpEl`/`bpBody` reused from the existing beacon code. ✓
