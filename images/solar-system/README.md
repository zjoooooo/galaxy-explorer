# Solar System texture sources

All files in this directory are browser-delivery assets referenced by
`SOLAR_BODIES[*].maps`; the application does not request a remote texture at
runtime. NASA 3D Resources states that its assets are free to download and use.
NASA SVS states that its content is public domain unless otherwise noted. NASA
material is subject to the [NASA media-usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/).

### USGS and PDS status

The [USGS data-licensing policy](https://www.usgs.gov/data-management/data-licensing)
explains that data prepared by USGS employees are public domain in the United
States and that a data release must identify its applicable license. The source
record, rather than that general policy, controls the wording below: the Mars
MOLA record expressly says **CC0 (public domain)**; the Mercury and Ceres
records instead say **Access Constraints: None** and **Use Constraints: Please
cite authors**. The latter two are therefore not labeled CC0 or public domain
in this inventory. They are credited, source-linked redistributions of
USGS-hosted PDS products under those published access/use terms. The
[PDS overview](https://pds.nasa.gov/) confirms
that archived data are publicly available online and exportable under TSPA;
that availability does not erase a source record's attribution instruction.

## Inventory

| Local file | Direct primary source and credit | Source → delivery transformation |
| --- | --- | --- |
| `mercury.jpg` | USGS Astro Web Maps, [MESSENGER Global Mosaic May 2016](https://www.usgs.gov/tools/astro-web-maps), serving the [MDIS Basemap BDR global mosaic](https://astrogeology.usgs.gov/search/map/mercury_messenger_mdis_global_basemap_bdr_166m); Applied Coherent Technology Corporation, NASA/JHU APL/Arizona State University/Carnegie Science, MESSENGER MDIS NAC/WAC 750-nm reflectance | WMS `GetMap`, 0°–360° simple-cylindrical extent, 2048×1024 JPEG; one-pixel longitude-edge blend. The product record says **Access Constraints: None; Use Constraints: Please cite authors**. |
| `venus.jpg` | NASA/JPL, [Venus](https://science.nasa.gov/3d-resources/venus/), Magellan radar mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `earth.jpg` | NASA/JPL, [Earth (A)](https://science.nasa.gov/3d-resources/earth-a/) | 1440×720 JPEG → 2048×1024 JPEG. |
| `earth-night.jpg` | NASA Earth Observatory, [Earth at Night (Black Marble) 2016 Color Maps](https://visibleearth.nasa.gov/images/144898/earth-at-night-black-marble-2016-color-maps/144957l), Joshua Stevens using Suomi NPP VIIRS data from Miguel Román, NASA GSFC | 3600×1800 JPEG → 2048×1024 JPEG. |
| `earth-clouds.png` | NASA SVS, [Clouds frame listing](https://svs.gsfc.nasa.gov/vis/a000000/a003800/a003837/frames/2048x1024_2x1_30p/Clouds/); NASA GSFC | 2048×1024 TIFF → 2048×1024 RGBA PNG. RGB is white; processed source luminance is alpha. |
| `moon.jpg` | NASA SVS, [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/); visualizer Ernie Wright (USRA), scientist Noah Petro (NASA/GSFC), LROC and LOLA teams | `lroc_color_2k.jpg`, 2048×1024 JPEG copied at native size. Centered at 0° longitude. |
| `moon-normal.png` | NASA SVS, [CGI Moon Kit (LOLA displacement map)](https://svs.gsfc.nasa.gov/4720/); Ernie Wright (USRA), Noah Petro (NASA/GSFC), LOLA team | `ldem_4_uint.tif`, a 1440×720 unsigned 16-bit LOLA elevation/displacement map (half-metre units), → 1024×512 RGB tangent-space normal PNG. |
| `mars.jpg` | NASA/JPL, [Mars](https://science.nasa.gov/3d-resources/mars/), Viking imagery processed at USGS | 1440×720 JPEG → 2048×1024 JPEG. |
| `mars-normal.png` | USGS Astrogeology, [MGS MOLA Global DEM 463m](https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m), MOLA Team and NASA GSFC; **CC0 (public domain)** in source metadata | Official 1024×501 DEM browse raster → 1024×512 RGB tangent-space normal PNG. The source is an elevation product, not the Mars albedo map. |
| `ceres.jpg` | USGS Astrogeology, [Ceres Dawn FC Global Mosaic 140m](https://astrogeology.usgs.gov/search/map/ceres_dawn_fc_global_mosaic_140m), Dawn FC global mosaic | Official 1024×512 browse mosaic copied at native size. Global simple-cylindrical map. Source metadata says **Access Constraints: None; Use Constraints: Please cite authors**. |
| `jupiter.jpg` | NASA/JPL, [Jupiter](https://science.nasa.gov/3d-resources/jupiter/), Voyager images | 720×360 JPEG → 2048×1024 JPEG. |
| `io.jpg` | NASA/JPL, [Jupiter – Io (A)](https://science.nasa.gov/3d-resources/jupiter-io-a/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `europa.jpg` | NASA/JPL, [Jupiter – Europa](https://science.nasa.gov/3d-resources/jupiter-europa/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `ganymede.jpg` | NASA/JPL, [Jupiter – Ganymede](https://science.nasa.gov/3d-resources/jupiter-ganymede/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `callisto.jpg` | NASA/JPL, [Jupiter – Callisto](https://science.nasa.gov/3d-resources/jupiter-callisto/), USGS/Voyager mosaic | 1440×720 JPEG → 2048×1024 JPEG. |
| `saturn.jpg` | NASA/JPL, [Saturn](https://science.nasa.gov/3d-resources/saturn/) | 720×360 JPEG → 2048×1024 JPEG. |
| `saturn-rings.png` | NASA/JPL/Space Science Institute, [Panoramic Rings (PIA06175)](https://science.nasa.gov/resource/panoramic-rings/) | The full central horizontal scanline of the 5890×1000 Cassini panorama is resampled across the 256–512-pixel radial interval used by `RingGeometry(1, 2)`. The center (`r < 256`) is transparent; the texture outside its usable annulus is transparent. |
| `titan.jpg` | NASA/JPL, [Saturn – Titan](https://science.nasa.gov/3d-resources/saturn-titan/) | 720×360 JPEG → 2048×1024 JPEG. |
| `uranus.jpg` | NASA/JPL, [Voyager 2 color observation PIA01391](https://images.nasa.gov/details-PIA01391) | 1024×512 seamless procedural visualization: the documented Voyager color supplies the cyan base; a small latitude-only sinusoid supplies subtle bands. It is not a surface mosaic and no crescent observation is wrapped. |
| `neptune.jpg` | NASA/JPL, [Neptune](https://science.nasa.gov/3d-resources/neptune/), Don Davis & JPL/Caltech | 720×360 JPEG → 2048×1024 JPEG. |
| `triton.jpg` | NASA/JPL, [Neptune – Triton](https://science.nasa.gov/3d-resources/neptune-triton/), USGS/Tammy Becker & JPL/Caltech | 1440×720 JPEG → 2048×1024 JPEG. |
| `pluto.jpg` | NASA/JPL, [Pluto](https://science.nasa.gov/3d-resources/pluto/) | 720×360 JPEG → 2048×1024 JPEG. The source page identifies this as a fictional texture stitched by David Seal from a Pat Rawlings painting; it is retained only with that explicit credit. |

Moon and Mars configure the two normal maps above. Earth has no normal map: the
previous Blue Marble derivative was removed because topographic shading is not a
DEM. The other bodies intentionally have no relief map rather than reinterpreting
albedo as terrain.

For each relief map, the builder rescales the elevation/topographic raster to
1024×512 grayscale, takes centered finite differences, normalizes the vector
`(dx, dy, 1)`, and stores the result as lossless RGB PNG. At the longitude
boundary the derivative samples the opposite edge before normalization
(`x=0` uses columns 1 and 1023; `x=1023` uses columns 0 and 1022); latitude is
clamped at the poles. The 0.035 strength is deliberately modest so the close
view reads as relief without becoming a displaced silhouette.

## Exact conversion commands

Raw downloads were stored outside the repository. The following commands produced
the exceptional local assets; the same `sips` command was applied to each
source-to-delivery resize listed in the table.

```sh
sips -s format jpeg -s formatOptions 85 -z 1024 2048 source.jpg --out target.jpg
sips -s format jpeg -s formatOptions 85 -z 512 1024 ceres_dawn_fc_dlr_global_feb2016_1024.jpg --out ceres.jpg
curl -G --fail 'https://planetarymaps.usgs.gov/cgi-bin/mapserv' --data-urlencode 'map=/maps/mercury/mercury_simp_cyl.map' --data-urlencode 'SERVICE=WMS' --data-urlencode 'VERSION=1.1.1' --data-urlencode 'REQUEST=GetMap' --data-urlencode 'LAYERS=MESSENGER' --data-urlencode 'STYLES=' --data-urlencode 'SRS=EPSG:4326' --data-urlencode 'BBOX=0,-90,360,90' --data-urlencode 'WIDTH=2048' --data-urlencode 'HEIGHT=1024' --data-urlencode 'FORMAT=image/jpeg' --output mercury-wms.jpg
ffmpeg -i mercury-wms.jpg -vf "format=rgb24,geq=r='if(gt(eq(X\,0)+eq(X\,2047)\,0)\,(p(0\,Y)+p(2047\,Y))/2\,p(X\,Y))':g='if(gt(eq(X\,0)+eq(X\,2047)\,0)\,(p(0\,Y)+p(2047\,Y))/2\,p(X\,Y))':b='if(gt(eq(X\,0)+eq(X\,2047)\,0)\,(p(0\,Y)+p(2047\,Y))/2\,p(X\,Y))'" -frames:v 1 -q:v 2 mercury.jpg
ffmpeg -f lavfi -i 'color=c=0x80C8D8:s=1024x512:d=1' -vf "geq=r='126+3*sin(12*Y/512)':g='196+5*sin(12*Y/512)':b='210+6*sin(12*Y/512)'" -frames:v 1 uranus.jpg
ffmpeg -f lavfi -i 'color=c=white:s=2048x1024:d=1' -i clouds.0201.tif -filter_complex '[1]scale=2048:1024,format=gray,eq=contrast=1.45:brightness=-0.18[a];[0][a]alphamerge' -frames:v 1 earth-clouds.png
ffmpeg -i PIA06175~orig.jpg -filter_complex "[0]scale=1024:1024,format=rgb24,geq=r='if(between(sqrt((X-511.5)^2+(Y-511.5)^2)\,256\,512)\,p((sqrt((X-511.5)^2+(Y-511.5)^2)-256)*1023/256\,512)\,0)':g='if(between(sqrt((X-511.5)^2+(Y-511.5)^2)\,256\,512)\,p((sqrt((X-511.5)^2+(Y-511.5)^2)-256)*1023/256\,512)\,0)':b='if(between(sqrt((X-511.5)^2+(Y-511.5)^2)\,256\,512)\,p((sqrt((X-511.5)^2+(Y-511.5)^2)-256)*1023/256\,512)\,0)'[rgb];[0]scale=1024:1024,format=gray,geq=lum='if(between(sqrt((X-511.5)^2+(Y-511.5)^2)\,256\,512)\,p((sqrt((X-511.5)^2+(Y-511.5)^2)-256)*1023/256\,512)\,0)'[a];[rgb][a]alphamerge" -frames:v 1 saturn-rings.png
./images/solar-system/build-relief-maps.sh
```

`build-relief-maps.sh` contains the exact source URLs and FFmpeg expression for
the two lossless normal maps. It writes only `moon-normal.png` and
`mars-normal.png` in this directory.

The seam and alpha checks, including quantitative edge statistics, are recorded
in the task report.
