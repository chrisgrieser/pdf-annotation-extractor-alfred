#!/bin/zsh
# shellcheck disable=SC2086
export PATH=/usr/local/lib:/usr/local/bin:/opt/homebrew/bin/:$PATH
[[ ! -e "$alfred_workflow_cache" ]] && mkdir -p "$alfred_workflow_cache"

#-------------------------------------------------------------------------------

if [[ "$extraction_engine" == "pdfannots" ]]; then
	pdfannots --no-group --format=json "$file_path" | tee "$alfred_workflow_cache/temp.json"
	exit 0
fi

#-------------------------------------------------------------------------------

IMAGE_FOLDER="${obsidian_destination/#\~/$HOME}/attachments/image_temp"
mkdir -p "$IMAGE_FOLDER" && cd "$IMAGE_FOLDER" || exit 1

# run extraction
if [[ "$only_recent_annos" = "true" ]]; then
	RECENT_DATE="$(date -v-4d +%F)" # --ignore-before uses DATE 23:59
	pdfannots2json "$file_path" --image-output-path=./ --image-format="png" --ignore-before="$RECENT_DATE" | tee "$alfred_workflow_cache/temp.json"
else
	pdfannots2json "$file_path" --image-output-path=./ --image-format="png" | tee "$alfred_workflow_cache/temp.json"
fi

# image extraction
if [[ "$citekey_insertion" = "no_bibliography_extraction" ]] ; then
	IMAGE_BASE_NAME=$(date '+%Y-%m-%d_%H-%M')_annotations
else
	IMAGE_BASE_NAME="$citekey"
fi

# abort if no images
# shellcheck disable=SC2012
NUMBER_OF_IMAGES=$(ls | wc -l | tr -d " ")
[[ $NUMBER_OF_IMAGES == 0 ]] && exit 0

# rename & move images
i=1
for image in *; do
	mv "$image" ../"${IMAGE_BASE_NAME}_image$i.png"
	i=$((i + 1))
done

# remove temp folder
rmdir "$IMAGE_FOLDER"
