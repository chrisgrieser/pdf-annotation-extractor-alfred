#!/bin/zsh
export PATH=/usr/local/bin:$PATH

doi="no DOI"
hasDoiURL=`pdfgrep --count --ignore-case --page-range=1-3 --regexp='https?://[[:graph:]]*doi.org[[:graph:]]*' $file_path`
if [[ $hasDoiURL > 0 ]]
then
    doi=`pdfgrep --only-matching --ignore-case --page-range=1-3 --regexp="https?://[[:graph:]]*doi.org[[:graph:]]*" $file_path | head -n 1`
fi

hasDOI=`pdfgrep --count --ignore-case --page-range=1-3 --regexp='DOI:? *[[:graph:]]*' $file_path`
if [[ $hasDOI > 0 ]]
then
    doiNumber=`pdfgrep --only-match --ignore-case --page-range=1-3 --regexp="DOI:? *[[:graph:]]*" $file_path | head -n 1`
    doi=`sed -E 's/doi:? */https:\/\/doi.org\//gi' <<< $doiNumber`
fi

if [[ $doi == "no DOI" ]]
then
    echo -n "no DOI"
else
    curl --silent -LH "Accept: application/x-bibtex" $doi | grep "pages" | cut -d "{" -f 2 | cut -d "-" -f 1
fi