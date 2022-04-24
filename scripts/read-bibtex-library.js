#!/usr/bin/env osascript -l JavaScript

function run() {
	ObjC.import("stdlib");
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	const homepath = app.pathTo("home folder");

	// import variables
	const citekey = $.getenv("citekey");
	const bibtexLibraryPath = $.getenv("bibtex_library_path").replace(/^~/, homepath);

	// read BibTeX-entry
	let bibtexEntry = app.doShellScript(
		"cat \"" + bibtexLibraryPath + "\"| "
		+ "{ grep -E -i -A 20 \"{" + citekey + ",$\"|| true; }"
	);

	if (bibtexEntry === "") {
		const citekeyInsertion = $.getenv("citekey_insertion");
		let errorMsg = "No citekey found.\n\n";
		if (citekeyInsertion === "filename")	errorMsg += "Make sure your file is named correctly:\n'[citekey]_[...].pdf'";
		if (citekeyInsertion === "manually")	errorMsg += "Check your BibTeX Library for the correct citekey.";
		return errorMsg;
	}

	// workaround to avoid the need for pcregrep (uses grep -A20 from before)
	bibtexEntry = "@" + bibtexEntry.split("@")[1];

	// BibTeX-Decoding
	const germanChars = [
		"{\\\"u};ü",
		"{\\\"a};ä",
		"{\\\"o};ö",
		"{\\\"U};Ü",
		"{\\\"A};Ä",
		"{\\\"O};Ö",
		"\\\"u;ü",
		"\\\"a;ä",
		"\\\"o;ö",
		"\\\"U;Ü",
		"\\\"A;Ä",
		"\\\"O;Ö",
		"\\ss;ß",
		"{\\ss};ß"
	];
	const otherChars = [
		"{\\~n};ñ",
		"{\\'a};á",
		"{\\'e};é",
		"{\\v c};č",
		"\\c{c};ç",
		"\\o{};ø",
		"\\^{i};î",
		"\\\"{i};î",
		"\\\"{i};ï",
		"{\\'c};ć",
		"\\\"e;ë"
	];
	const specialChars = [
		"\\&;&",
		"``;\"",
		"`;'",
		"\\textendash{};—",
		"---;—",
		"--;—"
	];
	const decodePair = [...germanChars, ...otherChars, ...specialChars];
	decodePair.forEach((pair) => {
		const half = pair.split(";");
		bibtexEntry = bibtexEntry.replaceAll(half[0], half[1]);
	});

	// extracts content of a BibTeX-field
	function extract(str) {
		str = str.split(" = ")[1];
		return str.replace(/,$/, "");
	}

	// parse BibTeX entry
	let title = "";
	let ptype = "";
	let firstPage = "";
	let author = "";
	let year = "";
	let keywords = "";
	let url = "";

	const array = bibtexEntry.split("\r");
	array.forEach(property => {

		if (/\stitle =/i.test(property)) title = extract(property).replaceAll("\"", "'"); // to avoid invalid yaml, since title is wrapped in ""
		else if (property.includes("@")) ptype = property.replace(/@(.*)\{.*/, "$1");
		else if (property.includes("pages =")) firstPage = property.match(/\d+/)[0];
		else if (property.includes("author =")) author = extract(property);
		else if (/\syear =/i.test(property)) year = property.match(/\d{4}/)[0];
		else if (property.includes("date =")) year = property.match(/\d{4}/)[0];
		else if (property.includes("keywords =")) {
			keywords = extract(property)
				.replaceAll(" ", "-")
				.replaceAll(",", ", ");
		}
		else if (property.includes ("url =")) url = extract (property);
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
	).replace(/[{}]/g, ""); // remove Tex
}
