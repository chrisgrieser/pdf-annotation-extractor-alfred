#!/bin/zsh
# shellcheck disable=SC2154
export PATH=/usr/local/lib:/usr/local/bin:/opt/homebrew/bin/:$PATH
mkdir -p "$alfred_workflow_cache"

IMAGE_FOLDER="${obsidian_destination/#\~/$HOME}/attachments/image_temp"
mkdir -p "$IMAGE_FOLDER" && cd "$IMAGE_FOLDER" || exit 1

# also ocr images when tesseract installed
if which tesseract ; then
	pdf-annots2json "$file_path" \
		--image-output-path=./ \
		--image-format="png" \
		--attempt-ocr \
		--ocr-lang="$ocr_lang" \
		> "$alfred_workflow_cache"/temp.json
else
	pdf-annots2json "$file_path" \
		--image-output-path=./ \
		--image-format="png" \
		> "$alfred_workflow_cache"/temp.json
fi

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
