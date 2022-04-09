sudo -v
curl -OL "https://github.com/mgmeyers/pdf-annots2json/releases/latest/download/pdf-annots2json.Mac.M1.tar.gz"
tar -xjf pdf-annots2json.Mac.M1.tar.gz || exit 1
rm pdf-annots2json.Mac.M1.tar.gz
sudo mv -f -v pdf-annots2json /usr/local/bin/
pdf-annots2json --help
