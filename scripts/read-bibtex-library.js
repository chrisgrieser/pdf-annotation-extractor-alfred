#!/usr/bin/env osascript -l JavaScript

function run() {
	ObjC.import("stdlib");
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;
	const homepath = app.pathTo("home folder");

	// import variables
	const citekey = $.getenv("citekey");
	const bibtexLibraryPath = $.getenv("bibtex_library_path").replace(/^~/, homepath);

	const fileExists = Application("Finder").exists(Path(bibtexLibraryPath));

	if (!fileExists) {
		const errorMsg = `No BibTeX File found at "${bibtexLibraryPath}".\n\n Make sure you have entered the full path to the file, if you entered it manually.`;
		return errorMsg;
	}

	// read BibTeX-entry
	let bibtexEntry = app.doShellScript(
		// --max-count is needed in case of duplicate citekeys
		`grep --ignore-case --after-context=20 --max-count=1 "{${citekey}," "${bibtexLibraryPath}" || true`
	);

	if (bibtexEntry === "") {
		const citekeyInsertion = $.getenv("citekey_insertion");
		let errorMsg = "No citekey found.\n\n";
		if (citekeyInsertion === "filename") errorMsg += "Make sure your file is named correctly:\n'[citekey]_[...].pdf'";
		if (citekeyInsertion === "manually") errorMsg += "Check your BibTeX Library for the correct citekey.";
		return errorMsg;
	}

	// workaround to avoid the need for pcregrep (together with grep -A20 from before)
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

		if (/\stitle =/i.test(property)) {
			title =extract(property)
				.replaceAll("\"", "'") // to avoid invalid yaml, since title is wrapped in ""
				.replaceAll(":", "."); // to avoid invalid yaml
		}
		else if (property.includes("@")) ptype = property.replace(/@(.*)\{.*/, "$1");
		else if (property.includes("pages =")) firstPage = property.match(/\d+/)[0];
		else if (property.includes("author =")) author = extract(property);
		else if (/\syear =/i.test(property)) year = property.match(/\d{4}/)[0];
		else if (property.includes("date =")) year = property.match(/\d{4}/)[0];
		else if (property.includes("keywords =")) {
			keywords = extract(property)
				.replaceAll(" ", "-") // no spaces allowed in tags
				.replaceAll(",-", ",");
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
