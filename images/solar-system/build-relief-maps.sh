#!/bin/sh
set -eu

asset_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
work_dir=$(mktemp -d "${TMPDIR:-/tmp}/solar-relief.XXXXXX")
trap 'rm -rf "$work_dir"' EXIT HUP INT TERM

curl -L --fail -A 'Mozilla/5.0' -o "$work_dir/moon-ldem.tif" \
  https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_4_uint.tif
curl -L --fail -A 'Mozilla/5.0' -o "$work_dir/mars-mola.jpg" \
  https://astrogeology.usgs.gov/ckan/dataset/83c20dbd-e2b3-4e5b-b019-f13d4fdffa38/resource/57f84b24-d56c-42dd-a34d-cf9d61a82d2c/download/mars_mgs_mola_dem_mosaic_global_1024.jpg

normal_from_elevation() {
  source_image=$1
  strength=$2
  output_image=$3
  dx="if(eq(X\\,0)\\,p(1\\,Y)-p(1023\\,Y)\\,if(eq(X\\,1023)\\,p(0\\,Y)-p(1022\\,Y)\\,p(X+1\\,Y)-p(X-1\\,Y)))"
  dy="if(eq(Y\\,0)\\,p(X\\,1)-p(X\\,0)\\,if(eq(Y\\,511)\\,p(X\\,511)-p(X\\,510)\\,p(X\\,Y+1)-p(X\\,Y-1)))"
  filter="scale=1024:512,format=gray,geq=r='128+127*(${strength}*(${dx}))/sqrt(1+pow(${strength}*(${dx})\\,2)+pow(${strength}*(${dy})\\,2))':g='128+127*(${strength}*(${dy}))/sqrt(1+pow(${strength}*(${dx})\\,2)+pow(${strength}*(${dy})\\,2))':b='128+127/sqrt(1+pow(${strength}*(${dx})\\,2)+pow(${strength}*(${dy})\\,2))'"
  ffmpeg -hide_banner -loglevel error -y -i "$source_image" -vf "$filter" -frames:v 1 "$output_image"
}

normal_from_elevation "$work_dir/moon-ldem.tif" 0.035 "$asset_dir/moon-normal.png"
normal_from_elevation "$work_dir/mars-mola.jpg" 0.035 "$asset_dir/mars-normal.png"
