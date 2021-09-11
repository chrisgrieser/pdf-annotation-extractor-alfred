#!/usr/bin/env osascript -l JavaScript

function run(argv) {
	const filepath = argv.join("");

	//assumes that the file was named "citekey_[...].pdf"
	//extracts based on the assumption that the citekey contains years
	//first "_" after a year is the one that matters
	const citekey = filepath.replace(/.*\/(.*)_.*\.pdf/, "$1");

	return citekey;
}
