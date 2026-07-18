# Celestial View (12 Zodiac Constellations) — Design Spec

- **Date:** 2026-07-18
- **Status:** Approved (design), pending implementation plan
- **Scope:** A second, self-contained "celestial sphere" view showing the 12
  zodiac constellations as real star-position stick figures, entered from a
  link inside the Solar System beacon card. Single file (`index.html`), no new
  dependencies.

## 1. Overview

The main view is a Milky Way fly-around. Constellations are *directions seen
from Earth*, not places in the galaxy — so they get their own Earth-centred
sky view rather than markers in the galactic disc. The user clicks
"♈ 十二星座" inside the Solar System card to enter; a back button (or Esc)
returns to the galaxy.

## 2. Decisions (confirmed with user)

- **Form:** 3D rotatable sky dome (approach A — a separate `THREE.Scene`),
  not a 2D wheel or a flat card list.
- **Constellations:** real line-figures — each zodiac constellation drawn from
  its main bright stars at true J2000 RA/Dec positions, joined by traditional
  stick-figure lines, with a name label.
- **Interaction:** clicking a constellation opens an info card (same panel
  system as beacon cards); selected constellation brightens, others dim.
- **Entry:** a localized link row at the bottom of the Solar System beacon
  card only. **Return:** top-left back button + Esc.
- **Language:** all labels and cards follow the existing en/hans/hant switch.

## 3. Architecture

**Separate scene, shared renderer.** One WebGL renderer and one rAF loop; a
`viewMode` flag (`'galaxy' | 'sky'`) decides which scene renders each frame.
The galaxy scene simply stops being rendered while in sky view (its state is
untouched). No URL routing.

Components:

1. **Entry/return** — link row appended by `renderPanel` when the selected
   beacon is the Solar System; `enterSky()` / `exitSky()` toggle `viewMode`,
   beacon overlay visibility, back-button visibility, and which controls are
   active.
2. **Sky scene** — camera at the origin (the observer), FOV 60,
   `OrbitControls` rotate-only (no pan/zoom), damping on, very slow idle
   auto-rotation that user drag interrupts.
3. **Backdrop** — ~2,500 faint twinkling background stars on the sphere
   (reuse the existing twinkle-shader approach) + a faint Milky-Way band
   (the galaxy seen edge-on from inside) + a faint ecliptic circle through
   the 12 constellations.
4. **Zodiac layer** — per constellation: bright stars as glow points (sized
   by magnitude), traditional line segments (additive, translucent), an HTML
   name label anchored at the figure's centroid direction (reuse the beacon
   screen-projection mechanism; labels behind the camera hide).
5. **Info card** — reuse the `#beacon-panel` DOM + CSS (desktop right panel,
   mobile bottom drawer); a separate `renderConstellationPanel(i, lang)` fill
   function. Card: name + symbol, date range, brightest star, main-star
   count, 2–3 sentence description. Same close paths (×, outside-click, Esc,
   re-click). Selected constellation brightens; others dim.

## 4. Data

`ZODIAC` array, 12 entries (Aries … Pisces). Each entry:

- `t: { en, hans, hant }` — display name per language
- `symbol` — ♈ … ♓
- `stars: [[raHours, decDeg, mag], …]` — 5–10 main stars, J2000
- `lines: [[i, j], …]` — index pairs into `stars` forming the stick figure
- `info: { en, hans, hant: { dates, brightest, desc } }`

RA/Dec → direction: `x = cos(dec)·cos(ra)`, `y = sin(dec)`,
`z = −cos(dec)·sin(ra)` on a fixed-radius sphere, viewed from inside.

Astronomy data is authored during planning and cross-checked for accuracy
(star identities, positions, figures, date ranges).

## 5. Interaction details

- **Esc semantics:** card open → first Esc closes the card; next Esc exits
  sky view. In galaxy view Esc keeps its existing meaning.
- **F cinema** hides sky labels, back button, and panel like other chrome.
- Language switch re-renders name labels and any open card in place.
- Music button/`M` remain available in both views.

## 6. Testing

- `assertZodiacData()` self-check: 12 entries; 3 languages complete; line
  indices in range; RA ∈ [0,24), Dec ∈ [−90,90].
- Browser regression: enter/exit both paths, rotation, each of the 12 cards
  correct in 3 languages, select-brighten/dim, mobile bottom drawer, Esc
  two-stage semantics, cinema mode.

## 7. Non-goals (YAGNI)

- No bloom composer for the sky view (crisp points/lines don't need it).
- No URL routing / deep links.
- No non-zodiac constellations (88-constellation atlas out of scope).
- No horizon/ground, no time-of-year simulation, no planet positions.
