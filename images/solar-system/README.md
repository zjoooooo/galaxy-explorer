# Solar System texture sources

All files in this directory are browser-delivery assets referenced by
`SOLAR_BODIES[*].maps`; the application does not request a remote texture at
runtime. NASA 3D Resources states that its assets are free to download and use.
NASA SVS states that its content is public domain unless otherwise noted. NASA
material is subject to the [NASA media-usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/).

## Inventory

| Local file | Direct primary source and credit | Source → delivery transformation |
| --- | --- | --- |
| `mercury.jpg` | USGS Astrogeology, [Mercury MESSENGER MDIS DEM Global Color Shaded Relief 2km](https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_dem_global_color_shaded_relief_2km), based on MESSENGER MDIS; access constraints: none | 7664×3832 GeoTIFF → 2048×1024 JPEG. Global equirectangular map. |
| `venus.jpg` | NASA/JPL, [Venus](https://science.nasa.gov/3d-resources/venus/), Magellan radar mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `earth.jpg` | NASA/JPL, [Earth (A)](https://science.nasa.gov/3d-resources/earth-a/) | 1440×720 JPEG → 2048×1024 JPEG. |
| `earth-normal.png` | NASA SVS, [Blue Marble (ID 2915)](https://svs.gsfc.nasa.gov/2915/), whose topographic shading is based on the USGS GTOPO30 elevation model | `bluemarble-2048.png` → 1024×512 RGB tangent-space normal PNG. The normal is derived from the documented topographic-shading source, never from the Earth albedo texture. |
| `earth-night.jpg` | NASA Earth Observatory, [Earth at Night (Black Marble) 2016 Color Maps](https://visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps/144957l), Joshua Stevens using Suomi NPP VIIRS data from Miguel Román, NASA GSFC | 3600×1800 JPEG → 2048×1024 JPEG. |
| `earth-clouds.png` | NASA SVS, [Clouds frame listing](https://svs.gsfc.nasa.gov/vis/a000000/a003800/a003837/frames/2048x1024_2x1_30p/Clouds/); NASA GSFC | 2048×1024 TIFF → 2048×1024 RGBA PNG. RGB is white; processed source luminance is alpha. |
| `moon.jpg` | NASA SVS, [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/), Ernie Wright; LROC camera and LOLA teams | `lroc_color_2k.jpg`, 2048×1024 JPEG copied at native size. Centered at 0° longitude. |
| `moon-normal.png` | NASA SVS, [CGI Moon Kit (LOLA displacement map)](https://svs.gsfc.nasa.gov/4720/), LROC and LOLA teams | `ldem_4_uint.tif`, a 1440×720 unsigned 16-bit LOLA elevation/displacement map (half-metre units), → 1024×512 RGB tangent-space normal PNG. |
| `mars.jpg` | NASA/JPL, [Mars](https://science.nasa.gov/3d-resources/mars/), Viking imagery processed at USGS | 1440×720 JPEG → 2048×1024 JPEG. |
| `mars-normal.png` | USGS Astrogeology, [MGS MOLA Global DEM 463m](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m), Mars Global Surveyor MOLA | Official 1024×501 DEM browse raster → 1024×512 RGB tangent-space normal PNG. The source is an elevation product, not the Mars albedo map. |
| `ceres.jpg` | USGS Astrogeology, [Ceres Dawn FC Global Mosaic 140m](https://astrogeology.usgs.gov/search/map/ceres_dawn_fc_global_mosaic_140m), Dawn FC global mosaic; source page marks it public-domain PDS data | Official 1024×512 browse mosaic copied at native size. Global simple-cylindrical map. |
| `jupiter.jpg` | NASA/JPL, [Jupiter](https://science.nasa.gov/3d-resources/jupiter/), Voyager images | 720×360 JPEG → 2048×1024 JPEG. |
| `io.jpg` | NASA/JPL, [Jupiter – Io (A)](https://science.nasa.gov/3d-resources/jupiter-io-a/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `europa.jpg` | NASA/JPL, [Jupiter – Europa](https://science.nasa.gov/3d-resources/jupiter-europa/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `ganymede.jpg` | NASA/JPL, [Jupiter – Ganymede](https://science.nasa.gov/3d-resources/jupiter-ganymede/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `callisto.jpg` | NASA/JPL, [Jupiter – Callisto](https://science.nasa.gov/3d-resources/jupiter-callisto/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `saturn.jpg` | NASA/JPL, [Saturn](https://science.nasa.gov/3d-resources/saturn/) | 720×360 JPEG → 2048×1024 JPEG. |
| `saturn-rings.png` | NASA/JPL/Space Science Institute, [Panoramic Rings (PIA06175)](https://science.nasa.gov/resource/panoramic-rings/) | A central horizontal radial scanline of the 5890×1000 Cassini panorama is sampled into a centered 1024×1024 annulus. Pixels at radius 220–500 retain sampled RGB and luminance alpha; the center and outside are transparent. This matches `RingGeometry` UVs. |
| `titan.jpg` | NASA/JPL, [Saturn – Titan](https://science.nasa.gov/3d-resources/saturn-titan/) | 720×360 JPEG → 2048×1024 JPEG. |
| `uranus.jpg` | NASA/JPL, [Voyager 2 color observation PIA01391](https://images.nasa.gov/details-PIA01391) | 1024×512 seamless procedural visualization: the documented Voyager color supplies the cyan base; a small latitude-only sinusoid supplies subtle bands. It is not a surface mosaic and no crescent observation is wrapped. |
| `neptune.jpg` | NASA/JPL, [Neptune](https://science.nasa.gov/3d-resources/neptune/), Don Davis & JPL/Caltech | 720×360 JPEG → 2048×1024 JPEG. |
| `triton.jpg` | NASA/JPL, [Neptune – Triton](https://science.nasa.gov/3d-resources/neptune-triton/), USGS/Tammy Becker & JPL/Caltech | 1440×720 JPEG → 2048×1024 JPEG. |
| `pluto.jpg` | NASA/JPL, [Pluto](https://science.nasa.gov/3d-resources/pluto/) | 720×360 JPEG → 2048×1024 JPEG. The source page identifies this as a fictional texture stitched by David Seal from a Pat Rawlings painting; it is retained only with that explicit credit. |

Earth, Moon, and Mars configure the three normal maps above. They are all generated
from documented topography or elevation sources; the other bodies intentionally have
no relief map rather than reinterpreting albedo as terrain.

For each relief map, the builder rescales the elevation/topographic raster to
1024×512 grayscale, takes centered finite differences, normalizes the vector
`(dx, dy, 1)`, and stores the result as lossless RGB PNG. Longitude is treated
cyclically by averaging the first and last normal-map columns after derivation;
latitude is clamped at the poles. The strengths are deliberately modest (Earth
0.020, Moon and Mars 0.035) so the close view reads as relief without becoming
a displaced silhouette.

## Exact conversion commands

Raw downloads were stored outside the repository. The following commands produced
the exceptional local assets; the same `sips` command was applied to each
source-to-delivery resize listed in the table.

```sh
sips -s format jpeg -s formatOptions 85 -z 1024 2048 source.jpg --out target.jpg
sips -s format jpeg -s formatOptions 85 -z 512 1024 ceres_dawn_fc_dlr_global_feb2016_1024.jpg --out ceres.jpg
sips -s format jpeg -s formatOptions 85 -z 1024 2048 Mercury_Messenger_USGS_ClrShade_Global_2km.tif --out mercury.jpg
ffmpeg -f lavfi -i 'color=c=0x80C8D8:s=1024x512:d=1' -vf "geq=r='126+3*sin(12*Y/512)':g='196+5*sin(12*Y/512)':b='210+6*sin(12*Y/512)'" -frames:v 1 uranus.jpg
ffmpeg -f lavfi -i 'color=c=white:s=2048x1024:d=1' -i clouds.0201.tif -filter_complex '[1]scale=2048:1024,format=gray,eq=contrast=1.45:brightness=-0.18[a];[0][a]alphamerge' -frames:v 1 earth-clouds.png
ffmpeg -i PIA06175~orig.jpg -filter_complex "[0]scale=1024:1024,format=rgb24,geq=r='p(sqrt((X-511.5)^2+(Y-511.5)^2),512)':g='p(sqrt((X-511.5)^2+(Y-511.5)^2),512)':b='p(sqrt((X-511.5)^2+(Y-511.5)^2),512)'[rgb];[0]scale=1024:1024,format=gray,geq=lum='if(between(sqrt((X-511.5)^2+(Y-511.5)^2),220,500),p(sqrt((X-511.5)^2+(Y-511.5)^2),512),0)'[a];[rgb][a]alphamerge" -frames:v 1 saturn-rings.png
./images/solar-system/build-relief-maps.sh
```

`build-relief-maps.sh` contains the exact source URLs and FFmpeg expression for
the three lossless normal maps. It writes only `earth-normal.png`,
`moon-normal.png`, and `mars-normal.png` in this directory.

The seam and alpha checks, including quantitative edge statistics, are recorded
in the task report.
