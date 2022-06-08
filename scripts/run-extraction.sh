#!/bin/zsh
# shellcheck disable=SC2086
export PATH=/usr/local/lib:/usr/local/bin:/opt/homebrew/bin/:$PATH
mkdir -p "$alfred_workflow_cache"

IMAGE_FOLDER="${obsidian_destination/#\~/$HOME}/attachments/image_temp"
mkdir -p "$IMAGE_FOLDER" && cd "$IMAGE_FOLDER" || exit 1

if [[ "$only_recent_annos" = "true" ]]; then
	# uses DATE 23:59
	RECENT_ANNOS="--ignore-before=$(date -v-4d +%F)"
else
	RECENT_ANNOS=""
fi

if which tesseract ; then
	USE_OCR="--attempt-ocr --ocr-lang=$ocr_lang"
else
	USE_OCR=""
fi

# ------------------------------------------------------------------------------
# run extraction
# no double-quotting of $RECENT_ANNOS $USE_OCR, so the options are properly
# as options (with spaces inside them) or as nothing (instead of empty string)
pdfannots2json "$file_path" --image-output-path=./ --image-format="png" \
	$RECENT_ANNOS $USE_OCR \
	> "$alfred_workflow_cache"/temp.json

# ------------------------------------------------------------------------------

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
