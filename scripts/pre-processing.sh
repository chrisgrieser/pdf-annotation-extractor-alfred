#!/usr/bin/env zsh

if [[ ! -f "$bibtex_library_path" ]] ; then
	echo -n "Error: \"$bibtex_library_path\" does not exist."
	exit 1
fi

pdf_path=$(osascript "./scripts/get-pdf-path.applescript")
if [[ ! "$pdf_path" == *.pdf ]]; then
	echo -n "Error: \"$pdf_path\" is not a .pdf file."
	exit 1
fi

citekey=$(basename "$pdf_path" .pdf | sed -E 's/_.*//')
entry=$(grep --after-context=20 --max-count=1 --ignore-case "{$citekey," "$bibtex_library_path")
if [[ -z "$entry" ]] ; then
	echo -n "Error: No entry with the citekey \"$citekey\" not found in library file."
	exit 1
fi

# ;; used as variable delimiter by Alfred splitter
echo -n "$citekey;;$pdf_path"
