#!/bin/zsh
# shellcheck disable=SC2154
export PATH=/usr/local/lib:/usr/local/bin:/opt/homebrew/bin/:$PATH
mkdir -p "$alfred_workflow_cache"

# pdfannots
if [[ "$extractor_cli" == "pdfannots" ]]; then
	python3 -c "import pdfminer"
	pdfannots "$file_path" --format json > "$alfred_workflow_cache"/temp.json
	exit 0
fi

# pdf-annots2json
IMAGE_FOLDER="${obsidian_destination/#\~/$HOME}"/attachments

pdf-annots2json "$file_path" \
	--image-output-path="$IMAGE_FOLDER/image_temp" \
	--image-format="png" \
	--image-base-name="image" \
	> "$alfred_workflow_cache"/temp.json

# move images properly renamed up
if [[ "$citekey_insertion" == "none" ]] ; then
	filename=$(date '+%Y-%m-%d')
else
	filename="$citekey"
fi

cd "$IMAGE_FOLDER/image_temp" || exit 1

# abort if no images
# shellcheck disable=SC2012
NUMBER_OF_IMAGES=$(ls | wc -l | tr -d " ")
[[ $NUMBER_OF_IMAGES == 0 ]] && exit 0

# rename & move images
for image in *; do
	clean_name="$(echo "$image" | cut -d- -f-2 | tr -d "-").png"
	mv "$image" ../"${filename}_$clean_name"
done

# remove temp folder
rm "$IMAGE_FOLDER/image_temp"
