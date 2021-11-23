#!/usr/bin/env osascript -l JavaScript
function run(argv) {
	ObjC.import("stdlib");
	let annotations = argv.join('');

	//prior cleaning
	annotations = annotations
		.replace(/ {2,}/g, " ") //multiple spaces
		.replace(/\n{2,}/g, "\n") //empty lines
		.replaceAll('"',"'")
		.replaceAll('„',"'")
		.replaceAll('...',"…")
		.replaceAll('. . .',"…")
		.replace("## Detailed comments\n", ""); //remove heading

	//import Alfred variables
	let pandoc_cite;
	const firstPageNo = parseInt($.getenv("first_page_no")) - 1;
	const hasBibtexEntry = $.getenv("citekey_insertion") != "no_bibliography_extraction";

	if (hasBibtexEntry) pandoc_cite = "@" + $.getenv("citekey") + ", ";
	else pandoc_cite = "";

	// reformat pdfannots' output & insert proper numbers
	annotations = annotations
		//re-format commented underlines; lookahead ensures recognition of multi-line-comments in face of
		//another underline, document-end, or an already reformated free comment
		.replace(
			/ \* Page (\d+).*?:\n +> +(.*?)\n (.*?)(?=\n-|\n \*|\n$)/gs,
			'- __$3:__ "$2" [' + pandoc_cite + 'p. $1]'
		)
		//reformat multi-line-highlights properly
		.replace(
			/- __[^"]*\n[^"]*:__/gm,
			function (ml){
				let output = "";
				let lines = ml.slice(4,-3).split("\n");
				lines.forEach(line =>{
					output += "- __" + line.trim() + "__\n";
				});
				return output + "-";
			}
		)
		//insert correct page numbers based on https://stackoverflow.com/a/32664436
		.replace(
		   /p\. (\d+)(?=\])/g,
		   function (match, n) {
				return "p. " + (parseInt(n) + firstPageNo);
			}
		);

		// SPECIAL ANNOTATION CODES

		// "+" and "++" (highlights)
		// merge quotes with preceding quote
		annotations = annotations
			//"+": highlights on one page
			.replace(
				/" \[.*p\. (\d+)\]\n- __\+:__ "(.*?)" \[.*p\. /g,
				" (…)" + ' $2" [' + pandoc_cite + 'p. $1-'
			)
			//"++": highlights spanning two page
			.replace(
				/" \[.*p\. (\d+)\]\n- __\+\+:__ "(.*?)" \[.*p\. /g,
				' $2" [' + pandoc_cite + 'p. $1-'
			)
			//corrects page number for quotes merged on the same page
			.replace(/p\. (\d+)-(\1)\]/g, "p. $1]");

}
