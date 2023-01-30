#!/usr/bin/env zsh

pdf_path=$(osascript "./scripts/get-pdf-path.applescript")
if [[ ! "$pdf_path" == *.pdf ]]; then
	osascript -e "\"display notification \"\" with title \"$pdf_path is not a .pdf file.\""
	exit 1	
fi

metadata=$(osascript -l JavaScript "./scripts/read-bibtex-library.js" "$pdf_path")
if [[ "$metadata" == Error:* ]]; then
	osascript -e "\"display notification \"\" with title \"$pdf_path is not a .pdf file.\""
	exit 1	
fi
echo -n "$metadata"
