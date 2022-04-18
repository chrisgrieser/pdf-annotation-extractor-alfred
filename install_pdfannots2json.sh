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

curl -OL "https://github.com/mgmeyers/pdf-annots2json/releases/latest/download/pdf-annots2json.Mac.$PROCESSOR.tar.gz"
tar -xjf pdf-annots2json.Mac.M1.tar.gz || exit 1
rm -f pdf-annots2json.Mac.M1.tar.gz
sudo mv -f -v pdf-annots2json /usr/local/bin/
pdf-annots2json --version
