#!/bin/zsh
# shellcheck disable=2164,2154
export PATH=/usr/local/lib:/usr/local/bin:/opt/homebrew/bin/:$PATH

#───────────────────────────────────────────────────────────────────────────────
# GUARD CLAUSES & RETRIEVE CITEKEY

function errorMsg() {
	osascript -e "display alert \"$1\" as critical"
}

if [[ ! -f "$bibtex_library_path" ]]; then
	errorMsg "Library file does not exist."
	exit 1
fi

pdf_path=$(osascript "./scripts/get-pdf-path.applescript")
if [[ ! "$pdf_path" == *.pdf ]]; then
	errorMsg "Not a .pdf file."
	exit 1
fi

citekey=$(basename "$pdf_path" .pdf | sed -E 's/_.*//')
entry=$(grep --after-context=20 --max-count=1 --ignore-case "{$citekey," "$bibtex_library_path")
if [[ -z "$entry" ]]; then
	errorMsg "No entry with the citekey $citekey found in library file."
	exit 1
fi

if [[ "$extraction_engine" == "pdfannots" ]] && ! command -v pdfannots; then
	errorMsg "pdfannots not installed."
	exit 1
elif [[ "$extraction_engine" == "pdfannots2json" ]] && ! command -v pdfannots2json; then
	errorMsg "pdfannots2json not installed."
	exit 1
fi

#───────────────────────────────────────────────────────────────────────────────
# EXTRACTION
osascript -e 'display notification "⏳ Running Extraction…" with title "Annotation Extractor"'

if [[ "$extraction_engine" == "pdfannots" ]]; then
	annotations=$(pdfannots --no-group --format=json "$pdf_path")
else
	wd="$PWD"
	IMAGE_FOLDER="${output_path/#\~/$HOME}/attachments/image_temp"
	mkdir -p "$IMAGE_FOLDER" && cd "$IMAGE_FOLDER"

	annotations=$(pdfannots2json "$pdf_path" --image-output-path=./ --image-format="png")

	# IMAGE EXTRACTION
	# shellcheck disable=SC2012
	NUMBER_OF_IMAGES=$(ls | wc -l | tr -d " ")
	[[ $NUMBER_OF_IMAGES -eq 0 ]] && exit 0 # abort if no images

	# HACK: fix zero-padding for low page numbers by giving all images 4 digits
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
	cd "$wd"
fi

#───────────────────────────────────────────────────────────────────────────────

# PROCESS ANNOTATIONS
osascript -l JavaScript "./scripts/process_annotations.js" "$citekey" "$annotations" "$entry" "$output_path" "$extraction_engine"
