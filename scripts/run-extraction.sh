#!/bin/zsh
# shellcheck disable=SC2086
export PATH=/usr/local/lib:/usr/local/bin:/opt/homebrew/bin/:$PATH
[[ ! -e "$alfred_workflow_cache" ]] && mkdir -p "$alfred_workflow_cache"

#-------------------------------------------------------------------------------
# PDFANNOTS
if [[ "$extraction_engine" == "pdfannots" ]]; then
	pdfannots --no-group --format=json "$filepath"
	exit 0
fi

#-------------------------------------------------------------------------------
# PDFANNOTS2JSON

IMAGE_FOLDER="${obsidian_destination/#\~/$HOME}/attachments/image_temp"
mkdir -p "$IMAGE_FOLDER" && cd "$IMAGE_FOLDER" || exit 1

pdfannots2json "$filepath" --image-output-path=./ --image-format="png"

# IMAGE EXTRACTION
# shellcheck disable=SC2012
NUMBER_OF_IMAGES=$(ls | wc -l | tr -d " ")
[[ $NUMBER_OF_IMAGES -eq 0 ]] && exit 0 # abort if no images

# HACK: fix zero-padding for low page numbers, all images get 4 digits.
# see https://github.com/mgmeyers/pdfannots2json/issues/16
for image in *; do
	leftPadded=$(echo "$image" | sed -E 's/-([[:digit:]])-/-000\1-/' | sed -E 's/-([[:digit:]][[:digit:]])-/-00\1-/' | sed -E 's/-([[:digit:]][[:digit:]][[:digit:]])-/-0\1-/')
	mv "$image" "$leftPadded"
done

# rename for workflow
i=1
for image in *; do
	mv -f "$image" ../"${citekey}_image${i}.png"
	i=$((i + 1))
done

rmdir "$IMAGE_FOLDER" # remove temp folder
