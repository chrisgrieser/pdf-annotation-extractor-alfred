#!/usr/bin/env osascript -l JavaScript

function run() {
	ObjC.import("stdlib");
	app = Application.currentApplication();
	app.includeStandardAdditions = true;
	const homepath = app.pathTo("home folder");

	//import variables
	const citekey = $.getenv("citekey");
	const bibtex_library_path = $.getenv("bibtex_library_path").replace(/^~/, homepath);

	//read bibtex-entry
	let bibtex_entry = app.doShellScript(
		'cat "' + bibtex_library_path + '"' + '| '
		+ '{ grep -E -i -A 15 "' + "{" + citekey + ',$"' + '|| true; }'
	);

	if (bibtex_entry == "") {
		let citekey_insertion = $.getenv("citekey_insertion");
		let error_msg = "No citekey found.\n\n";
		if (citekey_insertion == "filename")	error_msg += "Make sure your file is named correctly:\n'[citekey]_[...].pdf'" ;
		if (citekey_insertion == "manually")	error_msg += "Check your BibTeX Library for the correct citekey." ;
		return error_msg;
	}

	//workaround to avoid the need for pcregrep (uses grep -A15 from before)
	bibtex_entry = "@" + bibtex_entry.split("@")[1];

	// BibTeX-Decoding
	const german_chars = [
		'{\\"u};ü',
		'{\\"a};ä',
		'{\\"o};ö',
		'{\\"U};Ü',
		'{\\"A};Ä',
		'{\\"O};Ö',
		'\\"u;ü',
		'\\"a;ä',
		'\\"o;ö',
		'\\"U;Ü',
		'\\"A;Ä',
		'\\"O;Ö',
		"\\ss;ß",
		"{\\ss};ß",
	];
	const other_chars = [
		"{\\~n};ñ",
		"{\\'a};á",
		"{\\'e};é",
		"{\\v c};č",
		"\\c{c};ç",
		"\\o{};ø",
		"\\^{i};î",
		'\\"{i};î',
		'\\"{i};ï',
		"{\\'c};ć",
		'\\"e;ë',
	];
	const special_chars = [
		"\\&;&",
		'``;"',
		"`;'",
		"\\textendash{};—",
		"---;—",
		"--;—",
	];
	const decode_pair = [...german_chars, ...other_chars, ...special_chars];
	decode_pair.forEach((pair) => {
		let half = pair.split(";");
		bibtex_entry = bibtex_entry.replaceAll(half[0], half[1]);
	});

	//extracts content of a BibTeX-field
	function extract(str) {
		str = str.split(" = ")[1];
		return str.replace(/,$/, "");
	}

	//parse BibTeX entry
	let title = "";
	let ptype = "";
	let firstPage = "";
	let author = "";
	let year = "";
	let keywords = "";
	let url = "";

	let array = bibtex_entry.split("\r");
	array.forEach(property => {

		if (property.match(/\stitle \=/i) != null) title = extract(property);
		if (property.includes("@")) ptype = property.replace(/@(.*)\{.*/, "$1");
		if (property.includes("pages =")) firstPage = property.match(/\d+/)[0];
		if (property.includes("author =")) author = extract(property);
		if (property.includes("year =")) year = property.match(/\d{4}/)[0];
		else if (property.includes("date ="))	year = property.match(/\d{4}/)[0];
		if (property.includes("keywords =")) keywords = extract(property)
			.replaceAll(" ", "-")
			.replaceAll(",", ", ");
		if  (property.includes ("url =")) url = extract (property);
      else if (property.includes ("doi =")) url = "https://doi.org/" + extract (property);
	});

	return (
		firstPage + ";;" +
		title + ";;" +
		keywords + ";;" +
		author + ";;" +
		year + ";;" +
		ptype + ";;" +
		url
	).replace(/[\{\}]/g, ""); //remove Tex
}
