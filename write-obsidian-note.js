#!/usr/bin/env osascript -l JavaScript
function run(argv) {
	ObjC.import("stdlib");
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;

	function env(envVar) {
		let out;
		try { out = $.getenv(envVar) }
		catch (e) { out = "" }
		return out;
	}

	const isoToday = new Date().toISOString().slice(0, 10);

	function writeToFile(text, file) {
		const str = $.NSString.alloc.initWithUTF8String(text);
		str.writeToFileAtomicallyEncodingError(file, true, $.NSUTF8StringEncoding, null);
	}

	function readData (key) {
		const fileExists = (filePath) => Application("Finder").exists(Path(filePath));
		const dataPath = $.getenv("alfred_workflow_data") + "/" + key;
		if (!fileExists(dataPath)) return "data does not exist.";
		const data = $.NSFileManager.defaultManager.contentsAtPath(dataPath);
		const str = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding);
		return ObjC.unwrap(str);
	}

	//───────────────────────────────────────────────────────────────────────────

	const path = env("obsidian_destination") + "/" + env("filename") + ".md";
	const annotations = argv[0];
	const tags = readData("tags");

	const noteContent = `---
aliases: "${env("title")}"
tags: literature-note, ${tags}
citekey: ${env("citekey")}
year: ${env("year")}
author: "${env("author")}"
publicationType: ${env("ptype")}
url: ${env("url")}
url: ${env("doi")}
creation-date: ${isoToday}
obsidianUIMode: preview
---

# ${env("title")}
${annotations}
`;

	writeToFile(noteContent, path);

	// open in Obsidian
	delay(0.1); // delay to ensure writing took place
	const urlscheme = "obsidian://open?path=" + encodeURIComponent(path);
	app.openLocation(urlscheme);

	// copy wikilink
	app.setTheClipboardTo(`[[${env("citekey")}]]`);

}
