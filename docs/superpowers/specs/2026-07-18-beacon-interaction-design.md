# Beacon Interaction — Design Spec

- **Date:** 2026-07-18
- **Status:** Approved (design), pending implementation plan
- **Scope:** Turn the existing location beacons in `index.html` from static
  markers into interactive elements: hover highlight + click to open a detailed
  info card (fixed side panel) for that object. Camera does **not** move.

## 1. Overview

The galaxy already renders 7 borderless beacons as an HTML overlay (`#beacons`,
currently `pointer-events: none`), each an `.b-mark` (glow dot + pulse rings)
plus a `.b-label`, projected to screen every frame from a 3D point in
`galaxyRoot` space. This feature makes them clickable and adds a side panel with
rich per-object information, plus a highlight (CSS + a 3D ring) for the selected
object. It also grows the set to 11 beacons.

## 2. Decisions (confirmed with user)

- **Picking:** Approach A — reuse the HTML overlay. Set the beacon's `.b-mark`
  and `.b-label` to `pointer-events: auto`; keep the container `none`. No
  three.js raycasting (poor hit-rate on tiny points, and it would mean rewriting
  the overlay as 3D objects for no visual gain).
- **Interaction:** click / tap toggles a single card. Clicking an unselected
  beacon opens it; clicking the selected one, clicking outside the panel, or
  `Esc` closes it; clicking a different beacon swaps content. Camera stays put.
- **Card:** detailed — name, type, distance from Earth, constellation, key data
  rows, description paragraph. Fixed side panel: right side on desktop, bottom
  drawer on mobile (≤640px).
- **Language:** card text follows the existing language switch (`gx-lang`:
  `en` / `hans` / `hant`). Content authored in all three.
- **Highlight:** CSS highlight (selected beacon enlarges, pulse strengthens;
  others dim) + desktop hover highlight (weaker) + one reusable 3D ring sprite
  placed at the selected object's real position, riding the galaxy rotation.
- **Persistence:** the open/selected state is **not** persisted — a reload
  returns to "nothing selected". Language still persists via `gx-lang`.

## 3. Object list (11)

Content authored by us from astronomical fact; the table is the content spec.

| Object | Type | Distance | Constellation | Key data | Highlight |
|---|---|---|---|---|---|
| Solar System / 太阳系 | Star system | You are here | — | 1 star · 8 planets | Our home |
| Sagittarius A* / 人马座 A* | Supermassive black hole | ~26,000 ly | Sagittarius | ~4.3M M☉ | Galactic centre |
| Orion Nebula (M42) / 猎户座大星云 | Emission nebula | ~1,340 ly | Orion | Ø ~24 ly · mag 4.0 | Naked-eye star nursery |
| Crab Nebula (M1) / 蟹状星云 | Supernova remnant | ~6,500 ly | **Taurus** | 1054 CE SN · pulsar | Recorded-supernova remnant |
| Eagle Nebula (M16) / 鹰状星云 | Emission nebula | ~7,000 ly | Serpens | "Pillars of Creation" | Famous star-forming region |
| Carina Nebula / 船底座大星云 | Emission nebula | ~7,500 ly | Carina | hosts Eta Carinae | Southern giant star factory |
| Cygnus X-1 / 天鹅座 X-1 | Stellar black hole (X-ray binary) | ~7,000 ly | Cygnus | ~21 M☉ black hole | First widely accepted black hole |
| Pleiades (M45) / 昴星团 | Open cluster | ~440 ly | Taurus | 1000+ stars · hot blue | Naked-eye "Seven Sisters" |
| Omega Centauri / 半人马 ω | Globular cluster | ~17,000 ly | Centaurus | ~10M stars · largest globular | Likely a dwarf-galaxy core |
| Betelgeuse / 参宿四 | Red supergiant | ~550 ly | Orion | Ø ~700× Sun · pre-supernova | Orion's red shoulder |
| Veil Nebula / 面纱星云 | Supernova remnant | ~2,400 ly | Cygnus | ~10,000-yr-old SN · filaments | Cygnus explosion remnant |

Accuracy note: the Crab Nebula is in **Taurus**, not "Cancer" — the Chinese name
蟹状星云 comes from its crab-like shape, not its sky location.

## 4. Data structure

Extend each `DEFS` entry (which already has `t: { en, hans, hant }` for the
label) with an `info` field, same per-language shape:

```js
info: {
  en:   { type, distance, constellation, facts: [[key, value], …], desc, catalog },
  hans: { … },
  hant: { … }
}
```

`facts` is an array of `[key, value]` pairs (keys localized too). `catalog` is a
short designation (e.g. `M42`, `Sgr A*`) shown small at the card footer. Numbers
carry localized units (光年 / light-years).

Worked example (Sagittarius A*):

```js
info: {
  en:   { type:'Supermassive black hole', distance:'~26,000 light-years', constellation:'Sagittarius',
          facts:[['Mass','~4.3 million M☉']], desc:'The supermassive black hole anchoring the centre of the Milky Way.', catalog:'Sgr A*' },
  hans: { type:'超大质量黑洞', distance:'约 26,000 光年', constellation:'人马座',
          facts:[['质量','约 430 万倍太阳质量']], desc:'坐镇银河系中心的超大质量黑洞。', catalog:'Sgr A*' },
  hant: { type:'超大質量黑洞', distance:'約 26,000 光年', constellation:'人馬座',
          facts:[['質量','約 430 萬倍太陽質量']], desc:'坐鎮銀河系中心的超大質量黑洞。', catalog:'Sgr A*' }
}
```

### Placement of the 4 new beacons

Positions live in `galaxyRoot` space (same helpers as the current beacons:
`armXZ` / `near`). Betelgeuse sits near the Orion Nebula (both Orion-ward), the
Veil Nebula near Cygnus X-1 (both Cygnus-ward), the Pleiades on the Taurus-ward
outer side of the Sun, Omega Centauri toward the inner south. Same-region pairs
get an angle/distance offset so their labels don't overlap — the existing
distance-stretching approach.

## 5. Components

1. **Beacon interaction layer** — `.b-mark` / `.b-label` become
   `pointer-events: auto`; a `click` handler per beacon; a module-level
   `selectedBeacon` index (or `null`).
2. **Side panel** — one DOM node (`#beacon-panel`), a `renderPanel(beacon, lang)`
   that fills name / type badge / data rows / description / footer; a close `×`.
3. **Highlight (CSS)** — toggling classes: `.sel` on the selected beacon,
   `.dim` on the rest; a weaker `:hover` state on desktop.
4. **3D ring** — a single reusable sprite added under `galaxyRoot`; on select,
   move it to the object's `b.p`, tint it the beacon's `--bc`, show it; hide on
   close. Additive blending + existing bloom make it glow.
5. **Language link** — extend `setBeaconLang(lang)`: after refreshing labels, if
   the panel is open, re-render it with the selected beacon's `info[lang]`.

## 6. Data flow

```
click beacon i → selectBeacon(i):
    selectedBeacon = i
    renderPanel(BEACONS[i], beaconLang); show panel
    add .sel to i, .dim to others
    move + show 3D ring at BEACONS[i].p, tinted --bc
close (×, outside click, Esc, re-click selected) → clearSelection():
    selectedBeacon = null; hide panel; remove .sel/.dim; hide ring
language change → setBeaconLang(lang):
    refresh labels; if panel open, renderPanel(BEACONS[selectedBeacon], lang)
```

The 3D ring lives under `galaxyRoot`, so it tracks rotation automatically after
being positioned once. The panel is fixed DOM (no per-frame work).

## 7. Layout

- **Desktop (>640px):** panel fixed on the right, below the language selector
  (no overlap with title top-left, language top-right, audio bottom-right).
  ~300px wide, dark translucent card (reuse `rgba(10,14,24,…)` + rounded), `×`
  top-right. Accent color = the object's `--bc`.
- **Mobile (≤640px):** bottom drawer, full width, height fits content up to
  ~50% viewport, scrolls if longer; does not cover the galaxy above.
- Open / swap: fade + slight slide; swapping to another beacon replaces content
  without closing. One card at a time.
- `F` cinema mode hides the panel with the rest of the chrome (extend the
  existing `body.gx-cinema` rule).

## 8. Edge cases & error handling

- **Selected beacon rotates behind the disc:** the beacon element already
  `display:none`s when off-screen (existing projection logic); the panel stays
  open (its content doesn't depend on the marker), and the 3D ring simply rotates
  out of view. Acceptable.
- **Drag vs click:** native `click` already excludes drags, so orbiting the
  galaxy won't fire a card. Cost: a drag *started* exactly on a beacon dot is
  swallowed by that element — dots are tiny, accept it; revisit with
  pointerdown/up displacement only if it bites.
- **Missing / incomplete `info`:** a self-check (see Testing) asserts every
  `DEFS` entry has all three languages with the required fields, so 11×3 sets of
  content can't silently ship half-filled.

## 9. Visual style

Reuse existing palette (dark translucent panels, `#e5e7eb`/`#cbd5e1` text). The
selected object's `--bc` accents the panel title / data rule and tints the 3D
ring. Beacons themselves stay borderless (unchanged).

## 10. Testing

Single-file, no framework — verified in-browser by the author:

- Each of the 11 beacons opens its own correct card; swap between them; close via
  `×` / outside-click / `Esc` / re-click.
- Language switch re-renders an open panel (en/hans/hant).
- Desktop hover highlight; mobile bottom drawer; 3D ring lands on the right
  object and rides rotation.
- Cinema mode (`F`) hides the panel.

Plus a lightweight self-check function that walks `DEFS` and asserts each has a
complete `info` block in all three languages (runnable from the console; the
smallest thing that fails if content is missing).

## 11. Non-goals (YAGNI)

- Camera fly-to on click (camera stays put).
- three.js raycasting picking.
- Persisting the open/selected panel state.
- Constellation *figures* as beacons (no single 3D position in this model).
