#!/usr/bin/env osascript -l JavaScript
function run(argv) {
	ObjC.import("stdlib");
	ObjC.import("Foundation");
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;

	//───────────────────────────────────────────────────────────────────────────
	// import Alfred variables

	const firstPageNo = parseInt($.getenv("first_page_no"));
	const usePdfannots = $.getenv("extraction_engine") === "pdfannots";
	const obsidianOutput = $.getenv("output_style") === "obsidian";

	const citekey = $.getenv("citekey");
	const keywords = $.getenv("keywords");
	let tagsForYaml = ""

	function writeToFile(text, file) {
		const str = $.NSString.alloc.initWithUTF8String(text);
		str.writeToFileAtomicallyEncodingError(file, true, $.NSUTF8StringEncoding, null);
	}

	String.prototype.toTitleCase = function () {
		const smallWords =
			/\b(?:a[stn]?|and|because|but|by|en|for|i[fn]|neither|nor|o[fnr]|only|over|per|so|some|tha[tn]|the|to|up(on)?|vs?\.?|versus|via|when|with(out)?|yet)\b/i;
		let capitalized = this.replace(/\w\S*/g, function (word) {
			if (smallWords.test(word)) return word.toLowerCase();
			if (word.toLowerCase() === "i") return "I";
			if (word.length < 3) return word.toLowerCase();
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		});
		capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1).toLowerCase();
		return capitalized;
	};

	//───────────────────────────────────────────────────────────────────────────
	// Adapter Method

	/* SIGNATURE EXPECTED BY THIS WORKFLOW
	{
		"type": enum, ("Free Text" | "Highlight" | "Underline" | "Free Comment" | "Image" | "Strikethrough")
		"comment"?: string, (user-written comment for the annotation)
		"quote"?: string, (text marked in the pdf)
		"imagePath"?: string,
	},
	*/

	// https://github.com/mgmeyers/pdfannots2json#sample-output
	Array.prototype.adapter4pdfannots2json = function () {
		return this.map(a => {
			a.quote = a.annotatedText;
			switch (a.type) {
				case "text":
					a.type = "Free Comment";
					break;
				case "strike":
					a.type = "Strikethrough";
					break;
				case "highlight":
					a.type = "Highlight";
					break;
				case "underline":
					a.type = "Underline";
					break;
				case "image":
					a.type = "Image";
					break;
			}
			return a;
		});
	};

	Array.prototype.adapter4pdfannots = function () {
		return this.map(a => {
			a.quote = a.text;
			a.comment = a.contents;
			switch (a.type) {
				case "text":
					a.type = "Free Comment";
					break;
			}
			return a;
		});
	};

	//───────────────────────────────────────────────────────────────────────────
	// Core Methods

	Array.prototype.cleanQuoteKey = function () {
		return this.map(a => {
			if (!a.quote) return a; // free comments have no text
			a.quote = a.quote
				.replace(/["„”«»]/g, "'") // quotation marks
				.replace(/\. ?\. ?\./g, "…") // ellipsis
				.replace(/\u00AD/g, "") // remove invisible character
				.replace(/(\D)[.,]\d/g, "$1") // remove footnotes from quote
				.replaceAll("\\u0026", "&") // resolve "&"-symbol
				.replace(/(?!^)(\S)-\s+(?=\w)/gm, "$1") // remove leftover hyphens, regex uses hack to treat lookahead as lookaround https://stackoverflow.com/a/43232659
				.trim();
			return a;
		});
	};

	Array.prototype.insertAndCleanPageNo = function (pageNo) {
		return (
			this
				// in case the page numbers have names like "image 1" instead of integers
				.map(a => {
					if (typeof a.page === "string") a.page = parseInt(a.page.match(/\d+/)[0]);
					return a;
				})
				.map(a => {
					a.page = (a.page + pageNo - 1).toString();
					return a;
				})
		);
	};

	// underlines
	Array.prototype.splitOffUnderlinesToDrafts = function () {
		const underlineAnnos = this.filter(a => a.type === "Underline");

		const underScoreHls = [];
		this.forEach(anno => {
			if (anno.type !== "Highlight") return;
			if (!anno.comment?.startsWith("_")) return;
			anno.comment = anno.comment.slice(1).trim(); // remove "_" prefix
			underScoreHls.push(anno);
		});

		const textToDrafts = [...underlineAnnos, ...underScoreHls];
		if (textToDrafts.length > 0) {
			const draftsInbox =
				app.pathTo("home folder") +
				`/Library/Mobile Documents/iCloud~com~agiletortoise~Drafts5/Documents/Inbox/${citekey}.md`;
			writeToFile(textToDrafts.JSONtoMD(), draftsInbox);
		}

		return this.filter(a => a.type !== "Underline");
	};

	Array.prototype.JSONtoMD = function () {
		const arr = this.map(a => {
			let comment, output;
			let annotationTag = "";

			// uncommented highlights or underlines
			if (a.comment) comment = a.comment.trim();
			else comment = "";

			// separate out leading annotation tags
			if (/^#\w/.test(comment)) {
				if (comment.includes(" ")) {
					const tempArr = comment.split(" ");
					annotationTag = tempArr.shift() + " ";
					comment = tempArr.join(" ");
				} else {
					annotationTag = comment;
					comment = "";
				}
			} else annotationTag = "";

			// Pandoc Citation
			const reference = `[@${citekey}, p. ${a.page}]`;

			function bulletHandling(str, comment_, markup) {
				if (/^\d\. /.test(comment_)) str = str.slice(2); // enumerations do not get a bullet
				str = str
					.replaceAll("\n", markup + "\n" + markup) // for multiline-comments
					.replace(/(..?)(\d\. )/g, "$2$1"); // valid markup of enumerations
				return str;
			}

			// type specific output
			switch (a.type) {
				case "Highlight":
				case "Underline": // highlights/underlines = bullet points
					if (comment) {
						output = `- ${annotationTag}__${comment}__ "${a.quote}" ${reference}`;
						output = bulletHandling(output, comment, "__");
					} else if (!comment && annotationTag) {
						output = `- ${annotationTag} "${a.quote}" ${reference}`;
					} else if (!comment && !annotationTag) output = `- "${a.quote}" ${reference}`;
					break;
				case "Free Comment": // free comments = block quote (my comments)
					output = `> ${annotationTag} ${comment} ${reference}`;
					output = bulletHandling(output, comment, "*");
					break;
				case "Heading":
					output = "\n" + comment;
					break;
				case "Question Callout": // blockquoted comment
					comment = comment.replace(/^/gm, "> ");
					output = `> [!QUESTION]\n${comment}\n`;
					break;
				case "Image":
					output = `\n![[${a.image}]]\n`;
					break;
			}
			return output;
		});

		return arr.join("\n") + "\n";
	};

	//───────────────────────────────────────────────────────────────────────────
	// Annotation Code Methods

	// "+"
	Array.prototype.mergeQuotes = function () {
		// start at one, since the first element can't be merged to a predecessor
		for (let i = 1; i < this.length; i++) {
			if (this[i].type === "Free Comment" || !this[i].comment) continue;
			if (this[i].comment !== "+") continue;
			let connector = "";

			if (this[i - 1].page !== this[i].page) {
				// if across pages
				this[i - 1].page += "–" + this[i].page; // merge page numbers
				connector = " (…) ";
			}
			this[i - 1].quote += connector + this[i].quote; // merge quotes

			this.splice(i, 1); // remove current element
			i--; // to move index back, since element isn't there anymore
		}
		return this;
	};

	// "##"
	Array.prototype.transformHeadings = function () {
		return this.map(a => {
			if (!a.comment) return a;
			const hLevel = a.comment.match(/^#+(?!\w)/);
			if (hLevel) {
				if (a.type === "Highlight" || a.type === "Underline") {
					let headingText = a.quote;
					if (headingText === headingText.toUpperCase()) headingText = headingText.toTitleCase();
					a.comment = hLevel[0] + " " + headingText;
					delete a.quote;
				}
				a.type = "Heading";
			}
			return a;
		});
	};

	// "?"
	Array.prototype.questionCallout = function () {
		let annoArr = this.map(a => {
			if (!a.comment) return a;
			if (a.type === "Free Comment" && a.comment.startsWith("?")) {
				a.type = "Question Callout";
				a.comment = a.comment.slice(1).trim();
			}
			return a;
		});
		const pseudoAdmos = annoArr.filter(a => a.type === "Question Callout");
		annoArr = annoArr.filter(a => a.type !== "Question Callout");
		return [...pseudoAdmos, ...annoArr];
	};

	// images / rectangle annotations (pdfannots2json only)
	Array.prototype.insertImage4pdfannots2json = function () {
		let i = 1;
		return this.map(a => {
			if (a.type !== "Image") return a;
			a.image = `${citekey}_image${i}.png`;
			if (a.comment) a.image += "|" + a.comment; // add alias
			i++;
			return a;
		});
	};

	// "="
	Array.prototype.transformTag4yaml = function () {
		let newKeywords = [];

		// existing tags (from BibTeX library)
		if (keywords) {
			keywords.split(",").forEach(tag => newKeywords.push(tag));
		}

		// additional tags (from annotations)
		const arr = this.map(a => {
			if (a.comment?.startsWith("=")) {
				let tags = a.comment.slice(1); // remove the "="
				if (a.type === "Highlight" || a.type === "Underline") tags += " " + a.quote;
				tags.split(",").forEach(tag => newKeywords.push(tag));
				a.type = "remove";
			}
			return a;
		});

		// Merge & Save both
		if (newKeywords.length) {
			newKeywords = [...new Set(newKeywords)].map(kw => kw.trim().replaceAll(" ", "-"));
			tagsForYaml = newKeywords.join(", ") + ", "
		}

		// return annotation array without tags
		return arr.filter(a => a.type !== "remove");
	};

	//───────────────────────────────────────────────────────────────────────────

	function writeNote(annotations) {
		const isoToday = new Date().toISOString().slice(0, 10);

		function env(envVar) {
			let out;
			try {
				out = $.getenv(envVar);
			} catch (e) {
				out = "";
			}
			return out;
		}

		const noteContent = `---
aliases: "${env("title")}"
tags: literature-note, ${tagsForYaml}
citekey: ${env("citekey")}
year: ${env("year")}
author: "${env("author")}"
publicationType: ${env("ptype")}
url: ${env("url")}
doi: ${env("doi")}
creation-date: ${isoToday}
obsidianUIMode: preview
---

# ${env("title")}

${annotations}
`;

		if (obsidianOutput) {
			const path = $.getenv("obsidian_destination") + `/${citekey}.md`;
			writeToFile(noteContent, path);
			delay(0.1); // delay to ensure writing took place
			app.openLocation("obsidian://open?path=" + encodeURIComponent(path));
			app.setTheClipboardTo(`[[${citekey}]]`); // copy wikilink
		} else {
			const path = $.getenv("filepath").replace(/\.pdf$/, ".md");
			writeToFile(noteContent, path);
			app.doShellScript(`open -R "${path}"`); // reveal in Finder
		}
	}

	//───────────────────────────────────────────────────────────────────────────
	// MAIN
	let annos = JSON.parse(argv[0]);

	// select right adapter method
	annos = usePdfannots ? annos.adapter4pdfannots() : annos.adapter4pdfannots2json();

	annos = annos
		// process input
		.insertAndCleanPageNo(firstPageNo)
		.cleanQuoteKey()

		// annotation codes & images
		.mergeQuotes()
		.transformHeadings()
		.questionCallout()
		.transformTag4yaml()
		.insertImage4pdfannots2json()

		// finalize
		.splitOffUnderlinesToDrafts()
		.JSONtoMD();

	writeNote(annos);
}
