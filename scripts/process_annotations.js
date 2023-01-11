#!/usr/bin/env osascript -l JavaScript
function run() {
	ObjC.import("stdlib");
	ObjC.import("Foundation");
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;

	//───────────────────────────────────────────────────────────────────────────
	// import Alfred variables

	const firstPageNo = parseInt($.getenv("first_page_no"));
	const underlinesSecondOutput = $.getenv("underlines_second_output") === "1";
	const inputFile = $.getenv("alfred_workflow_cache") + "/temp.json";
	const usePdfannots = $.getenv("extraction_engine") === "pdfannots";

	const citekey = $.getenv("citekey");
	const keywords = $.getenv("keywords");

	function readFile(path, encoding) {
		if (!encoding) encoding = $.NSUTF8StringEncoding;
		const fm = $.NSFileManager.defaultManager;
		const data = fm.contentsAtPath(path);
		const str = $.NSString.alloc.initWithDataEncoding(data, encoding);
		return ObjC.unwrap(str);
	}

	function writeData(key, newValue) {
		const dataFolder = $.getenv("alfred_workflow_data");
		const fileManager = $.NSFileManager.defaultManager;
		const folderExists = fileManager.fileExistsAtPath(dataFolder);
		if (!folderExists)
			fileManager.createDirectoryAtPathWithIntermediateDirectoriesAttributesError(dataFolder, false, $(), $());
		const dataPath = `${dataFolder}/${key}`;
		const str = $.NSString.alloc.initWithUTF8String(newValue);
		str.writeToFileAtomicallyEncodingError(dataPath, true, $.NSUTF8StringEncoding, null);
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

	/*
	The script requires annotation-jsons with the following signature:
	- "type" values need to be lower-cased
	- "comment" denotes user-written text
	- "quote" denotes the marked text from the pdf
	- "colorCategory" denotes a color range
	[
		{
			"type": "Free Text" | "Highlight" | "Underline" | "Free Comment" | "Image" | "Strikethrough",
			"comment"?: string,
			"quote"?: string,
			"imagePath"?: string,
		},
	]
	*/

	// https://github.com/mgmeyers/pdfannots2json#sample-output
	Array.prototype.adapter4pdfannots2json = function () {
		return this.map(a => {
			delete a.date;
			delete a.id;
			delete a.y;
			delete a.x;
			delete a.color;
			delete a.colorCategory;
			delete a.ocrText;

			a.quote = a.annotatedText;
			delete a.annotatedText;

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
			delete a.created;
			delete a.start_xy;
			delete a.author;

			a.quote = a.text;
			a.comment = a.contents;
			delete a.text;
			delete a.contents;

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

	Array.prototype.cleanBrokenOCR = function () {
		return this.filter(a => !(a.type === "Free Text" && !a.comment));
	};

	Array.prototype.cleanQuoteKey = function () {
		return this.map(a => {
			if (!a.quote) return a; // free comments have no text
			a.quote = a.quote
				.replace(/ {2,}/g, " ") // multiple spaces
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

	Array.prototype.splitOffUnderlines = function () {
		if (!underlinesSecondOutput) {
			writeData("underlines", "none");
			return this;
		}
		const underlineAnnos = this.filter(a => a.type === "Underline");

		const underScoreHls = [];
		this.forEach(anno => {
			if (anno.type !== "Highlight") return;
			if (!anno.comment?.startsWith("_")) return;
			anno.comment = anno.comment.slice(1).trim(); // remove "_" prefix
			underScoreHls.push(anno);
		});

		const totalSplitOff = [...underlineAnnos, ...underScoreHls];
		if (!totalSplitOff.length) {
			writeData("underlines", "none");
			return this;
		}

		writeData("underlines", totalSplitOff.JSONtoMD());
		return this.filter(a => a.type !== "Underline");
	};

	Array.prototype.JSONtoMD = function () {
		const arr = this.map(a => { /* eslint-disable-line complexity */
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
				case "Underline":
					// highlights/underlines = bullet points
					if (comment) {
						output = `- ${annotationTag}__${comment}__ "${a.quote}" ${reference}`;
						output = bulletHandling(output, comment, "__");
					} else if (!comment && annotationTag) {
						output = `- ${annotationTag} "${a.quote}" ${reference}`;
					} else if (!comment && !annotationTag) output = `- "${a.quote}" ${reference}`;
					break;
				case "Free Comment":
					// free comments = block quote (my comments)
					output = `> ${annotationTag} ${comment} ${reference}`;
					output = bulletHandling(output, comment, "*");
					break;
				case "Heading":
					output = "\n" + comment;
					break;
				case "hr":
					output = "\n---\n";
					break;
				case "Line Break":
					output = "\n";
					break;
				case "Question Callout":
					comment = comment.replace(/^/gm, "> "); // blockquoted comment
					output = `> [!QUESTION]\n${comment}\n`;
					break;
				case "Task":
					output = "- [ ] " + comment;
					break;
				case "Image":
					output = `\n![[${a.image}]]\n`;
					break;
			}
			return output;
		});

		const mdText =
			arr
				.join("\n")
				.trim()
				.replace(/\n{3,}/g, "\n\n") + // needed in case the annotations add line breaks
			"\n";
		return mdText;
	};

	// Annotation Code Methods
	// --------------------------------------------------------------

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

	// "---"
	Array.prototype.transformHr = function () {
		return this.map(a => {
			if (a.type === "Free Comment" && a.comment === "---") a.type = "hr";
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

	// "X"
	Array.prototype.transformTasks = function () {
		let annoArr = this.map(a => {
			if (!a.comment) return a;
			if (a.comment.charAt(0).toLowerCase() === "x") {
				// case-insensitive matching
				a.comment = a.comment.slice(1).trim();
				if (a.type === "Highlight" || a.type === "Underline") {
					a.comment += ": " + a.quote;
					delete a.quote;
				}
				a.type = "Task";
			}
			return a;
		});
		const taskArr = annoArr.filter(a => a.type === "Task");

		if (!taskArr.length) return annoArr;

		annoArr = annoArr.filter(a => a.type !== "Task");
		return [
			{ type: "Heading", comment: "## Tasks" },
			...taskArr,
			{ type: "Line Break", comment: "" },
			...annoArr,
			{ type: "hr", comment: "" },
		];
	};

	// pdfannots2json images (rectangle annotations)
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
		}
		writeData("tags", newKeywords.join(", ") + ", ");

		// return annotation array without tags
		return arr.filter(a => a.type !== "remove");
	};

	// "()"
	Array.prototype.quoteWithoutReferences = function () {
		return this.map(a => {
			if (a.type !== "Highlight" && a.type !== "Underline") return a;
			if (!a.comment?.startsWith("()")) return a;

			a.comment = a.comment.slice(2).trim();
			a.quote = a.quote.replace(/\([^(]{5,}?\)/g, "()"); // quantifier "5", so brackets with years like "(2013)" aren't shortened
			return a;
		});
	};

	//───────────────────────────────────────────────────────────────────────────
	// MAIN
	let annos = JSON.parse(readFile(inputFile));

	// select right adapter method
	annos = usePdfannots ? annos.adapter4pdfannots() : annos.adapter4pdfannots2json();

	annos = annos
		// process input
		.cleanBrokenOCR()
		.insertAndCleanPageNo(firstPageNo)
		.cleanQuoteKey()

		// annotation codes & images
		.mergeQuotes()
		.quoteWithoutReferences()
		.transformHeadings()
		.transformHr()
		.questionCallout()
		.transformTasks()
		.transformTag4yaml()
		.insertImage4pdfannots2json()

		// finalize
		.splitOffUnderlines()
		.JSONtoMD();

	return annos;
}
