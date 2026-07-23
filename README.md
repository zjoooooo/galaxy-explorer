**English** | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

# Galaxy Explorer 🌌
Demo Page
https://zjoooooo.github.io/galaxy-explorer/

<img width="1920" height="945" alt="Image_2026-07-04_141404_478" src="https://github.com/user-attachments/assets/ce6388f3-5854-4c13-9d6c-daccac89bf24" />

Latest View
<img width="3006" height="1706" alt="image" src="https://github.com/user-attachments/assets/3553f380-a4df-4853-be31-d21faaa4c24d" />


An interactive, procedurally-generated **Milky Way galaxy** — with a full 3D
**Solar System**, roaming **comets**, and real **radio-galaxy jets** — that runs
entirely in the browser with WebGL (three.js). No backend, no build step, no
dependencies to install, no API keys — just open the page and explore.

The galaxy itself is generated in code at load time: **no image assets** — the
spiral arms, nebula gas, star clusters, distant galaxies and supernovae are all
math. The Solar System layers real NASA-based surface textures on top for the
planets, moons and Sun.

**Free for any use** — personal, commercial, academic and teaching — under the
[MIT License](LICENSE).


## ✨ Features

- **Spiral disc** — ~85,000 dust points on four density-wave arms, with a warm
  core fading to cool blue arms, bright star knots, HII regions and blue clusters.
- **Volumetric-looking nebula** — a continuous fBm + Worley noise shader field
  (domain-warped spiral, dust lanes, glowing cores) that wraps the arms in gas.
- **Galactic bulge** — a smooth multi-scale glow core that slowly "breathes".
- **Deep-field sky** — a twinkling star field plus ~170 tiny distant galaxies
  (ellipticals, spirals, edge-on disks, irregulars), a rich galaxy cluster, and
  one large Andromeda-style neighbour — all in just two draw calls.
- **Physically-modelled ambient events** — occasional shooting stars, meteor
  showers, and supernovae that follow a real light curve (t².³ rise → rounded
  peak → two-slope fade) with a four-pointed diffraction-spike flash.
- **Interactive beacons** — ~30 clickable markers (the Solar System, Sagittarius
  A*, famous nebulae, clusters, stars and black holes) open detailed five-language
  info cards with a glowing 3D ring on the selected object. Fly close to an
  external galaxy and its own **in-galaxy objects** appear — star-forming regions,
  globular clusters, supernova remnants, and radio jets, each with its own card.
- **Radio-galaxy jets** — **Centaurus A** fires two needle-thin plasma beams
  (blue north, violet south) that flow, ripple and surge like living streams,
  each ending in a giant churning **radio lobe** — the anatomy radio telescopes
  see. **M87** keeps its famous *one-sided* jet, because its counter-jet is
  Doppler-dimmed into invisibility.
- **Solar System guide** — follow the **Solar System** beacon and ride a
  six-second **wormhole** into a full 3D Solar System: the Sun, all eight
  planets, the Moon, Ceres, Pluto and seven more famous moons, wrapped in real
  NASA-based imagery (4K for the main worlds) and lit by a single sunlight
  source at the Sun. Click any world for its illustrated five-language card,
  then hit **Fly to this world** to sweep over and *ride along* with the
  orbiting planet while its moons appear. A **living Sun** shows drifting
  granulation, migrating sunspots, and prominences that pour out and disperse;
  a true-span **asteroid belt** with the Kirkwood gap, a **Kuiper belt**, faint
  rings on the giants, and translucent limb **atmospheres** complete the scene.
  Two **comets** roam eccentric orbits, unfurling the classic twin tails — a
  straight blue ion tail and a curved white dust tail — near the Sun; click one
  to read how they work, or **chase** it. Orbital and axial motion are
  intentionally slowed for observation; display scale and starting positions
  are arranged for readability, not a literal scale model or real-time ephemeris.
- **Constellation sky view** — from Earth's card, drop through an
  atmosphere-white flash into an Earth-centred, rotatable star dome with **25
  constellations** (the 12 zodiac plus 13 famous others) drawn from real J2000
  star positions, and the **7 external galaxies** sitting inside their true host
  constellations — each with its own five-language photo card.
- **Five languages** — labels, cards and navigation switch between English,
  Simplified Chinese, Traditional Chinese, Japanese and Korean (top-right
  selector; choice remembered).
- **Cinematic look** — selective bloom + ACES tone-mapping.
- **Performance-aware** — an FPS watchdog automatically reduces dust density on
  weak GPUs so it stays smooth on laptops, TVs and kiosks.

## 🎯 Where you can use it

- **Learning & teaching** — a compact, readable, single-file example of WebGL,
  three.js, GLSL shaders, procedural generation, particle systems and noise
  (fBm/Worley). Great for astronomy, computer-graphics and creative-coding
  classes. Every subsystem is self-contained and commented.
- **Backgrounds & screensavers** — an ambient galaxy for a landing page hero,
  a desktop/second-monitor background, or an idle screen.
- **Digital signage & installations** — lobby screens, museum/planetarium
  displays, event backdrops. Runs full-screen (press `F` for cinema mode).
- **A starting point** — fork it and build your own space visualization, data
  viz on a galactic canvas, game background, or art project.

## 🚀 Install & run

**No installation.** Just get the files and serve them over HTTP (browsers block
some features like audio and textures on the `file://` protocol).

```sh
# 1. get the code
git clone https://github.com/zjoooooo/galaxy-explorer.git
cd galaxy-explorer

# 2. serve it with any static server, e.g.:
python -m http.server 8000
#   or:  npx serve .
#   or:  php -S localhost:8000

# 3. open http://localhost:8000/
```

**Deploy anywhere static:** GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3,
nginx, or any web host. Just upload the folder — there is nothing to build.

## 🎮 Controls

| Control | Effect |
|---|---|
| **drag** | orbit the camera |
| **scroll / pinch** | zoom in / out |
| **click a beacon, body or comet** | open its card; selecting a body leaves the camera and motion unchanged |
| **Fly to this world / Chase this comet** | (on the card) sweep over and ride along with the moving object |
| **Back** | return one level: sky → Earth → Solar overview → galaxy |
| **`Esc`** | staged return: close a card, then leave the current Solar level, then the Solar System |
| **`F`** | cinema mode — hide all UI |
| **`M`** | background music on / mute (optional, see below) |

**URL parameters**

- `?fx=1` — demo mode: forces a shooting star / meteor shower / supernova every
  4 s so you can see the ambient effects immediately.
- `?tune=1` — live sliders for the nebula-glow shader; tweak the look in real
  time and copy the values into the tunables when you like them.

## 🎛️ Customise

Open `index.html` and edit the **tunables** block near the top of the `<script>`:

```js
var BLOOM = { strength: 0.08, radius: 0.32, threshold: 0.42 }; // glow
var DUST  = { count: 85000, radius: 360, arms: 4, tight: 0.85, brightness: 0.5, ... };
var GALAXY_SPIN = 0.013; // rotation speed (radians/sec)
```

- `DUST.count` — total star/dust budget (lower it for weaker hardware).
- `DUST.arms` / `DUST.tight` — number of spiral arms and how tightly they wind.
- `BLOOM.strength` — overall glow (0 = off).
- `GALAXY_SPIN` — how fast the whole galaxy rotates.

## 🎵 Background music

Three ambient tracks ship in `audio/` and **autoplay on load** (with a
first-gesture fallback for browsers that block autoplay). Use the speaker button
(bottom-right) or press `M` to mute / unmute; hover it to pick a track by name.
Tracks loop.

To change the music, drop your own `.mp3` files in `audio/` and list their file
names in `MUSIC_TRACKS` inside `index.html`:

```js
var MUSIC_TRACKS = ['ambient 1.mp3', 'ambient 2.mp3'];
```

Leave `MUSIC_TRACKS` empty to hide the speaker button entirely.
**Please don't commit copyrighted audio you don't have the rights to share.**

## 🛠️ How it works (in brief)

Vanilla JavaScript + three.js r128 (vendored under `vendor/`). One self-contained
`index.html`. The galaxy is built once at load:

1. Dust points are scattered on density-wave spiral arms (a `Points` cloud).
2. A flat plane in the disc plane runs a fragment shader that computes fBm +
   Worley cloud noise modulated by the spiral for the nebula gas.
3. Sprite glows form the bulge; a twinkling far-sphere is the background sky.
4. A procedural texture atlas + billboarded quad batch draws the distant galaxies.
5. Post-processing: `UnrealBloomPass` for glow, then an ACES tone-map pass.

Ambient effects (meteors, supernovae) are short-lived objects that spawn on a
schedule and dispose themselves — zero steady per-frame cost when idle.

The Solar System is a second scene, entered through the wormhole transition. Its
planets are lit by a single point light at the Sun and textured with bundled
NASA / Solar System Scope maps (loaded on first entry). Comets, jets, prominences
and tails are particle systems written into preallocated buffers each frame.

## 🤝 Contributing

Contributions, forks and ideas are very welcome! This is a friendly project meant
to be learned from and built on.

- **Found a bug or have an idea?** Open an
  [issue](https://github.com/zjoooooo/galaxy-explorer/issues).
- **Want to add something?** Fork the repo, make your change, and open a pull
  request. Some ideas: new ambient effects, more galaxy morphologies, a settings
  panel, VR/mobile support, colour themes, or performance improvements.
- **Keep it dependency-free and single-file** where you can — that's what makes it
  easy to learn from and drop into any project.
- Test your change by serving the folder and opening it in a browser; there is no
  build or test suite to run.

By contributing you agree that your contributions are licensed under the MIT
License.

## 📄 License

[MIT](LICENSE) — free for any use, including commercial and educational.
Attribution is appreciated but not required.

three.js and its example modules (bundled under `vendor/`) are © the three.js
authors, also under the MIT License.
