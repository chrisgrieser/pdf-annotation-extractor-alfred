#!/usr/bin/env osascript -l JavaScript
function run(argv) {
	ObjC.import("stdlib");

	// import Alfred variables
	//---------------------------------------------------------------
	const firstPageNo = parseInt($.getenv("first_page_no"));
	const underlinesSecondOutput = $.getenv("underlines_second_output") === "true";
	const hasBibtexEntry = $.getenv("citekey_insertion") !== "no_bibliography_extraction";
	let citekey = "";
	if (hasBibtexEntry) citekey = $.getenv("citekey");
	let keywords = $.getenv("keywords");

	// Core Methods
	// --------------------------------------------------------------

	function setAlfredEnv (envVar, newValue) {
		Application("com.runningwithcrayons.Alfred").setConfiguration (envVar, {
			toValue: newValue,
			inWorkflow: $.getenv("alfred_workflow_bundleid"),
			exportable: false
		});
	}

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
			return a;
		});
	};

	Array.prototype.cleanQuoteKey = function () {
		return this.map (a => {
			if (!a.quote) return a; // free comments have no text
			a.quote = a.quote
				.replace(/ {2,}/g, " ") // multiple spaces
				.replace(/["„”«»]/g, "'") // quotation marks
				.replace(/\. ?\. ?\./g, "…"); // ellipsis
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
		if (!underlinesSecondOutput) return this;

		const arr = this.filter (a => a.type !== "Underline");
		let underlineAnnos = this.filter (a => a.type === "Underline");
		if (underlineAnnos) underlineAnnos = underlineAnnos.JSONtoMD();
		else underlineAnnos = "none";

		setAlfredEnv("underlines", underlineAnnos);
		return arr;
	};

	Array.prototype.JSONtoMD = function () {
		const arr = this.map (a => {
			let annotationTag, comment, output, reference;

			// uncommented highlights or underlines
			if (a.comment) comment = a.comment.trim();
			else comment = "";

			// separate out leading annotation tags
			if (/#\w/.test(comment)) {
				const tempArr = comment.split(" ");
				annotationTag = tempArr.shift() + " ";
				comment = tempArr.join(" ");
			}
			else {
				annotationTag = "";
			}

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
					}
					if (!comment) output = "> \""+ a.quote + "\"" + reference;
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
					break;
				case "Heading":
					output = "\n" + comment;
					break;
				case "hr":
					output = "\n---\n";
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
		return arr.join("\n");
	};

	// Annotation Code Methods
	// --------------------------------------------------------------

	// "+" and "++"
	Array.prototype.mergeQuotes = function () {
		// can start at one, since the first element cant
		// be merged to a predecessor
		for (let i = 1; i < this.length; i++) {
			if (this[i].type === "Free Comment" || !this[i].comment) continue;

			let connector = " ";
			if (this[i].comment === "+") connector = " (…) ";

			if (this[i].comment === "++" || this[i].comment === "+") {
				this[i-1].quote += connector + this[i].quote;
				if (this[i-1].page !== this[i].page) this[i-1].page += "–" + this[i].page;
				this.splice(i, 1); // remove element
				i--; // to move index back, since element isn't there anymore
			}

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
					a.comment = hLevel[0] + " " + a.quote;
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
	Array.prototype.customCheckboxQuestion = function () {
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
					a.comment += " " + a.quote;
					delete a.quote;
				}
				a.type = "Task";
			}
			return a;
		});
		const taskArr = annoArr.filter(a => a.type === "Task");
		if (taskArr.length) {
			taskArr.unshift ( { "type": "Heading", "comment": "## Tasks" } );
			taskArr.push ( { "type": "hr" } );
		}

		annoArr = annoArr.filter(a => a.type !== "Task");
		return [...taskArr, ...annoArr];
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
		const arr = this
			.map (a => {
				if (!a.comment) return a;
				if (a.comment.startsWith("=")) {
					newKeywords.push (a.comment.slice(1).trim());
					a.type = "remove";
				}
				return a;
			})
			.filter (a => a.type !== "remove");

		if (newKeywords.length) {
			newKeywords = [... new Set (newKeywords)]
				.map (kw => kw.trim().replaceAll(" ", "-"));
			keywords += ", " + newKeywords.join(", ");
		}

		setAlfredEnv("tags", keywords); // variable name has to be changed so Alfred accepts it >:(

		return arr;
	};

	// Main
	// --------------------------------------------------------------

	const annotations = JSON.parse(argv.join(""))
		.betterKeys()
		.insertAndCleanPageNo(firstPageNo)
		.cleanQuoteKey()

		.mergeQuotes()
		.transformHeadings()
		.transformHr()
		.customCheckboxQuestion()
		.transformTasks()
		.insertImageMarker()
		.transformTag4yaml()

		.splitOffUnderlines()
		.JSONtoMD();

	setAlfredEnv("annotations", annotations);
}
