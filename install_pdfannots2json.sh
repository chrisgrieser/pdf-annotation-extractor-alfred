#!/bin/bash

# --------------------------

# run this by copypasting this into the terminal. (you will need to enter your password afterwards)
# sudo /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/chrisgrieser/pdf-annotation-extractor-alfred/main/install_pdfannots2json.sh)"

# --------------------------

if [[ $(uname -p) == "arm" ]]; then
	PROCESSOR="M1"
else
	PROCESSOR="Intel"
fi

DL_FILENAME="pdfannots2json.Mac.$PROCESSOR.tar.gz"

curl -OL "https://github.com/mgmeyers/pdf-annots2json/releases/latest/download/$DL_FILENAME"
tar -xjf "$DL_FILENAME" || exit 1
rm -f "$DL_FILENAME"
sudo mv -f -v pdfannots2json /usr/local/bin/
pdfannots2json --version
