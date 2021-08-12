#!/usr/bin/env osascript -l JavaScript
function run(argv) {
	ObjC.import("stdlib");
	var annotations = argv.join('');

	//prior cleaning
	annotations = annotations.replaceAll("  ", " "); //double spaces
	annotations = annotations.replaceAll("\n\n\n", "\n"); //empty lines
	annotations = annotations.replaceAll("\n\n", "\n"); //empty lines

	//import Alfred variables
	const citekey = $.getenv("citekey");
	const firstPageString = $.getenv("first_page_no");
	const firstPageNo = parseInt(firstPageString) - 1;
	const title = $.getenv("title");

	//remove heading
	annotations = annotations.replace("## Detailed comments\n", "");

	//re-format commented highlights
	annotations = annotations.replace(
		/ \* Page (\d+).*:\n +> +(.*)\n +(.*)\n/gm,
		`- **$3:** "$2" [@ZZZZ, p. $1] \n`
	);
	//re-format free comments
	annotations = annotations.replace(
		/ \* Page (\d+).*:[\n| ]?([^\*>]+)\n/gm,
		"- *$2 [@ZZZZ, p. $1]*\n"
	);

	//insert reference
	annotations = annotations.replaceAll("ZZZZ", citekey);

	//insert correct page numbers based on https://stackoverflow.com/a/32664436
	annotations = annotations.replace(/ p\. (\d+)\]/g, function (match, n) {
		return " p. " + (parseInt(n) + firstPageNo) + "]";
	});

	//merge quotes where the second highlight comment is exactly "c"
	//for quotes that span multiple pages
	annotations = annotations.replace(
		/" \(.*: (\d+)\) ?\n ?- \*\*c:\*\* "(.*\(.*: )(\d+\))/gm,
		" $2$1-$3"
	);

	//merges quotes where the second highlight comment is exactly "j" and puts "[...]" between them for leaving out some stuff
	annotations = annotations.replace(
		/" \(.*: (\d+)\) ?\n ?- \*\*j:\*\* "(.*\(.*: )(\d+\))/gm,
		" [...] $2$1-$3"
	);

	//corrects page number for merged quotes on the same page
	annotations = annotations.replace(/(\d+)-(\1)\)/g, "$1)");

	return annotations;
}
