#!/bin/zsh
pdf_folder=~`echo -n $pdf_location | sed -e "s/^~//"`
citekey="$*"

pdf_path=`find "$pdf_folder" -name "$citekey*" | head -n 1`
if [[ "$pdf_path" != "" ]] ; then
	open "$pdf_path"
else
	citekey=`echo "$citekey" | sed -E 's/([[:alpha:]]+)([[:digit:]]{4})/\1_\2/'`
	pdf_path=`find "$pdf_folder" -name "$citekey*" | head -n 1`
	if [[ "$pdf_path" != "" ]] ; then
		open -R "$pdf_path"
	else
		echo -n "$*"
	fi
fi