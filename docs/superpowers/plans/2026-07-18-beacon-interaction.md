# Beacon Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the galaxy's location beacons interactive — click/tap a beacon to open a detailed, language-aware info card in a fixed side panel, with a CSS + 3D-ring highlight; grow the set from 7 to 11 beacons.

**Architecture:** Reuse the existing HTML-overlay beacons (no three.js raycasting). Each beacon gains an `info` data block (3 languages). A `selectedBeacon` state drives a side panel (`renderPanel`), CSS highlight classes, and one reusable 3D ring sprite under `galaxyRoot`. Camera never moves.

**Tech Stack:** Vanilla JS + three.js r128 (vendored), single-file `index.html`, no build, no new dependencies.

## Global Constraints

- Single file: all changes in `index.html`. No new files, no new dependencies, no build step.
- Beacons stay **borderless** (dots/rings/labels unchanged in that respect).
- Languages: `en` / `hans` (简体) / `hant` (繁體); language persists via `localStorage['gx-lang']`; default `en`.
- Camera does **not** move on interaction. No raycasting. Panel open/selected state is **not** persisted.
- Mobile breakpoint: `≤640px` (matches the existing beacon media query).
- Reuse existing palette (`rgba(10,14,24,…)`, text `#e5e7eb`/`#cbd5e1`) and each beacon's `--bc` accent color.
- No automated test framework exists; verification = serve over HTTP + drive the browser + a runnable `assertBeaconInfo()` self-check.

**Verification setup (used by every task):** serve the folder and open it, e.g.
`python3 -m http.server 8123` then load `http://localhost:8123/index.html`.
`file://` is unreliable for `localStorage`; always verify over HTTP.

---

### Task 1: Beacon data — 4 new beacons + `info` for all 11 + self-check

**Files:**
- Modify: `index.html` — the `buildBeacons` IIFE's `DEFS` array (search for `var DEFS = [`).
- Modify: `index.html` — add `assertBeaconInfo()` near the beacon code.

**Interfaces:**
- Consumes: existing `armXZ(rf, idx)`, `near(dIn, dAlong)`, `sun`, `BEACONS`, `DEFS` shape `{ p, cls?, t:{en,hans,hant:[name,sub?]} }`.
- Produces: each `DEFS` entry additionally has `info:{en,hans,hant:{type,distance,constellation,facts:[[k,v]…],desc,catalog}}`; 4 new entries (Pleiades, Omega Centauri, Betelgeuse, Veil Nebula); global `assertBeaconInfo()` returning `true` or throwing.

- [ ] **Step 1: Replace the `DEFS` array with the 11-entry version (labels + info).**

Find the existing block (starts `var DEFS = [` and ends `];`) and replace the whole array with:

```js
    // t: label [name, optional subtitle]. info: detailed card per language.
    var DEFS = [
      { p: sun, cls: 'sun',
        t: { en: ['Solar System', 'you are here'], hans: ['太阳系', '你在这里'], hant: ['太陽系', '你在這裡'] },
        info: {
          en:   { type:'Star system', distance:'You are here', constellation:'—', facts:[['Star','1 (the Sun)'],['Planets','8']], desc:'Our home system, circling the galactic centre once every ~230 million years.', catalog:'' },
          hans: { type:'恒星系统', distance:'你在这里', constellation:'—', facts:[['恒星','1 颗(太阳)'],['行星','8 颗']], desc:'我们的家园,绕银河系中心公转一圈约需 2.3 亿年。', catalog:'' },
          hant: { type:'恆星系統', distance:'你在這裡', constellation:'—', facts:[['恆星','1 顆(太陽)'],['行星','8 顆']], desc:'我們的家園,繞銀河系中心公轉一圈約需 2.3 億年。', catalog:'' } } },
      { p: new THREE.Vector3(0, 4, 0),
        t: { en: ['Sagittarius A∗', 'galactic centre'], hans: ['人马座 A*', '银河系中心'], hant: ['人馬座 A*', '銀河系中心'] },
        info: {
          en:   { type:'Supermassive black hole', distance:'~26,000 light-years', constellation:'Sagittarius', facts:[['Mass','~4.3 million M☉']], desc:'The supermassive black hole anchoring the centre of the Milky Way.', catalog:'Sgr A*' },
          hans: { type:'超大质量黑洞', distance:'约 26,000 光年', constellation:'人马座', facts:[['质量','约 430 万倍太阳质量']], desc:'坐镇银河系中心的超大质量黑洞。', catalog:'Sgr A*' },
          hant: { type:'超大質量黑洞', distance:'約 26,000 光年', constellation:'人馬座', facts:[['質量','約 430 萬倍太陽質量']], desc:'坐鎮銀河系中心的超大質量黑洞。', catalog:'Sgr A*' } } },
      { p: near(-40, 10), cls: 'up',
        t: { en: ['Orion Nebula'], hans: ['猎户座大星云'], hant: ['獵戶座大星雲'] },
        info: {
          en:   { type:'Emission nebula', distance:'~1,340 light-years', constellation:'Orion', facts:[['Diameter','~24 light-years'],['Apparent mag','4.0']], desc:'The nearest large stellar nursery, faintly visible to the naked eye below Orion’s Belt.', catalog:'M42' },
          hans: { type:'发射星云', distance:'约 1,340 光年', constellation:'猎户座', facts:[['直径','约 24 光年'],['视星等','4.0']], desc:'离我们最近的大型恒星摇篮,肉眼在猎户腰带下方隐约可见。', catalog:'M42' },
          hant: { type:'發射星雲', distance:'約 1,340 光年', constellation:'獵戶座', facts:[['直徑','約 24 光年'],['視星等','4.0']], desc:'離我們最近的大型恆星搖籃,肉眼在獵戶腰帶下方隱約可見。', catalog:'M42' } } },
      { p: near(-75, 55),
        t: { en: ['Crab Nebula'], hans: ['蟹状星云'], hant: ['蟹狀星雲'] },
        info: {
          en:   { type:'Supernova remnant', distance:'~6,500 light-years', constellation:'Taurus', facts:[['Supernova','1054 CE'],['Core','Crab Pulsar']], desc:'The expanding wreck of a star seen exploding in 1054 CE, with a spinning neutron star at its heart.', catalog:'M1' },
          hans: { type:'超新星遗迹', distance:'约 6,500 光年', constellation:'金牛座', facts:[['超新星','公元 1054 年'],['核心','蟹状星云脉冲星']], desc:'公元 1054 年被记录到爆发的恒星残骸,中心是一颗高速自转的中子星。', catalog:'M1' },
          hant: { type:'超新星遺跡', distance:'約 6,500 光年', constellation:'金牛座', facts:[['超新星','公元 1054 年'],['核心','蟹狀星雲脈衝星']], desc:'公元 1054 年被記錄到爆發的恆星殘骸,中心是一顆高速自轉的中子星。', catalog:'M1' } } },
      { p: near(70, 38), cls: 'up',
        t: { en: ['Eagle Nebula'], hans: ['鹰状星云'], hant: ['鷹狀星雲'] },
        info: {
          en:   { type:'Emission nebula', distance:'~7,000 light-years', constellation:'Serpens', facts:[['Famous for','Pillars of Creation']], desc:'A star-forming region whose towering gas columns became famous as Hubble’s “Pillars of Creation”.', catalog:'M16' },
          hans: { type:'发射星云', distance:'约 7,000 光年', constellation:'巨蛇座', facts:[['著名','创生之柱']], desc:'一处恒星形成区,高耸的气柱因哈勃的“创生之柱”影像而闻名。', catalog:'M16' },
          hant: { type:'發射星雲', distance:'約 7,000 光年', constellation:'巨蛇座', facts:[['著名','創生之柱']], desc:'一處恆星形成區,高聳的氣柱因哈勃的「創生之柱」影像而聞名。', catalog:'M16' } } },
      { p: near(95, -52),
        t: { en: ['Carina Nebula'], hans: ['船底座大星云'], hant: ['船底座大星雲'] },
        info: {
          en:   { type:'Emission nebula', distance:'~7,500 light-years', constellation:'Carina', facts:[['Hosts','Eta Carinae']], desc:'One of the largest nebulae in the sky, home to the unstable, hugely massive star Eta Carinae.', catalog:'NGC 3372' },
          hans: { type:'发射星云', distance:'约 7,500 光年', constellation:'船底座', facts:[['包含','海山二']], desc:'天空中最大的星云之一,栖身着极不稳定、质量巨大的恒星海山二。', catalog:'NGC 3372' },
          hant: { type:'發射星雲', distance:'約 7,500 光年', constellation:'船底座', facts:[['包含','海山二']], desc:'天空中最大的星雲之一,棲身著極不穩定、質量巨大的恆星海山二。', catalog:'NGC 3372' } } },
      { p: near(15, 80),
        t: { en: ['Cygnus X-1'], hans: ['天鹅座 X-1'], hant: ['天鵝座 X-1'] },
        info: {
          en:   { type:'Stellar black hole', distance:'~7,000 light-years', constellation:'Cygnus', facts:[['Black hole','~21 M☉'],['System','X-ray binary']], desc:'The first object widely accepted as a black hole, pulling gas from a blue supergiant companion.', catalog:'Cyg X-1' },
          hans: { type:'恒星级黑洞', distance:'约 7,000 光年', constellation:'天鹅座', facts:[['黑洞','约 21 倍太阳质量'],['系统','X 射线双星']], desc:'第一个被广泛承认的黑洞,正从一颗蓝超巨星伴星吸积气体。', catalog:'Cyg X-1' },
          hant: { type:'恆星級黑洞', distance:'約 7,000 光年', constellation:'天鵝座', facts:[['黑洞','約 21 倍太陽質量'],['系統','X 射線雙星']], desc:'第一個被廣泛承認的黑洞,正從一顆藍超巨星伴星吸積氣體。', catalog:'Cyg X-1' } } },
      { p: near(-20, -18),
        t: { en: ['Pleiades'], hans: ['昴星团'], hant: ['昴星團'] },
        info: {
          en:   { type:'Open cluster', distance:'~440 light-years', constellation:'Taurus', facts:[['Stars','1,000+'],['Age','~100 million yr']], desc:'The naked-eye “Seven Sisters” — hot blue stars still wrapped in wisps of reflection nebulosity.', catalog:'M45' },
          hans: { type:'疏散星团', distance:'约 440 光年', constellation:'金牛座', facts:[['恒星','1000+ 颗'],['年龄','约 1 亿年']], desc:'肉眼可见的“七姐妹”,炽热的蓝色恒星仍笼罩在反射星云的薄纱中。', catalog:'M45' },
          hant: { type:'疏散星團', distance:'約 440 光年', constellation:'金牛座', facts:[['恆星','1000+ 顆'],['年齡','約 1 億年']], desc:'肉眼可見的「七姐妹」,熾熱的藍色恆星仍籠罩在反射星雲的薄紗中。', catalog:'M45' } } },
      { p: near(55, -78),
        t: { en: ['Omega Centauri'], hans: ['半人马 ω'], hant: ['半人馬 ω'] },
        info: {
          en:   { type:'Globular cluster', distance:'~17,000 light-years', constellation:'Centaurus', facts:[['Stars','~10 million'],['Note','Largest MW globular']], desc:'The Milky Way’s largest globular cluster, possibly the stripped core of a swallowed dwarf galaxy.', catalog:'NGC 5139' },
          hans: { type:'球状星团', distance:'约 17,000 光年', constellation:'半人马座', facts:[['恒星','约 1000 万颗'],['特点','银河系最大球状星团']], desc:'银河系中最大的球状星团,可能是一个被吞并的矮星系残核。', catalog:'NGC 5139' },
          hant: { type:'球狀星團', distance:'約 17,000 光年', constellation:'半人馬座', facts:[['恆星','約 1000 萬顆'],['特點','銀河系最大球狀星團']], desc:'銀河系中最大的球狀星團,可能是一個被吞併的矮星系殘核。', catalog:'NGC 5139' } } },
      { p: near(-52, 22), cls: 'up',
        t: { en: ['Betelgeuse'], hans: ['参宿四'], hant: ['參宿四'] },
        info: {
          en:   { type:'Red supergiant', distance:'~550 light-years', constellation:'Orion', facts:[['Diameter','~700× Sun'],['Fate','Future supernova']], desc:'The red star on Orion’s shoulder — so vast it would swallow the inner planets, and destined to explode.', catalog:'α Ori' },
          hans: { type:'红超巨星', distance:'约 550 光年', constellation:'猎户座', facts:[['直径','约太阳的 700 倍'],['归宿','未来的超新星']], desc:'猎户座“肩头”的红色恒星,大到能吞下内太阳系行星,终将爆发为超新星。', catalog:'α Ori' },
          hant: { type:'紅超巨星', distance:'約 550 光年', constellation:'獵戶座', facts:[['直徑','約太陽的 700 倍'],['歸宿','未來的超新星']], desc:'獵戶座「肩頭」的紅色恆星,大到能吞下內太陽系行星,終將爆發為超新星。', catalog:'α Ori' } } },
      { p: near(28, 68),
        t: { en: ['Veil Nebula'], hans: ['面纱星云'], hant: ['面紗星雲'] },
        info: {
          en:   { type:'Supernova remnant', distance:'~2,400 light-years', constellation:'Cygnus', facts:[['Age','~10,000 yr'],['Form','Filamentary shell']], desc:'The delicate, lacework filaments of a supernova that detonated about 10,000 years ago.', catalog:'NGC 6960' },
          hans: { type:'超新星遗迹', distance:'约 2,400 光年', constellation:'天鹅座', facts:[['年龄','约 1 万年'],['形态','丝缕状壳层']], desc:'约 1 万年前爆发的超新星,留下如蕾丝般纤细的气体丝缕。', catalog:'NGC 6960' },
          hant: { type:'超新星遺跡', distance:'約 2,400 光年', constellation:'天鵝座', facts:[['年齡','約 1 萬年'],['形態','絲縷狀殼層']], desc:'約 1 萬年前爆發的超新星,留下如蕾絲般纖細的氣體絲縷。', catalog:'NGC 6960' } } }
    ];
```

- [ ] **Step 2: Add `assertBeaconInfo()` right after the `buildBeacons` IIFE closes (after its `})();`).**

```js
  // self-check: every beacon has complete info in all 3 languages (run from console)
  function assertBeaconInfo() {
    var langs = ['en', 'hans', 'hant'], fields = ['type', 'distance', 'constellation', 'facts', 'desc'];
    BEACONS.forEach(function (b, i) {
      if (!b.info) throw new Error('beacon ' + i + ' missing info');
      langs.forEach(function (L) {
        var o = b.info[L];
        if (!o) throw new Error('beacon ' + i + ' missing info.' + L);
        fields.forEach(function (f) { if (o[f] == null) throw new Error('beacon ' + i + ' info.' + L + '.' + f + ' missing'); });
        if (!Array.isArray(o.facts)) throw new Error('beacon ' + i + ' info.' + L + '.facts not array');
      });
    });
    return true;
  }
```

Note: `BEACONS` entries must carry `info`. In the `buildBeacons` loop, the push is `BEACONS.push({ p: d.p, el: el, t: d.t, shown: true })`. Change it to include info:

```js
      BEACONS.push({ p: d.p, el: el, t: d.t, info: d.info, shown: true });
```

- [ ] **Step 3: Verify all 11 beacons render and the self-check passes.**

Serve and load the page (see Verification setup). In the browser console run:
```js
assertBeaconInfo(); document.querySelectorAll('.beacon').length
```
Expected: `assertBeaconInfo()` returns `true` (no throw); count is `11`.
Also eyeball a wide-viewport screenshot: 11 labels visible, no two hard-overlapping. If a new beacon's label collides with a neighbour, nudge its `near(dIn, dAlong)` numbers (this is a visual tuning knob) and reload.

- [ ] **Step 4: Commit.**

```bash
git add index.html
git commit -m "Add 4 beacons and per-object info data with self-check"
```

---

### Task 2: Make beacons clickable + selection state + CSS highlight

**Files:**
- Modify: `index.html` — beacon CSS block (search `.b-mark {`), add pointer-events + `.sel`/`.dim`/hover rules.
- Modify: `index.html` — beacon JS (after `assertBeaconInfo`), add `selectedBeacon`, `selectBeacon(i)`, `clearSelection()`, and click wiring.

**Interfaces:**
- Consumes: `BEACONS` (each `{p, el, t, info, shown}`), `setBeaconLang` presence.
- Produces: module globals `selectedBeacon` (number|null), `selectBeacon(i)`, `clearSelection()`; each beacon `el` gets/removes classes `sel`/`dim`. (Panel + ring are wired in later tasks — this task only toggles classes.)

- [ ] **Step 1: Add interaction CSS.** After the existing `.beacon.sun .b-label small` rule (and before the `@media (max-width: 640px)` block), add:

```css
  /* interaction: only the mark + label catch clicks (container stays none) */
  .beacon .b-mark, .beacon .b-label { pointer-events: auto; cursor: pointer; }
  .beacon .b-mark { transition: transform .15s ease; }
  .beacon.dim { opacity: .45; transition: opacity .2s ease; }
  .beacon:hover .b-mark { transform: scale(1.25); }
  .beacon.sel .b-mark { transform: scale(1.5); }
  .beacon.sel .b-dot { box-shadow: 0 0 16px 4px var(--bc); }
  .beacon.sel .b-label { color: #fff; }
```

- [ ] **Step 2: Add selection state + functions** right after `assertBeaconInfo()`:

```js
  var selectedBeacon = null;
  function selectBeacon(i) {
    if (i === selectedBeacon) { clearSelection(); return; }
    selectedBeacon = i;
    for (var k = 0; k < BEACONS.length; k++) {
      BEACONS[k].el.classList.toggle('sel', k === i);
      BEACONS[k].el.classList.toggle('dim', k !== i);
    }
    // panel + 3D ring are attached in later tasks via openBeaconExtras(i)
    if (window.openBeaconExtras) window.openBeaconExtras(i);
  }
  function clearSelection() {
    selectedBeacon = null;
    for (var k = 0; k < BEACONS.length; k++) { BEACONS[k].el.classList.remove('sel', 'dim'); }
    if (window.closeBeaconExtras) window.closeBeaconExtras();
  }
```

- [ ] **Step 3: Wire clicks** inside the `buildBeacons` loop, right after `host.appendChild(el);`. Capture the index with a closure:

```js
      (function (idx) { el.addEventListener('click', function (e) { e.stopPropagation(); selectBeacon(idx); }); })(i);
```

- [ ] **Step 4: Verify highlight.** Serve, load, click a beacon (or in console `selectBeacon(2)`). Expected: that beacon's dot enlarges + brighter, all others dim to ~45%. `selectBeacon(2)` again (or `clearSelection()`) restores all. Hovering a beacon on desktop enlarges its dot. No console errors. Dragging empty space still orbits the galaxy.

- [ ] **Step 5: Commit.**

```bash
git add index.html
git commit -m "Make beacons clickable with selection highlight"
```

---

### Task 3: Side panel — DOM, render, open/close/swap, language link

**Files:**
- Modify: `index.html` — add `#beacon-panel` markup (near `#beacons`/overlays in `<body>`).
- Modify: `index.html` — panel CSS (desktop right side).
- Modify: `index.html` — JS: `renderPanel`, `openBeaconExtras`/`closeBeaconExtras`, outside-click + `Esc`, and hook into `setBeaconLang`.

**Interfaces:**
- Consumes: `BEACONS[i].info`, `BEACONS[i].t`, `beaconLang`, `selectedBeacon`, `selectBeacon`/`clearSelection`.
- Produces: `renderPanel(i, lang)`; global `window.openBeaconExtras(i)` (shows + fills panel), `window.closeBeaconExtras()` (hides panel). Panel DOM id `beacon-panel`.

- [ ] **Step 1: Add panel markup.** After the `<div id="beacons">`… is created in JS it's fine, but the panel is static — add this to `<body>` right after the `<div id="msg" …>` line:

```html
<div id="beacon-panel" class="overlay" aria-live="polite">
  <button id="bp-close" title="Close" aria-label="Close">×</button>
  <div id="bp-body"></div>
</div>
```

- [ ] **Step 2: Add panel CSS** after the beacon `@media` block:

```css
  /* beacon info panel — desktop: fixed right side */
  #beacon-panel { top: 74px; right: 14px; width: 300px; max-height: calc(100vh - 96px); overflow-y: auto;
    z-index: 7; background: rgba(10,14,24,.92); border-radius: 12px; padding: 16px 18px 18px;
    color: #e5e7eb; box-shadow: 0 8px 30px rgba(0,0,0,.5); display: none; }
  #beacon-panel.open { display: block; animation: bpIn .18s ease; }
  @keyframes bpIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
  #bp-close { position: absolute; top: 8px; right: 10px; background: transparent; border: 0; color: #9ca3af;
    font-size: 20px; line-height: 1; cursor: pointer; padding: 2px 6px; }
  #bp-close:hover { color: #fff; }
  #bp-name { font-size: 18px; font-weight: 600; margin: 0 20px 6px 0; }
  #bp-type { display: inline-block; font-size: 11px; letter-spacing: .04em; padding: 2px 8px; border-radius: 999px;
    background: rgba(255,255,255,.08); color: #cbd5e1; margin-bottom: 10px; }
  .bp-row { display: flex; justify-content: space-between; gap: 12px; font-size: 12.5px; padding: 4px 0;
    border-top: 1px solid rgba(255,255,255,.07); }
  .bp-row .k { color: #93a5c4; } .bp-row .v { color: #e5e7eb; text-align: right; }
  #bp-desc { font-size: 13px; line-height: 1.55; color: #cbd5e1; margin-top: 10px; }
  #bp-cat { font-size: 10.5px; color: #6b7280; margin-top: 10px; }
  body.gx-cinema #beacon-panel { display: none !important; }
```

- [ ] **Step 3: Add render + open/close + wiring** after `clearSelection()`:

```js
  var bpEl = document.getElementById('beacon-panel'), bpBody = document.getElementById('bp-body');
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;' }[c]; }); }
  function renderPanel(i, lang) {
    var b = BEACONS[i], o = b.info[lang] || b.info.en, name = (b.t[lang] || b.t.en)[0], ac = getComputedStyle(b.el).getPropertyValue('--bc').trim() || '#8fc2ff';
    var rows = [['', o.distance ? (lang === 'en' ? 'Distance' : '距离') : null, o.distance],
                ['', lang === 'en' ? 'Constellation' : '星座', o.constellation]]
      .filter(function (r) { return r[2]; })
      .map(function (r) { return '<div class="bp-row"><span class="k">' + esc(r[1]) + '</span><span class="v">' + esc(r[2]) + '</span></div>'; });
    o.facts.forEach(function (f) { rows.push('<div class="bp-row"><span class="k">' + esc(f[0]) + '</span><span class="v">' + esc(f[1]) + '</span></div>'); });
    bpBody.innerHTML =
      '<div id="bp-name" style="color:' + ac + '">' + esc(name) + '</div>' +
      '<span id="bp-type">' + esc(o.type) + '</span>' +
      rows.join('') +
      '<div id="bp-desc">' + esc(o.desc) + '</div>' +
      (o.catalog ? '<div id="bp-cat">' + esc(o.catalog) + '</div>' : '');
  }
  window.openBeaconExtras = function (i) { renderPanel(i, beaconLang); bpEl.classList.add('open'); };
  window.closeBeaconExtras = function () { bpEl.classList.remove('open'); };
  document.getElementById('bp-close').addEventListener('click', function (e) { e.stopPropagation(); clearSelection(); });
  window.addEventListener('click', function () { if (selectedBeacon !== null) clearSelection(); }); // outside click
  bpEl.addEventListener('click', function (e) { e.stopPropagation(); }); // clicks inside panel don't close
  window.addEventListener('keydown', function (e) { if ((e.key || '').toLowerCase() === 'escape' && selectedBeacon !== null) clearSelection(); });
```

Note: the label-localization key strings (`'Distance'`/`'距离'`, `'Constellation'`/`'星座'`) use `en` vs non-en; `hant` shares the Chinese key with `hans` here — acceptable since data values carry their own language. If per-`hant` keys are wanted later, expand the ternary.

- [ ] **Step 4: Refresh panel on language change.** Find `function setBeaconLang(lang) {` and at the END of its body (after the label loop), add:

```js
    if (typeof selectedBeacon !== 'undefined' && selectedBeacon !== null && typeof renderPanel === 'function') renderPanel(selectedBeacon, lang);
```

- [ ] **Step 5: Verify.** Serve, load. Click each of the 11 beacons → panel opens with THAT object's name/type/distance/constellation/facts/desc (spot-check Sgr A* shows black-hole data, Crab shows Taurus). Click another beacon → content swaps, panel stays. Switch language top-right → open panel re-renders in en/hans/hant. Close via ×, `Esc`, and clicking empty space. Press `F` → panel hides. No console errors.

- [ ] **Step 6: Commit.**

```bash
git add index.html
git commit -m "Add beacon info side panel with language-aware rendering"
```

---

### Task 4: 3D highlight ring at the selected object

**Files:**
- Modify: `index.html` — add a ring texture + reusable sprite under `galaxyRoot`; extend `openBeaconExtras`/`closeBeaconExtras`.

**Interfaces:**
- Consumes: `THREE`, `galaxyRoot`, `BEACONS[i].p`, each beacon `el`'s `--bc`, `openBeaconExtras`/`closeBeaconExtras` from Task 3.
- Produces: module `beaconRing` (a `THREE.Sprite`); `openBeaconExtras` also positions+shows it, `closeBeaconExtras` hides it.

- [ ] **Step 1: Build the ring texture + sprite.** Add near the beacon JS (after the panel code), before the render loop:

```js
  // reusable 3D highlight ring — a soft annulus sprite that rides galaxyRoot
  function ringTexture() {
    var s = 128, c = document.createElement('canvas'); c.width = c.height = s;
    var x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 30, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.72, 'rgba(255,255,255,0)');
    g.addColorStop(0.86, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(64, 64, 62, 0, 6.2832); x.fill();
    return new THREE.CanvasTexture(c);
  }
  var beaconRing = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), color: 0x8fc2ff,
    transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  beaconRing.scale.set(46, 46, 1); beaconRing.visible = false; galaxyRoot.add(beaconRing);
```

- [ ] **Step 2: Extend open/close to drive the ring.** Replace the two `window.openBeaconExtras`/`window.closeBeaconExtras` assignments from Task 3 with:

```js
  window.openBeaconExtras = function (i) {
    renderPanel(i, beaconLang); bpEl.classList.add('open');
    var ac = getComputedStyle(BEACONS[i].el).getPropertyValue('--bc').trim() || '#8fc2ff';
    beaconRing.material.color.set(ac);
    beaconRing.position.copy(BEACONS[i].p);
    beaconRing.visible = true; beaconRing.material.opacity = 0.9;
  };
  window.closeBeaconExtras = function () { bpEl.classList.remove('open'); beaconRing.visible = false; beaconRing.material.opacity = 0; };
```

- [ ] **Step 3: Gentle pulse.** In the `frame()` render loop, right after the core-breathe loop (search `cb.sp.material.opacity`), add:

```js
    if (beaconRing.visible) { var rp = 1 + 0.08 * Math.sin(t * 2.2); beaconRing.scale.set(46 * rp, 46 * rp, 1); }
```

- [ ] **Step 4: Verify.** Serve, load, click a beacon. Expected: a glowing ring appears at that object's position in the galaxy, tinted the beacon's color, gently pulsing; it rotates with the galaxy. Switch selection → ring moves to the new object. Close → ring disappears. Sgr A* ring sits at the core; Solar System ring out on the arm. No console errors.

- [ ] **Step 5: Commit.**

```bash
git add index.html
git commit -m "Add 3D highlight ring at the selected object"
```

---

### Task 5: Mobile bottom-drawer layout + responsive polish

**Files:**
- Modify: `index.html` — add a `≤640px` media rule for `#beacon-panel`.

**Interfaces:**
- Consumes: `#beacon-panel` styles from Task 3.
- Produces: mobile-only panel layout (bottom drawer). No JS changes.

- [ ] **Step 1: Add mobile panel CSS.** Inside (or append a new) `@media (max-width: 640px)` block:

```css
  @media (max-width: 640px) {
    #beacon-panel { top: auto; bottom: 0; right: 0; left: 0; width: auto; max-height: 52vh;
      border-radius: 14px 14px 0 0; padding: 14px 16px 18px; }
    #beacon-panel.open { animation: bpUp .2s ease; }
    @keyframes bpUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  }
```

- [ ] **Step 2: Verify.** Serve, load, set the browser to a 375px-wide viewport. Click a beacon → panel slides up from the bottom, full width, does not cover the galaxy above; scrolls if content is long. Beacon labels already shrink (existing rule). Switch back to desktop width → panel returns to the right side. `F` still hides it.

- [ ] **Step 3: Full regression pass.** Desktop + mobile: all 11 beacons open correct cards; swap/close/Esc/outside-click; language switch re-renders; 3D ring tracks selection; `assertBeaconInfo()` returns true. Fix any beacon-label overlaps by nudging `near()` offsets.

- [ ] **Step 4: Commit.**

```bash
git add index.html
git commit -m "Add mobile bottom-drawer layout for the beacon panel"
```

---

## Self-Review

**Spec coverage:**
- Picking via HTML overlay (no raycasting) → Task 2 (pointer-events + click). ✓
- Click/tap toggle single card, camera fixed → Tasks 2–3 (`selectBeacon` toggle, no camera code). ✓
- Detailed card (name/type/distance/constellation/facts/desc/catalog) → Task 3 `renderPanel`. ✓
- Fixed side panel, desktop right / mobile bottom → Task 3 CSS + Task 5 media. ✓
- Language follows `gx-lang` → Task 3 Step 4 (`setBeaconLang` hook). ✓
- CSS highlight (sel enlarges, others dim) + hover → Task 2 CSS. ✓
- 3D ring at object, rides rotation → Task 4. ✓
- Not persisted → no `localStorage` writes for selection (none added). ✓
- 11 beacons incl. 4 new + info → Task 1. ✓
- Cinema `F` hides panel → Task 3 CSS (`body.gx-cinema`). ✓
- `assertBeaconInfo()` self-check → Task 1. ✓
- Non-goals (fly-to, raycasting, persistence, constellation figures) → none introduced. ✓

**Placeholder scan:** No TBD/TODO; all CSS/JS/data shown in full. ✓

**Type consistency:** `selectBeacon(i)`/`clearSelection()`/`renderPanel(i,lang)`/`openBeaconExtras(i)`/`closeBeaconExtras()`/`beaconRing`/`assertBeaconInfo()` used consistently across tasks; `BEACONS` entries carry `{p,el,t,info,shown}` after Task 1 Step 2. ✓
