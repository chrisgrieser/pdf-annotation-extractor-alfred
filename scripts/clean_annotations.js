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
		// re-format free comments
		.replace(
			/ \* Page #?(\d+).*?:[\n| ]?([^\*>]+)(?=\n)/gm,
			"- *$2 [" + pandoc_cite + "p. $1]*"
		)
		// re-format commented highlights; lookahead ensures recognition of multi-line-comments
		// in face of another highlight, document-end, or an already reformated free comment
		.replace(
			/ \* Page #?(\d+).*?:\n +> +(.*?)\n (.*?)(?=\n-|\n \*|\n$)/gs,
			'- __$3:__ "$2" [' + pandoc_cite + 'p. $1]'
		)
		// reformat multi-line-highlights properly
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

	// "## " (free comments & highlights)
	// make into heading
	annotations = annotations
		.replace(/- \*(#+) (.*?)\[.*?]\*/g, "\n$1 $2") // free comments
		.replace(/- __(#+) ?:__ "(.*?)".*?\]/g, "\n$1 $2"); //highlights

	// "---" (free comments) becomes hr line
	annotations = annotations
		.replace(/- \*--- ?\[.*?]\*/g, "\n---\n"); // free comments

	// "?" (free comments)
	//make h6 & move up top (i.e., Pseudo-Admonitions)
	let introRE = new RegExp(/- \*\? ?(.*?)\[.*?]\*/, 'g');
	let intros = annotations.match(introRE);
	if (intros != null) {
		intros = intros.map (item => item.replace(introRE,"###### $1"));
		annotations = annotations
			.replace(introRE, "ZZZZ")
			.replaceAll("\nZZZZ","");
		annotations = intros.join("\n") + "\n\n" + annotations;
	}

	//"X " (free comments & highlights)
	//make to do item & move up
	let new_tasks = [];

	//free comments
	let tasksRE = new RegExp(/- \*X ?(.*?)\[.*?]\*/, 'gi');
	let tasks_fc = annotations.match(tasksRE);
	if (tasks_fc != null) {
		tasks_fc = tasks_fc.map (item => item.replace(tasksRE,"- [ ] $1"));
		annotations = annotations
			.replace(tasksRE, "ZZZZ")
			.replaceAll("\nZZZZ","");
		new_tasks.push(...tasks_fc);
	}
	//highlights
	tasksRE = new RegExp(/- __X ?:__ "(.*?)".*?\]/, 'gi');
	let tasks_hl = annotations.match(tasksRE);
	if (tasks_hl != null) {
		tasks_hl = tasks_hl.map (item => item.replace(tasksRE,'- [ ] "$1"'));
		annotations = annotations
			.replace(tasksRE, "ZZZZ")
			.replaceAll("\nZZZZ","");
		new_tasks.push(...tasks_hl);
	}

	//merge into task section
	if (new_tasks.length != 0){
		annotations =
			new_tasks.join("\n") + "\n"
			+ "\n---\n"
			+ annotations;
	}

	//"!1 " (free comment)
	// Insert 1st (2nd,...) image and gives it the rest of the comment as label
	//Obsidian: inserts `![[]]`, else: inserts numbered marker
	let imageRE = new RegExp (/- \*!(\d+) ?(.*?) ?\[.*\*/, "g");
	if ($.getenv("output_style") == "obsidian"){
		let filename;
		if (hasBibtexEntry) filename = $.getenv("citekey");
		else filename = (new Date()).toISOString().slice(0,10);

		annotations = annotations.replace(imageRE, "\n![[" + filename + "_image$1.png|$2]]\n");
	} else {
		annotations = annotations.replace(imageRE, "\n==((Image $1))==\n*$2*\n");
	}

	// "=" (free comments & highlights)
	//becomes a keyword (tag in the yaml)
	let new_keywords = [];

	//free comments
	let keywordRE = new RegExp(/- \*= ?(.*?)\[.*?]\*/, 'g');
	let keyword_fc = annotations.match(keywordRE);
	if (keyword_fc != null) {
		keyword_fc = keyword_fc.map (item => item.replace(keywordRE,"$1"));
		annotations = annotations
			.replace(keywordRE, "ZZZZ")
			.replaceAll("\nZZZZ","");
		new_keywords.push(...keyword_fc);
	}
	//highlights
	keywordRE = new RegExp(/- __= ?:__ "(.*?)".*?\]/, 'g');
	let keyword_hl = annotations.match(keywordRE);
	if (keyword_hl != null) {
		keyword_hl = keyword_hl.map (item => item.replace(keywordRE,"$1"));
		annotations = annotations
			.replace(keywordRE, "ZZZZ")
			.replaceAll("\nZZZZ","");
		new_keywords.push(...keyword_hl);
	}
	let new_value = "";
	if (new_keywords.length != 0){
		new_keywords =
			[... new Set (new_keywords)] //unique only
			.map (kw => kw.trim().replaceAll(" ","-"));
		new_value = $.getenv("keywords") + ", " + new_keywords.join(", ");
	} else {
		new_value = $.getenv("keywords");
	}
	// Variablenname für tags muss gewechselt werden, weil Alfred
	// sich sonst weigert diese zu überschreiben...
	Application('com.runningwithcrayons.Alfred').setConfiguration
 	('tags', {
		toValue: new_value,
		inWorkflow: $.getenv('alfred_workflow_bundleid'),
		exportable: false}
	);


	//fix for Annotations beginning with `#tags` (e.g. Annotation Tags)
	annotations = annotations
		.replace(/__(#\w+):__/g,"$1") //annotations-tag only (highlight)
		.replace(/__(#\w+)\b */g,"$1 __") //annotation-tag followed by text (highlight)
		.replace(/\*(#\w+)\b */g,"$1 *"); //annotation-tag followed by text (free comment)
	
	return annotations;
}
