#!/usr/bin/env osascript -l JavaScript
function run() {
	ObjC.import("stdlib");
	ObjC.import("Foundation");

	// import Alfred variables
	//---------------------------------------------------------------
	const firstPageNo = parseInt($.getenv("first_page_no"));
	const underlinesSecondOutput = $.getenv("underlines_second_output") === "true";
	const inputFile = $.getenv("alfred_workflow_cache") + "/temp.json";

	let citekey = "";
	let keywords = "";
	let filename;
	const hasBibtexEntry = $.getenv("citekey_insertion") !== "no_bibliography_extraction";
	if (hasBibtexEntry) {
		citekey = $.getenv("citekey");
		filename = citekey;
		keywords = $.getenv("keywords");
	} else {
		filename = new Date()
			.toLocaleString("en-GB") // to avoid AM/PM
			.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}).*/, "$3-$2-$1_$4-$5") // sortable
			+ "_annotations";
	}

	console.log([
		firstPageNo,
		underlinesSecondOutput,
		hasBibtexEntry,
		keywords,
		inputFile
	].join("; "));

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

	String.prototype.toTitleCase = function () {
		const smallWords = /\b(?:a[stn]?|and|because|but|by|en|for|i[fn]|neither|nor|o[fnr]|only|over|per|so|some|tha[tn]|the|to|up(on)?|vs?\.?|versus|via|when|with(out)?|yet)\b/i;
		let capitalized = this.replace(/\w\S*/g, function(word) {
			if (smallWords.test(word)) return word.toLowerCase();
			if (word.toLowerCase() === "i") return "I";
			if (word.length < 3) return word.toLowerCase();
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		});
		capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1).toLowerCase();
		return capitalized;
	};


	// Adapter Methods
	// --------------------------------------------------------------

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
			"colorCategory"?: string,
			"imagePath"?: string,
			"ocrText"?: string,
		},
	]
	*/

	Array.prototype.adapter4pdfannots2json = function () {
		// https://github.com/mgmeyers/pdf-annots2json#pdf-annots2json
		return this.map (a => {
			delete a.date;
			delete a.id;
			delete a.y;
			delete a.x;
			delete a.color;

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

	// Adapter Methods
	// --------------------------------------------------------------


	Array.prototype.cleanBrokenOCR = function () {
		return this.filter (a => !(a.type === "Free Text" && !a.comment));
	};

	Array.prototype.cleanQuoteKey = function () {
		return this.map (a => {
			if (!a.quote) return a; // free comments have no text
			a.quote = a.quote
				.replace(/ {2,}/g, " ") // multiple spaces
				.replace(/["„”«»]/g, "'") // quotation marks
				.replace(/\. ?\. ?\./g, "…") // ellipsis
				.replace(/\u00AD/g, "") // remove invisible character
				.replace(/(\w)[.,]\d/g, "$1") // remove footnotes from quote
				.replaceAll ("\\u0026", "&"); // resolve
			return a;
		});
	};

	Array.prototype.insertAndCleanPageNo = function (pageNo) {
		return this
			// in case the page numbers have names like "image 1" instead of integers
			.map (a => {
				if (typeof a.page === "string") a.page = parseInt(a.page.match(/\d+/)[0]);
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
		if (!underlinesSecondOutput) {
			setAlfredEnv("underlines", "none");
			return this;
		}
		const underlineAnnos = this.filter (a => a.type === "Underline");

		const underScoreHls = [];
		this.forEach (anno => {
			if (!anno.type === "Highlight" || !anno.comment) return;
			if (!anno.comment.startsWith("_")) return;
			anno.comment = anno.comment.slice(1).trim(); // remove "_" prefix
			underScoreHls.push(anno);
		});

		const totalSplitOff = [...underlineAnnos, ...underScoreHls];
		if (!totalSplitOff.length) {
			setAlfredEnv("underlines", "none");
			return this;
		}

		setAlfredEnv("underlines", totalSplitOff.JSONtoMD());
		return this.filter (a => a.type !== "Underline");
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

			function bulletHandling(str, comment_, markup) {
				if (/^\d\. /.test(comment_)) str = str.slice(2); // enumerations do not get a bullet
				str = str
					.replaceAll("\n", markup + "\n" + markup) // for multiline-comments
					.replace (/(..?)(\d\. )/g, "$2$1"); // valid markup of enumerations
				return str;
			}

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
						output = bulletHandling(output, comment, "__");
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
				case "Free Comment":
					output = "- " + annotationTag + "*" + comment + reference + "*";
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
					output = "> [!QUESTION]\n> " + comment + "\n";
					break;
				case "Task":
					output = "- [ ] " + comment;
					break;
				case "Image":
					output = "\n![[" + a.image + "]]\n";
					if (comment === "ocr") output += "\n- " + a.ocrText;
					break;
			}
			return output;
		});

		const mdText = arr
			.join("\n")
			.trim()
			.replace(/\n{3,}/g, "\n\n") // needed in case the annotaitons add line breaks
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
			...annoArr,
			{ "type": "hr", "comment": "" }
		];
	};

	// pdf-annots2json images (rectangle annotations)
	Array.prototype.insertImage4pdfannots2json = function () {
		let i = 1;
		return this.map (a => {
			if (a.type !== "Image") return a;

			a.image = `${filename}_image${i}.png`;
			i++;

			if (!a.comment) return a;

			if (a.comment.startsWith("|")) a.image += a.comment; // add alias
			return a;
		});
	};

	// "="
	Array.prototype.transformTag4yaml = function () {
		let newKeywords = [];

		// existing tags (from BibTeX library)
		if (keywords) {
			keywords
				.split(",")
				.map (kw => kw.trim())
				.forEach (tag => newKeywords.push(tag));
		}

		// addtional tags (from annotations)
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
		// process input
		.adapter4pdfannots2json()
		.cleanBrokenOCR()
		.insertAndCleanPageNo(firstPageNo)
		.cleanQuoteKey()

		// annotation codes & Images
		.mergeQuotes()
		.transformHeadings()
		.transformHr()
		.questionCallout()
		.transformTasks()
		.transformTag4yaml()
		.insertImage4pdfannots2json()

		// finalize
		.splitOffUnderlines()
		.JSONtoMD();

	setAlfredEnv("annotations", annotations);
}
