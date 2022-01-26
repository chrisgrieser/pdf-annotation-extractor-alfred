#!/usr/bin/env osascript -l JavaScript
function run() {
	ObjC.import("stdlib");
	ObjC.import("Foundation");

	// import Alfred variables
	//---------------------------------------------------------------
	const firstPageNo = parseInt($.getenv("first_page_no"));
	const underlinesSecondOutput = $.getenv("underlines_second_output") === "true";
	const hasBibtexEntry = $.getenv("citekey_insertion") !== "no_bibliography_extraction";
	let citekey = "";
	if (hasBibtexEntry) citekey = $.getenv("citekey");
	const keywords = $.getenv("keywords");
	const inputFile = $.getenv("alfred_workflow_cache") + "/temp.json";

	function readFile (path, encoding) {
		if (!encoding) encoding = $.NSUTF8StringEncoding;
		const fm = $.NSFileManager.defaultManager;
		const data = fm.contentsAtPath(path);
		const str = $.NSString.alloc.initWithDataEncoding(data, encoding);
		return ObjC.unwrap(str);
	}

	function setAlfredEnv (envVar, newValue) {
		Application("com.runningwithcrayons.Alfred").setConfiguration (envVar, {
			toValue: newValue,
			inWorkflow: $.getenv("alfred_workflow_bundleid"),
			exportable: false
		});
	}

	// Core Methods
	// --------------------------------------------------------------

	Array.prototype.betterKeys = function () {
		return this.map (a => {
			delete a.start_xy;
			delete a.author;
			delete a.created;

			a.quote = a.text;
			a.comment = a.contents;
			delete a.text;
			delete a.contents;
			if (a.type === "Text") a.type = "Free Comment";
			if (a.type === "StrikeOut") a.type = "Strikethrough";
			if (a.type === "FreeText") a.type = "Free Text";
			return a;
		});
	};

	Array.prototype.cleanQuoteKey = function () {
		return this.map (a => {
			if (!a.quote) return a; // free comments have no text
			a.quote = a.quote
				.replace(/ {2,}/g, " ") // multiple spaces
				.replace(/["„”«»]/g, "'") // quotation marks
				.replace(/\. ?\. ?\./g, "…") // ellipsis
				.replace(/\u00AD/g, ""); // remove invisible characters
			return a;
		});
	};

	Array.prototype.insertAndCleanPageNo = function (pageNo) {
		return this
			// in case the page numbers have names like "image 1" instead of integers
			.map (a => {
				if (typeof(a.page) === "string") a.page = parseInt(a.page.match(/\d+/)[0]);
				return a;
			})
			.map (a => {
				a.page += pageNo;
				a.page--;
				a.page = a.page.toString();
				return a;
			});
	};

	Array.prototype.splitOffUnderlines = function () {
		const hasUnderlines = this.some(a => a.type === "Underline");
		if (!underlinesSecondOutput || !hasUnderlines) {
			setAlfredEnv("underlines", "none");
			return this;
		}

		const underlineAnnos = this
			.filter (a => a.type === "Underline")
			.JSONtoMD();
		setAlfredEnv("underlines", underlineAnnos);
		return this.filter (a => a.type !== "Underline");
	};

	Array.prototype.copyHighlightToSplitOffUnderline = function () {
		if (!underlinesSecondOutput) return this;

		for (let i = 0; i < this.length; i++) {
			if (!this[i].type === "Highlight" || !this[i].comment) continue;
			if (!this[i].comment.startsWith("_")) continue;
			this[i].comment = this[i].comment.slice(1).trim();

			const currentAnno = this[i];
			currentAnno.type = "Underline";
			this.splice(i+1, 0, currentAnno); // insert copy as underline at next position
			i++; // move index further, since next item is the copy
		}

		return this;
	};

	Array.prototype.JSONtoMD = function () {
		const arr = this.map (a => {
			let comment, output, reference;
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
			}
			else annotationTag = "";

			// Pandoc Citation
			if (hasBibtexEntry) reference = " [@" + citekey + ", p. " + a.page + "]";
			else reference = "";

			// type specific output
			switch (a.type) {
				case "Highlight":
				case "Underline":
					if (comment) {
						output = "- "
						+ annotationTag
						+ "__" + comment + "__: "
						+ "\"" + a.quote + "\""
						+ reference;
					} else if (!comment && annotationTag) {
						output = "- "
						+ annotationTag
						+ " \"" + a.quote + "\""
						+ reference;
					}
					else if (!comment && !annotationTag) output = "> \""+ a.quote + "\"" + reference;
					break;
				case "Strikethrough":
					if (comment) {
						output = "- "
						+ annotationTag
						+ "*" + comment + "*: "
						+ "~~\"" + a.quote + "\"~~"
						+ reference;
					}
					if (!comment) output = "> ~~\""+ a.quote + "\"~~" + reference;
					break;
				case "Free Text":
				case "Free Comment":
					output = "- " + annotationTag + "*" + comment + reference + "*";
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
				case "Checkbox Question":
					output = ">>> " + comment + "\n";
					break;
				case "Task":
					output = "- [ ] " + comment;
					break;
				case "Image":
					output = "\n![[" + comment + "]]\n";
					break;
			}
			return output;
		});

		const mdText = arr
			.join("\n")
			.trim()
			.replace(/\n{3,}/g, "\n\n")
			+ "\n";
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

			if (this[i-1].page !== this[i].page) { // if across pages
				this[i-1].page += "–" + this[i].page; // merge page numbers
				connector = " (…) ";
			}
			this[i-1].quote += connector + this[i].quote; // merge quotes

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
					const headingText = a.quote.charAt(0).toUpperCase() + a.quote.substr(1).toLowerCase();
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
	Array.prototype.admotionQuestion = function () {
		let annoArr = this.map(a => {
			if (!a.comment) return a;
			if (a.type === "Free Comment" && a.comment.startsWith("?")) {
				a.type = "Checkbox Question";
				a.comment = a.comment.slice(1).trim();
			}
			return a;
		});
		const pseudoAdmos = annoArr.filter(a => a.type === "Checkbox Question");
		annoArr = annoArr.filter(a => a.type !== "Checkbox Question");
		return [...pseudoAdmos, ...annoArr];
	};

	// "X"
	Array.prototype.transformTasks = function () {
		let annoArr = this.map(a => {
			if (!a.comment) return a;
			if (a.comment.startsWith("X")) {
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
			{ "type": "Heading", "comment": "## Tasks" },
			...taskArr,
			{ "type": "Line Break", "comment": "" },
			...annoArr
		];
	};

	// "!n"
	Array.prototype.insertImageMarker = function () {
		let filename;
		if (hasBibtexEntry) filename = citekey;
		else filename = (new Date()).toISOString().slice(0, 10);

		return this.map (a => {
			if (!a.comment) return a;
			const imageStr = a.comment.match (/^!(\d+) ?(.*)/);
			if (a.type === "Free Comment" && imageStr) {
				a.type = "Image";
				const imageNo = imageStr[1];
				const imageAlias = imageStr[2];
				a.comment = filename + "_image"+ imageNo + ".png|"+ imageAlias;
			}
			return a;
		});
	};

	// "="
	Array.prototype.transformTag4yaml = function () {
		let newKeywords = [];

		// old tags (from BibTeX library)
		if (keywords) {
			keywords
				.split(",")
				.map (kw => kw.trim())
				.forEach (tag => newKeywords.push(tag));
		}

		// new tags (from annotations)
		const arr = this
			.map (a => {
				if (a.comment?.startsWith("=")) {
					let tags = a.comment.slice(1); // remove the "="
					if (a.type === "Highlight" || a.type === "Underline") tags += " " + a.quote;
					tags
						.split(",")
						.map (kw => kw.trim())
						.forEach (tag => newKeywords.push(tag));
					a.type = "remove";
				}
				return a;
			});

		// Merge & Save both
		if (newKeywords.length) {
			newKeywords = [... new Set (newKeywords)]
				.map (kw => kw.replaceAll(" ", "-"));
		}
		setAlfredEnv("tags", newKeywords.join(", ")); // variable name has to be changed so Alfred accepts it >:(

		// return annotation array without tags
		return arr.filter (a => a.type !== "remove");
	};

	// Main
	// --------------------------------------------------------------

	const annotations = JSON.parse(readFile(inputFile))
		.betterKeys()
		.insertAndCleanPageNo(firstPageNo)
		.cleanQuoteKey()

		.mergeQuotes()
		.transformHeadings()
		.transformHr()
		.admotionQuestion()
		.transformTasks()
		.insertImageMarker()
		.transformTag4yaml()

		.splitOffUnderlines()
		.copyHighlightToSplitOffUnderline()

		.JSONtoMD();

	setAlfredEnv("annotations", annotations);
}
