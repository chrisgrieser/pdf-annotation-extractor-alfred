#!/bin/zsh
# shellcheck disable=SC2086
export PATH=/usr/local/lib:/usr/local/bin:/opt/homebrew/bin/:$PATH
[[ ! -e "$alfred_workflow_cache" ]] && mkdir -p "$alfred_workflow_cache"

#-------------------------------------------------------------------------------
# PDFANNOTS
if [[ "$extraction_engine" == "pdfannots" ]]; then
	pdfannots --no-group --format=json "$file_path" | tee "$alfred_workflow_cache/temp.json"
	exit 0
fi

#-------------------------------------------------------------------------------
# PDFANNOTS2JSON
IMAGE_FOLDER="${obsidian_destination/#\~/$HOME}/attachments/image_temp"
mkdir -p "$IMAGE_FOLDER" && cd "$IMAGE_FOLDER" || exit 1

# RUN EXTRACTION
if [[ "$only_recent_annos" == "1" ]]; then
	RECENT_DATE="$(date -v-4d +%F)" # --ignore-before uses DATE 23:59
	pdfannots2json "$file_path" --image-output-path=./ --image-format="png" --ignore-before="$RECENT_DATE" | tee "$alfred_workflow_cache/temp.json"
else
	pdfannots2json "$file_path" --image-output-path=./ --image-format="png" | tee "$alfred_workflow_cache/temp.json"
fi

# IMAGE EXTRACTION
# shellcheck disable=SC2012
NUMBER_OF_IMAGES=$(ls | wc -l | tr -d " ")
[[ $NUMBER_OF_IMAGES -eq 0 ]] && exit 0 # abort if no images

# rename & move images
# TODO: the image order is sometimes not correctly preserved
i=1
for image in *; do
	cp "$image" ../"${citekey}_image${i}.png"
	i=$((i + 1))
done

rmdir "$IMAGE_FOLDER" # remove temp folder
