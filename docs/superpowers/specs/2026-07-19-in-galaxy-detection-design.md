# In-Galaxy Object Detection — Design

**Goal:** After flying into an external galaxy, let the user run a sci-fi "scan"
that progressively reveals beacons for notable objects *inside* that galaxy —
each rendered as a real 3D feature and backed by a full five-language photo
card — turning each galaxy into its own teaching mini-map.

**Status:** Pilot (2 galaxies, 4 objects) to validate the whole flow, then expand.

## Scope

**Pilot galaxies & objects (4):**

| Galaxy | Internal object | Feature type | Photo (Wikimedia Commons, PD/CC) |
|---|---|---|---|
| Centaurus A | Relativistic jet | jet (blue-white beam from the nucleus) | Chandra/radio jet image |
| Centaurus A | Dust-lane star-forming region | nebula (pink HII + blue star cluster) | Hubble Cen A dust-lane detail |
| M31 Andromeda | NGC 206 star cloud | starcloud (bright blue-white clump) | NGC 206 / M31 detail |
| M31 Andromeda | G1 (Mayall II) globular | globular (compact dense bright knot) | Hubble G1 image |

Four distinct feature types (jet / nebula / starcloud / globular) are covered by
the pilot on purpose, so the renderer is exercised end-to-end.

**Out of scope (future):**
- **Probabilistic detection** — each scan finds objects with a chance, so
  re-scanning matters (game feel). Pilot detection is deterministic: one scan
  finds everything.
- **Expansion** — M33 (NGC 604), M87 (jet), LMC (Tarantula Nebula, SN 1987A —
  add the `supernova` feature: bright point + faint expanding ring), SMC (NGC 346).
- The two EHT black-hole photos already live on existing beacons: `M87` (M87\*)
  and `人马座A*` (Sgr A\*). Centaurus A's black hole has **not** been imaged as a
  shadow, so it gets the jet, not a black-hole object.

## Architecture

Extend the existing beacon system rather than build a separate interior scene.
Internal objects are **child beacons**: ordinary entries in the same `BEACONS`
array (so `selectBeacon`, `renderPanel`, the card panel, declutter and the
language switch all work unchanged), flagged as children and carrying a parent
galaxy, a position in the galaxy's *local* frame, and a feature descriptor.

```
// appended to BEACONS, alongside the top-level beacons
CHILD = {
  child: true,
  parent: 'NGC 5128',              // parent galaxy's info.en.catalog
  lp: THREE.Vector3(x, y, z),      // position in the galaxy's LOCAL disc frame
  feat: { kind, ...opts },         // 'jet' | 'nebula' | 'starcloud' | 'globular' | 'supernova'
  t:    { en:[name,sub], hans, hant, ja, ko },
  info: { en:{type,distance?,constellation?,facts,desc,catalog}, hans, hant, ja, ko },
  img, credit,                     // real Commons photo
  // runtime: el, revealed, sx, sy (shared with normal beacons)
}
```

**Co-rotation.** Each galaxy's `Points` object already spins about its disc axis
(`galaxyLODs[i].pts`). In `updateBeacons`, a child projects through its parent's
world matrix — world position = `parentPts.matrixWorld · lp` — instead of the
usual `b.p`, so its beacon moves and rotates *with* the galaxy. Its 3D feature
mesh is added as a child of `parentPts`, inheriting that transform automatically.

**Reveal gate.** A child is hidden (beacon `display:none`, feature opacity 0)
until `revealed`. `updateBeacons` skips unrevealed children; the scan controller
flips `revealed` and animates the feature/beacon in. Leaving the galaxy clears
all children's `revealed`. Children are excluded from declutter until revealed.

The only new machinery is the scan controller and the feature renderers.

## The scan mechanic

**Entry.** Reuse the existing fly-to: 🚀 flies the camera to frame the galaxy.
On arrival, alongside the existing "← Back to the Milky Way" button, show a
floating **🔍 Scan this galaxy** button (five languages) — but only for a galaxy
that has child objects. (This avoids reopening the card; the card path is not
used for scanning.)

**Scan animation (top-to-bottom scan line).** On click:
1. A bright horizontal **scan line** (a thin glowing bar, full screen width)
   sweeps from the top of the viewport to the bottom over ~1.8 s (ease-out).
2. Each frame, for every child of the scanned galaxy, project its world position
   to screen. When the scan line's `y` passes a child's screen `y` and it is not
   yet revealed → **reveal** it: its 3D feature fades/pops in and its HTML beacon
   fades in (a short per-object animation).
3. When the line reaches the bottom, it fades out. All children are now revealed.

**After scan.** Revealed child beacons behave like normal beacons: hover/label,
click → the child's five-language photo card (via the existing panel).

**Re-scan.** The 🔍 button stays available; clicking again resets `revealed`
flags and replays the sweep. Deterministic for the pilot (same result each time).

**Exit.** When the camera leaves the galaxy — the "← Back to the Milky Way" fly,
or the camera-to-galaxy distance exceeds a threshold (~6× the galaxy radius) —
hide all child beacons and their features, reset the scan state, and hide the
🔍 button. Re-entering and re-scanning brings them back.

## 3D feature renderers

Each feature is a small object added under the galaxy's `pts` (local frame), so
it co-rotates. All additive-blended, revealed by animating opacity/scale from 0.

- **jet** — a thin blue-white beam: a short line of bright points (or a stretched
  additive sprite) from the nucleus outward along a fixed local direction,
  ~1.4× the galaxy radius, brightest at the base.
- **nebula** — a pink emission glow (additive `GLOW_TEX` sprite, magenta) plus a
  few hot blue point-stars scattered in it.
- **starcloud** — a dense bright blue-white clump of points (a mini gaussian
  cluster of ~150 points) at `lp`.
- **globular** — a compact, near-spherical dense knot of ~200 warm-white points,
  small radius, bright center.
- **supernova** *(future)* — a single bright white point + a faint thin
  expanding ring sprite.

Feature point counts are tiny (hundreds), so they add negligible cost and are
exempt from LOD.

## Data flow

- **Positions (`lp`)** authored by hand in the galaxy's local frame (disc objects
  in the XZ plane at a plausible radius; halo objects like G1 offset in Y).
- **Cards** — reuse the established pipeline: author English, translate to
  简体/繁体/日本語/한국어 via the translation workflow, review pass.
- **Photos** — real Wikimedia Commons images (PD / CC BY), license-checked and
  downloaded via the Commons API, resized, credited in `THIRD-PARTY-NOTICES.md`,
  wired through the existing `img`/`credit` card fields.

## Interaction flow (summary)

```
click galaxy beacon → card → 🚀 fly in
   → camera frames the galaxy; "← Back" and "🔍 Scan" buttons appear
   → 🔍 Scan → scan line sweeps top→bottom, features + child beacons reveal in place
   → click a child beacon → its 5-language photo card
   → orbit to inspect (children co-rotate with the galaxy)
   → ← Back to the Milky Way → children hide, scan resets
```

## Testing

- `assertBeaconInfo()` covers child beacons automatically (they live in
  `BEACONS`). For children the required fields in all five languages are
  `type`, `facts`, `desc`, `catalog`; `distance`/`constellation` are optional
  (the check skips them when `b.child`). Runs from the console, throws on any gap.
- Manual in-browser checks per pilot object: scan reveals it at the right screen
  position; feature renders and co-rotates; card opens with the right photo;
  leaving the galaxy hides it; re-scan re-reveals it.
- No console errors; FPS unchanged (features are hundreds of points).

## Reused vs. new

**Reused:** beacon HTML overlay, `selectBeacon`/`renderPanel`/card panel,
declutter, language switch, fly-to + return-button plumbing, `galaxyLODs`
per-galaxy registry and spin, `GLOW_TEX`, the card `img`/`credit` fields, the
translation + Commons-photo pipeline.

**New:** child-beacon data + projection (through the parent's world matrix), the
scan controller (line sweep + progressive reveal + reset-on-exit), the four
feature renderers, the 🔍 Scan button.
