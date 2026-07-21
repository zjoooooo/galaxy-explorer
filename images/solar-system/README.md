# Solar System texture sources

This directory contains the browser-delivery texture set referenced by
`SOLAR_BODIES[*].maps` in `index.html`. Every file is local: the application
does not fetch a texture from a remote host at runtime.

## Rights and redistribution

The NASA 3D Resources hub says: “All of these assets are free to download and
use.” Its [media-usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/)
states that NASA content is generally not protected by U.S. copyright, except
where a particular item says otherwise. The sources below are NASA, NASA/JPL,
NASA/GSFC, NASA SVS, NASA Visible Earth, or NASA Image and Video Library
records; no third-party texture-pack mirror was used. The SVS source carries
the more explicit statement: “All of our content is in the public domain
(unless otherwise noted).” Source-page credits are retained below.

## Source inventory and local files

| Local files | Source page and original material | Agency / creator | Delivery transformation |
| --- | --- | --- | --- |
| `venus.jpg` | [Venus](https://science.nasa.gov/3d-resources/venus/) — `Venus.jpg`, Magellan radar mosaic | NASA/JPL Solar System Simulator; JPL/Caltech generated maps | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `earth.jpg` | [Earth (A)](https://science.nasa.gov/3d-resources/earth-a/) — `Earth (A).jpg`, USGS land/ocean map | NASA/JPL Solar System Simulator | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `earth-night.jpg` | [Earth at Night (Black Marble) 2016 Color Maps](https://visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps/144957l) — `BlackMarble_2016_01deg.jpg` | NASA Earth Observatory; Joshua Stevens using Suomi NPP VIIRS data from Miguel Román, NASA GSFC | Resampled 3600×1800 JPEG to 2048×1024 JPEG (quality 85). |
| `earth-clouds.png` | [Clouds frame listing](https://svs.gsfc.nasa.gov/vis/a000000/a003800/a003837/frames/2048x1024_2x1_30p/Clouds/) — `clouds.0201.tif` | NASA SVS / NASA GSFC | Kept the 2048×1024 grid; converted TIFF to RGBA PNG and used its luminance as opacity. |
| `earth-normal.jpg` | Derived from `earth.jpg` | NASA/JPL source above | 2048×1024 RGB normal approximation generated from adjacent-pixel luminance gradients; no new imagery. |
| `moon.jpg` | [Moon – Lunar Color](https://science.nasa.gov/3d-resources/moon-lunar-color/) — `Moon - Lunar Color.jpg` | NASA/JPL Solar System Simulator; LRO/LOLA and mission imagery as credited by the source | Resampled the source texture to 2048×1024 JPEG (quality 85). |
| `moon-normal.jpg` | Derived from `moon.jpg` | NASA/JPL source above | 2048×1024 RGB normal approximation generated from adjacent-pixel luminance gradients. |
| `mars.jpg` | [Mars](https://science.nasa.gov/3d-resources/mars/) — `Mars.jpg`, Viking imagery processed at USGS | NASA/JPL Solar System Simulator; USGS / JPL-Caltech | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `mars-normal.jpg`, `mars-bump.jpg` | Derived from `mars.jpg` | NASA/JPL / USGS source above | Normal: adjacent-pixel luminance gradients; bump: contrast-adjusted grayscale luminance. Both 2048×1024 JPEG. |
| `mercury.jpg`, `mercury-bump.jpg` | [Mercury’s True Color is in the Eye of the Beholder](https://images.nasa.gov/details-PIA11364) — `PIA11364~orig.jpg` | NASA/JHUAPL/Carnegie Institution of Washington, MESSENGER | Observation converted to 2048×1024 JPEG as a documented source fallback; bump derived as contrast-adjusted grayscale luminance. A future equirectangular replacement can use the USGS [MESSENGER global mosaic](https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_global_mosaic_250m), which is public domain but too large for this delivery set. |
| `ceres.jpg`, `ceres-bump.jpg` | [Ceres Cratered Landscape](https://images.nasa.gov/details-PIA20383) — `PIA20383~orig.jpg` | NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, Dawn | Observation converted to 2048×1024 JPEG as a documented source fallback; bump derived as contrast-adjusted grayscale luminance. The authoritative USGS [Ceres Dawn FC Global Mosaic 140m](https://astrogeology.usgs.gov/search/map/ceres_dawn_fc_global_mosaic_140m) is public-domain PDS data but 214 MB. |
| `jupiter.jpg` | [Jupiter](https://science.nasa.gov/3d-resources/jupiter/) — `Jupiter.jpg`, Voyager images | NASA/JPL Solar System Simulator; JPL & Caltech | Resampled 720×360 JPEG to 2048×1024 JPEG (quality 85). |
| `io.jpg` | [Jupiter – Io (A)](https://science.nasa.gov/3d-resources/jupiter-io-a/) — `Jupiter - Io (A).jpg`, Voyager mosaic | NASA/JPL Solar System Simulator; USGS / JPL-Caltech | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `europa.jpg` | [Jupiter – Europa](https://science.nasa.gov/3d-resources/jupiter-europa/) — `Jupiter - Europa.jpg`, Voyager mosaic | NASA/JPL Solar System Simulator; USGS / JPL-Caltech | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `ganymede.jpg` | [Jupiter – Ganymede](https://science.nasa.gov/3d-resources/jupiter-ganymede/) — `Jupiter - Ganymede.jpg`, Voyager mosaic | NASA/JPL Solar System Simulator; USGS / JPL-Caltech | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `callisto.jpg` | [Jupiter – Callisto](https://science.nasa.gov/3d-resources/jupiter-callisto/) — `Jupiter - Callisto.jpg`, USGS/Voyager mosaic | NASA/JPL Solar System Simulator; USGS / JPL-Caltech | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `saturn.jpg` | [Saturn](https://science.nasa.gov/3d-resources/saturn/) — `Saturn.jpg` | NASA/JPL Solar System Simulator; JPL/Caltech | Resampled 720×360 JPEG to 2048×1024 JPEG (quality 85). |
| `saturn-rings.png` | [Panoramic Rings](https://science.nasa.gov/resource/panoramic-rings/) — `PIA06175~orig.jpg` | NASA/JPL/Space Science Institute, Cassini | Resampled 5890×1000 panorama to 2048×1024; converted to RGBA PNG with source luminance as opacity. The application maps it only onto ring geometry. |
| `titan.jpg` | [Saturn – Titan](https://science.nasa.gov/3d-resources/saturn-titan/) — `Saturn - Titan.jpg` | NASA/JPL Solar System Simulator; JPL/Caltech | Resampled 720×360 JPEG to 2048×1024 JPEG (quality 85). |
| `uranus.jpg` | [Uranus](https://images.nasa.gov/details-PIA01391) — `PIA01391~orig.jpg`, Voyager 2 color observation | NASA/JPL | Observation converted to 2048×1024 JPEG as a documented source fallback; the map has no external runtime dependency. |
| `neptune.jpg` | [Neptune](https://science.nasa.gov/3d-resources/neptune/) — `Neptune.jpg` | NASA/JPL Solar System Simulator; Don Davis & JPL/Caltech | Resampled 720×360 JPEG to 2048×1024 JPEG (quality 85). |
| `triton.jpg` | [Neptune – Triton](https://science.nasa.gov/3d-resources/neptune-triton/) — `Neptune - Triton.jpg`, limited Voyager imagery mosaic | NASA/JPL Solar System Simulator; USGS/Tammy Becker & JPL/Caltech | Resampled 1440×720 JPEG to 2048×1024 JPEG (quality 85). |
| `pluto.jpg`, `pluto-normal.jpg` | [Pluto](https://science.nasa.gov/3d-resources/pluto/) — `Pluto.jpg` | NASA/JPL Solar System Simulator; David Seal & JPL/Caltech | Albedo resampled 720×360 to 2048×1024 JPEG (quality 85); normal derived from adjacent-pixel luminance gradients. |

## Reproducible normalization

The original downloads were saved outside the repository and transformed with
macOS `sips` and FFmpeg. Opaque maps use JPEG; alpha-bearing cloud and ring
maps use PNG. This is the essential command pattern (the concrete source URLs
are identified above):

```sh
sips -s format jpeg -s formatOptions 85 -z 1024 2048 source.jpg --out target.jpg
ffmpeg -i source.tif -filter_complex \
  '[0]scale=2048:1024,format=rgb24[base];[0]scale=2048:1024,format=gray[alpha];[base][alpha]alphamerge' \
  -frames:v 1 target.png
ffmpeg -i albedo.jpg -vf "geq=r='128+32*(p(X+1,Y)-p(X-1,Y))':g='128+32*(p(X,Y+1)-p(X,Y-1))':b='255'" \
  -frames:v 1 normal.jpg
```

All 27 delivery files decode as 2048×1024 images. JPEGs are opaque; both PNGs
are RGBA. The 2:1 equirectangular sources were visually checked at their seam
after resizing. The three observation-derived fallback maps are explicitly
called out above so that a future higher-fidelity global-map update is
straightforward and preserves provenance.
