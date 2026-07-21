#!/bin/sh
set -eu

asset_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/solar-relief.XXXXXX")
trap 'rm -rf "$work_dir"' EXIT HUP INT TERM

curl -L --fail -A 'Mozilla/5.0' -o "$work_dir/earth-topo.png" \
  https://svs.gsfc.nasa.gov/vis/a000000/a002900/a002915/bluemarble-2048.png
curl -L --fail -A 'Mozilla/5.0' -o "$work_dir/moon-ldem.tif" \
  https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_4_uint.tif
curl -L --fail -A 'Mozilla/5.0' -o "$work_dir/mars-mola.jpg" \
  https://astrogeology.usgs.gov/ckan/dataset/83c20dbd-e2b3-4e5b-b019-f13d4fdffa38/resource/57f84b24-d56c-42dd-a34d-cf9d61a82d2c/download/mars_mgs_mola_dem_mosaic_global_1024.jpg

normal_from_elevation() {
  source_image=$1
  strength=$2
  output_image=$3
  temporary_image="$output_image.tmp.png"
  filter="scale=1024:512,format=gray,geq=r='128+127*(${strength}*(p(X+1\\,Y)-p(X-1\\,Y)))/sqrt(1+pow(${strength}*(p(X+1\\,Y)-p(X-1\\,Y))\\,2)+pow(${strength}*(p(X\\,Y+1)-p(X\\,Y-1))\\,2))':g='128+127*(${strength}*(p(X\\,Y+1)-p(X\\,Y-1)))/sqrt(1+pow(${strength}*(p(X+1\\,Y)-p(X-1\\,Y))\\,2)+pow(${strength}*(p(X\\,Y+1)-p(X\\,Y-1))\\,2))':b='128+127/sqrt(1+pow(${strength}*(p(X+1\\,Y)-p(X-1\\,Y))\\,2)+pow(${strength}*(p(X\\,Y+1)-p(X\\,Y-1))\\,2))'"
  seam_filter="format=rgb24,geq=r='if(gt(eq(X\\,0)+eq(X\\,1023)\\,0)\\,(p(0\\,Y)+p(1023\\,Y))/2\\,p(X\\,Y))':g='if(gt(eq(X\\,0)+eq(X\\,1023)\\,0)\\,(p(0\\,Y)+p(1023\\,Y))/2\\,p(X\\,Y))':b='if(gt(eq(X\\,0)+eq(X\\,1023)\\,0)\\,(p(0\\,Y)+p(1023\\,Y))/2\\,p(X\\,Y))'"
  ffmpeg -hide_banner -loglevel error -y -i "$source_image" -vf "$filter" -frames:v 1 "$temporary_image"
  ffmpeg -hide_banner -loglevel error -y -i "$temporary_image" -vf "$seam_filter" -frames:v 1 "$output_image"
  rm -f "$temporary_image"
}

normal_from_elevation "$work_dir/earth-topo.png" 0.020 "$asset_dir/earth-normal.png"
normal_from_elevation "$work_dir/moon-ldem.tif" 0.035 "$asset_dir/moon-normal.png"
normal_from_elevation "$work_dir/mars-mola.jpg" 0.035 "$asset_dir/mars-normal.png"
