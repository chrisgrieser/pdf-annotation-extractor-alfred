#!/usr/bin/env osascript -l JavaScript

function run(argv) {
	ObjC.import("stdlib");
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;

	// import variables
	const filepath = argv[0];
	const citekey = filepath
		.replace(/.*\/(.*)\.pdf/, "$1") // only basename w/o ext
		.replace(/(_[^_]*$)/, ""); // INFO part before underscore, this method does not work for citkeys which contain an underscore though...
	const bibtexLibraryPath = $.getenv("bibtex_library_path").replace(/^~/, app.pathTo("home folder"));
	const libraryExists = Application("Finder").exists(Path(bibtexLibraryPath));
	if (!libraryExists) return `No BibTeX File found at "${bibtexLibraryPath}".`;

	// Read Bibtex-Entry
	// --max-count in case of duplicate citekeys, --after-context=20 to retrieve
	// full entry since grep does not work on multi-line
	let bibtexEntry = app.doShellScript(
		`grep --ignore-case --after-context=20 --max-count=1 "{${citekey}," "${bibtexLibraryPath}" || true`
	);

	if (!bibtexEntry) return "No citekey found.\n\nMake sure your file is named correctly:\n'[citekey]_[...].pdf'";

	bibtexEntry = "@" + bibtexEntry.split("@")[1]; // cut following citekys

	// Decode Bibtex
	const germanChars = [
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
	const otherChars = [
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
	const specialChars = ["\\&;&", '``;"', "`;'", "\\textendash{};—", "---;—", "--;—"];

	const decodePair = [...germanChars, ...otherChars, ...specialChars];
	decodePair.forEach(pair => {
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
	let doi = "";

	bibtexEntry.split("\r").forEach(property => {
		if (/\stitle =/i.test(property)) {
			title = extract(property)
				.replaceAll('"', "'") // to avoid invalid yaml, since title is wrapped in ""
				.replaceAll(":", "."); // to avoid invalid yaml
		} else if (property.includes("@")) ptype = property.replace(/@(.*)\{.*/, "$1");
		else if (property.includes("pages =")) firstPage = property.match(/\d+/)[0];
		else if (property.includes("author =")) author = extract(property);
		else if (/\syear =/i.test(property)) year = property.match(/\d{4}/)[0];
		else if (property.includes("date =")) year = property.match(/\d{4}/)[0];
		else if (property.includes("keywords =")) {
			keywords = extract(property)
				.replaceAll(" ", "-") // no spaces allowed in tags
				.replaceAll(",-", ",");
		} else if (property.includes("doi =")) {
			url = "https://doi.org/" + extract(property);
			doi = extract(property);
		} else if (property.includes("url =")) url = extract(property);
	});

	const bundleAndCleaned = [citekey, firstPage, title, keywords, author, year, ptype, url, doi, filepath]
		.join(";;") // separator used to split in next step via alfred
		.replaceAll("}", "") // remove TeX-Syntax
		.replaceAll("{", "");
	return bundleAndCleaned;
}
