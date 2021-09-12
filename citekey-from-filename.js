#!/usr/bin/env osascript -l JavaScript

function run(argv) {
	const filepath = argv.join("");

	//assumes that the file was named "citekey_[...].pdf"
	return filepath.replace(/.*\/(.*?)_.*\.pdf/, "$1");;
}
