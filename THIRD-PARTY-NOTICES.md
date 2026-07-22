# Third-Party Notices

This project bundles third-party software under `vendor/`. Their copyright and
license notices are reproduced below. The project itself is under the
[MIT License](LICENSE).

## Solar-system textures (`images/solar-system/`)

Local delivery textures come from three source families: [Solar System Scope
textures](https://www.solarsystemscope.com/textures/) (CC BY 4.0, based on NASA
imagery and elevation data — the Sun, major planets, the Moon, and Earth
day/night/cloud maps), and NASA or USGS source records for the remaining
bodies. NASA 3D Resources describes its assets as free to download and use;
NASA SVS material is public domain unless otherwise noted. For USGS products,
the [USGS data-licensing policy](https://www.usgs.gov/data-management/data-licensing)
and each product record determine status: Mars MOLA is explicitly CC0; Mercury
and Ceres are credited under their exact **Access Constraints: None; Use
Constraints: Please cite authors** terms and are not labeled CC0 or public
domain. Processing details and the per-file inventory are in
[`images/solar-system/README.md`](images/solar-system/README.md).

| Local files | Exact source page | Agency / creator | Status and local transformation |
| --- | --- | --- | --- |
| `sun.jpg`, `mercury.jpg`, `venus.jpg`, `earth.jpg`, `earth-night.jpg`, `earth-clouds.png`, `moon.jpg`, `mars.jpg`, `jupiter.jpg`, `saturn.jpg`, `uranus.jpg`, `neptune.jpg` | [Solar System Scope textures](https://www.solarsystemscope.com/textures/) | Solar System Scope, based on NASA imagery and elevation data | **CC BY 4.0**; downsampled deliveries (4096×2048 or 2048×1024) as inventoried in `images/solar-system/README.md`; `earth-clouds.png` stores source luminance as alpha. |
| `pluto.jpg` | [Pluto](https://science.nasa.gov/3d-resources/pluto/) | NASA/JPL Solar System Simulator | Free to download and use; the source page identifies this as a fictional texture stitched by David Seal from a Pat Rawlings painting — retained only with that credit. |
| `moon-normal.png` | [CGI Moon Kit (LOLA displacement map)](https://svs.gsfc.nasa.gov/4720/) | NASA SVS; Ernie Wright (USRA), Noah Petro (NASA/GSFC), LOLA team | Public domain unless noted; 1024×512 lossless tangent-space normal generated from `ldem_4_uint.tif`, a LOLA elevation/displacement map. |
| `mars-normal.png` | [MGS MOLA Global DEM 463m](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m) | MOLA Team, NASA GSFC, USGS Astrogeology | Source metadata explicitly says **CC0 (public domain)**; official DEM browse raster transformed into a 1024×512 lossless tangent-space normal. |
| `ceres.jpg` | [Ceres Dawn FC Global Mosaic 140m](https://astrogeology.usgs.gov/search/map/ceres_dawn_fc_global_mosaic_140m) | USGS Astrogeology; NASA/JPL-Caltech/UCLA/MPS/DLR/IDA Dawn | Native 1024×512 official browse mosaic. Source terms: **Access Constraints: None; Use Constraints: Please cite authors**. |
| `io.jpg`, `europa.jpg`, `ganymede.jpg`, `callisto.jpg` | [Io](https://science.nasa.gov/3d-resources/jupiter-io-a/), [Europa](https://science.nasa.gov/3d-resources/jupiter-europa/), [Ganymede](https://science.nasa.gov/3d-resources/jupiter-ganymede/), [Callisto](https://science.nasa.gov/3d-resources/jupiter-callisto/) | NASA/JPL Solar System Simulator; USGS/Voyager mosaics | Free to download and use; local JPEG resamples documented in the inventory. |
| `saturn-rings.png` | [Panoramic Rings (PIA06175)](https://science.nasa.gov/resource/panoramic-rings/) | NASA/JPL/Space Science Institute, Cassini | NASA material; full central scanline remapped across the 256–512-pixel annulus sampled by `RingGeometry(1, 2)`, with transparent center/outside. |
| `titan.jpg`, `triton.jpg` | [Titan](https://science.nasa.gov/3d-resources/saturn-titan/), [Triton](https://science.nasa.gov/3d-resources/neptune-triton/) | NASA/JPL Solar System Simulator; Triton credit USGS/Tammy Becker & JPL/Caltech | Free to download and use; local JPEG resamples documented in the inventory. |

---

## three.js (r128) and example modules

Bundled under `vendor/`.

Copyright © 2010-2021 three.js authors

Distributed under the MIT License:

```
The MIT License

Copyright © 2010-2021 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See https://github.com/mrdoob/three.js for the full source and details.

## Beacon card images (`images/`)

Real observation photographs shown in the beacon info cards, sourced from
Wikimedia Commons. NASA imagery is public domain; CC BY 4.0 items are
credited as required by the license.

- `images/solar-system-family.jpg` — CactiStaccingCrane (composite of NASA mission imagery) · CC BY-SA 4.0 · [source](https://commons.wikimedia.org/wiki/File:Solar_System_true_color_(captions).jpg)
- `images/sgr-a.jpg` — EHT Collaboration · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:EHT_Saggitarius_A_black_hole.tif)
- `images/orion-nebula.jpg` — NASA, ESA, M. Robberto (STScI/ESA) and the Hubble Space Telescope Orion Treasury Project Team · Public domain · [source](https://commons.wikimedia.org/wiki/File:Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg)
- `images/crab-nebula.jpg` — NASA, ESA, J. Hester and A. Loll (Arizona State University) — Hubble · Public domain · [source](https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg)
- `images/eagle-nebula.jpg` — NASA, ESA, CSA, STScI; image processing: J. DePasquale, A. Koekemoer, A. Pagan (STScI) — JWST · Public domain · [source](https://commons.wikimedia.org/wiki/File:Pillars_of_Creation_(NIRCam_Image).jpg)
- `images/carina-nebula.jpg` — NASA, ESA, CSA, STScI — JWST NIRCam · Public domain · [source](https://commons.wikimedia.org/wiki/File:NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs,_Glittering_Landscape_of_Star_Birth.jpg)
- `images/cygnus-x1.jpg` — NASA/CXC — Chandra X-ray Observatory · Public domain · [source](https://commons.wikimedia.org/wiki/File:Chandra_image_of_Cygnus_X-1.jpg)
- `images/pleiades.jpg` — NASA, ESA, AURA/Caltech, Palomar Observatory · Public domain · [source](https://commons.wikimedia.org/wiki/File:Pleiades_large.jpg)
- `images/omega-centauri.jpg` — NASA, ESA, J. Anderson and R. van der Marel (STScI) — Hubble WFC3 · Public domain · [source](https://commons.wikimedia.org/wiki/File:Omega_Centauri_-_WFC3_(2010-28-2764).jpg)
- `images/betelgeuse.jpg` — ALMA (ESO/NAOJ/NRAO)/E. O'Gorman/P. Kervella · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Betelgeuse_captured_by_ALMA.jpg)
- `images/veil-nebula.jpg` — ESA/Hubble & NASA, Z. Levay — Hubble · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Return_to_the_Veil_Nebula.jpg)
- `images/lagoon-nebula.jpg` — NASA, ESA, STScI — Hubble · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Hubble%27s_28th_birthday_picture_The_Lagoon_Nebula.jpg)
- `images/hercules-cluster.jpg` — NASA, ESA, and the Hubble Heritage Team (STScI/AURA) — Hubble · Public domain · [source](https://commons.wikimedia.org/wiki/File:Hubble_image_of_globular_cluster_M13_(opo0840a).jpg)
- `images/sirius.jpg` — NASA, ESA, H. Bond (STScI), M. Barstow (Univ. of Leicester) — Hubble · Public domain · [source](https://commons.wikimedia.org/wiki/File:The_Dog_Star,_Sirius,_and_its_Tiny_Companion_(2005-36-1820).jpg)
- `images/antares.jpg` — ESO/K. Ohnaka — VLTI · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:VLTI_reconstructed_view_of_the_surface_of_Antares.jpg)

## Zodiac card images (`images/zodiac-*.jpg`)

Wide-field constellation photographs shown in the zodiac cards,
sourced from Wikimedia Commons.

- `images/zodiac-aries.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Aries_produced_by_NOIRLab,_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(aries).jpg)
- `images/zodiac-taurus.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Taurus_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(taurus).jpg)
- `images/zodiac-gemini.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Gemini_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(gemini).jpg)
- `images/zodiac-cancer.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Cancer_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(cancer).jpg)
- `images/zodiac-leo.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Leo_(leoh).jpg)
- `images/zodiac-virgo.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Virgo_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(virgo).jpg)
- `images/zodiac-libra.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Libra_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(libra).jpg)
- `images/zodiac-scorpius.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Scorpius_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(scorpius).jpg)
- `images/zodiac-sagittarius.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Sagittarius_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(sagittarius).jpg)
- `images/zodiac-capricornus.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Capricornus_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(capricornus).jpg)
- `images/zodiac-aquarius.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Aquarius_produced_by_NOIRLab,_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(aquarius).jpg)
- `images/zodiac-pisces.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Pisces_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(pisces).jpg)

### More beacon images (teaching expansion)

- `images/ring-nebula.jpg` — NASA, ESA, and C. Robert O'Dell (Vanderbilt University) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Hubble_image_of_the_Ring_Nebula_(Messier_57).jpg)
- `images/helix-nebula.jpg` — NASA, ESA, and C.R. O'Dell (Vanderbilt University); CTIO data by C.R. O'Dell and L.M. Frattare · Public domain · [source](https://commons.wikimedia.org/wiki/File:NGC7293_(2004).jpg)
- `images/horsehead-nebula.jpg` — NASA/ESA/Hubble Heritage Team · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Hubble_Sees_a_Horsehead_of_a_Different_Color.jpg)
- `images/m15.jpg` — ESA/Hubble & NASA · Public domain · [source](https://commons.wikimedia.org/wiki/File:Messier_15_HST.jpg)
- `images/m5.jpg` — ESA/Hubble & NASA · Public domain · [source](https://commons.wikimedia.org/wiki/File:Messier_5_-_HST.jpg)
- `images/m22.jpg` — ESA/Hubble & NASA · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:The_crammed_centre_of_Messier_22.jpg)
- `images/polaris.jpg` — Benedikt Markus · CC BY-SA 4.0 · [source](https://commons.wikimedia.org/wiki/File:Circumpolar_star_trails_and_ISS_transit_over_the_Teide_volcano,_Tenerife,_Spain.jpg)
- `images/proxima.jpg` — ESA/Hubble & NASA · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:New_shot_of_Proxima_Centauri,_our_nearest_neighbour.jpg)
- `images/uy-scuti.jpg` — ESO/Digitized Sky Survey 2 · CC BY-SA 3.0 · [source](https://commons.wikimedia.org/wiki/File:UY_Scuti_zoomed_in,_DSS2_survey,_2003.png)
- `images/trappist1.jpg` — Artist’s impression: NASA, ESA, and G. Bacon (STScI) · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Artist%27s_view_of_planets_transiting_red_dwarf_star_in_TRAPPIST-1_system.jpg)

### Constellation card images (`images/cons-*.jpg`)

Wide-field photographs of the 13 constellations beyond the zodiac, from the same
Eckhard Slawik / NOIRLab series as the zodiac cards (Wikimedia Commons).

- `images/cons-ursa-major.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Ursa_Major_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(ursa-major).jpg)
- `images/cons-orion.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Orion_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(orion).jpg)
- `images/cons-cassiopeia.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Cassiopeia_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(cassiopeia).jpg)
- `images/cons-crux.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Crux_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(crux).jpg)
- `images/cons-cygnus.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Cygnus_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(cygnus).jpg)
- `images/cons-lyra.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Lyra_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(lyra).jpg)
- `images/cons-ursa-minor.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Ursa_Minor_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(ursa-minor).jpg)
- `images/cons-canis-major.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Canis_Major_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(canis-major).jpg)
- `images/cons-andromeda.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Andromeda_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(andromeda).jpg)
- `images/cons-triangulum.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Triangulum_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(triangulum).jpg)
- `images/cons-centaurus.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Centaurus_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(centaurus).jpg)
- `images/cons-dorado.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Dorado_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(dorado).jpg)
- `images/cons-tucana.jpg` — E. Slawik/NOIRLab/NSF/AURA/M. Zamani · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Photo_of_the_constellation_Tucana_produced_by_NOIRLab_in_collaboration_with_Eckhard_Slawik,_a_German_astrophotographer_(tucana).jpg)

### External galaxy images

- `images/andromeda.jpg` — Adam Evans · CC BY 2.0 · [source](https://commons.wikimedia.org/wiki/File%3AAndromeda_Galaxy_%28with_h-alpha%29.jpg)
- `images/m33.jpg` — Local Group Survey Team and T. A. Rector (U. Alaska Anchorage), NOAO/AURA/NSF · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Panorama_of_Spiral_Galaxy%2C_M33_%28noao-m33lgs_ubvIha%29.jpg)
- `images/m104.jpg` — NASA/ESA and The Hubble Heritage Team (STScI/AURA) · Public domain · [source](https://commons.wikimedia.org/wiki/File:M104_ngc4594_sombrero_galaxy_hi-res.jpg)
- `images/m87.jpg` — Event Horizon Telescope Collaboration · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Black_hole_-_Messier_87.jpg)
- `images/cen-a.jpg` — ESO · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Centaurus_A_%28NGC_5128%29_%28eso0315a%29.jpg)
- `images/lmc.jpg` — CTIO/NOIRLab/NSF/AURA/SMASH/D. Nidever (Montana State University) · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Deepest%2C_widest_view_of_the_Large_Magellanic_Cloud_from_SMASH.jpg)
- `images/smc.jpg` — ESA/Hubble and Digitized Sky Survey 2 · Public domain · [source](https://commons.wikimedia.org/wiki/File:Small_Magellanic_Cloud_%28ground-based_image%29_%28heic0603d%29.jpg)

### In-galaxy object images

- `images/ngc206.jpg` — T. A. Rector and A. Strom (University of Alaska Anchorage)/WIYN/NOIRLab/NSF/AURA · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Star_forming_region,_NGC_206_%28noao-ngc206%29.jpg)
- `images/g1.jpg` — Judy Schmidt (reprocessed Hubble/WFPC2 data) · CC BY 2.0 · [source](https://commons.wikimedia.org/wiki/File:Mayall_II_%28HST-Judy_Schmidt-JPG%29.jpg)
- `images/cena-jet.jpg` — X-ray: NASA/CXC/CfA/R. Kraft et al.; Submillimetre: MPIfR/ESO/APEX/A. Weiss et al.; Optical: ESO/WFI · Public domain · [source](https://commons.wikimedia.org/wiki/File:Centaurus_A-_Black_Hole_Outflows_From_Centaurus_A_%282009-cena_-_cena_lg%29.jpg)
- `images/cena-sfr.jpg` — NASA/ESA Hubble (Caldwell 77) · CC BY 2.0 · [source](https://commons.wikimedia.org/wiki/File:Caldwell_77.jpg)
- `images/ngc604.jpg` — NASA and The Hubble Heritage Team (AURA/STScI) · Public domain · [source](https://commons.wikimedia.org/wiki/File:NGC_604_in_Messier_33_%28full_mosaic,_captured_by_the_Hubble_Space_Telescope%29.jpg)
- `images/m87-jet.jpg` — NASA and The Hubble Heritage Team (STScI/AURA) · Public domain · [source](https://commons.wikimedia.org/wiki/File:M87_jet.jpg)
- `images/tarantula.jpg` — ESA/Hubble & NASA, C. Murray, E. Sabbi · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:Tarantula_Nebula_Hubble_combi.jpg)
- `images/sn1987a.jpg` — ESA/Hubble & NASA · CC BY 4.0 · [source](https://commons.wikimedia.org/wiki/File:SN_1987A_HST.jpg)
- `images/ngc346.jpg` — NASA, ESA and A. Nota (STScI/ESA) · Public domain · [source](https://commons.wikimedia.org/wiki/File:NGC_346_in_Small_magellanic_cloud.jpg)

### Solar-system body card photos

All 18 card photos come from one source family: NASA mission photography, via Wikimedia Commons. All are in the public domain (NASA).

- `images/solar-system/cards/sun.jpg` — NASA/SDO (AIA) · Public domain · [source](https://commons.wikimedia.org/wiki/File:The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg)
- `images/solar-system/cards/mercury.jpg` — NASA/Johns Hopkins University APL/Carnegie Institution of Washington (MESSENGER) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Mercury_in_color_-_Prockter07-edit1.jpg)
- `images/solar-system/cards/venus.jpg` — NASA (Mariner 10, processed) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Venus-real_color.jpg)
- `images/solar-system/cards/earth.jpg` — NASA/Apollo 17 crew · Public domain · [source](https://commons.wikimedia.org/wiki/File:The_Earth_seen_from_Apollo_17.jpg)
- `images/solar-system/cards/moon.jpg` — NASA/GSFC/Arizona State University (LRO) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Moon_nearside_LRO.jpg)
- `images/solar-system/cards/mars.jpg` — NASA/JPL-Caltech/USGS (Viking mosaic) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Mars_Valles_Marineris.jpeg)
- `images/solar-system/cards/ceres.jpg` — NASA/JPL-Caltech/UCLA/MPS/DLR/IDA (Dawn) · Public domain · [source](https://commons.wikimedia.org/wiki/File:PIA19562-Ceres-DwarfPlanet-Dawn-RC3-image19-20150506.jpg)
- `images/solar-system/cards/jupiter.jpg` — NASA/JPL/Space Science Institute (Cassini) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Portrait_of_Jupiter_from_Cassini.jpg)
- `images/solar-system/cards/io.jpg` — NASA/JPL/University of Arizona (Galileo) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Io_highest_resolution_true_color.jpg)
- `images/solar-system/cards/europa.jpg` — NASA/JPL/DLR (Galileo) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Europa-moon-with-margins.jpg)
- `images/solar-system/cards/ganymede.jpg` — NASA/JPL (Galileo) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Ganymede_g1_true-edit1.jpg)
- `images/solar-system/cards/callisto.jpg` — NASA/JPL/DLR (Galileo) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Callisto.jpg)
- `images/solar-system/cards/saturn.jpg` — NASA/JPL/Space Science Institute (Cassini) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Saturn_during_Equinox.jpg)
- `images/solar-system/cards/titan.jpg` — NASA/JPL-Caltech/Space Science Institute (Cassini) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Titan_in_true_color.jpg)
- `images/solar-system/cards/uranus.jpg` — NASA/JPL-Caltech (Voyager 2) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Uranus2.jpg)
- `images/solar-system/cards/neptune.jpg` — NASA (Voyager 2) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Neptune_Full.jpg)
- `images/solar-system/cards/triton.jpg` — NASA/JPL/USGS (Voyager 2) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Triton_moon_mosaic_Voyager_2_%28large%29.jpg)
- `images/solar-system/cards/pluto.jpg` — NASA/JHU APL/SwRI (New Horizons) · Public domain · [source](https://commons.wikimedia.org/wiki/File:Pluto_in_True_Color_-_High-Res.jpg)
