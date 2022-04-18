#!/bin/zsh

if [[ $(uname -p) == "arm" ]]; then
	PROCESSOR="M1"
else
	PROCESSOR="Intel"
fi

curl -OL "https://github.com/mgmeyers/pdf-annots2json/releases/latest/download/pdf-annots2json.Mac.$PROCESSOR.tar.gz"
tar -xjf pdf-annots2json.Mac.M1.tar.gz || exit 1
rm -f pdf-annots2json.Mac.M1.tar.gz
mv -f -v pdf-annots2json /usr/local/bin/
pdf-annots2json --version
