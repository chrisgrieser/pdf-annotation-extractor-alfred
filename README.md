# PDF Annotation Extractor
![](https://img.shields.io/github/downloads/chrisgrieser/pdf-annotation-extractor-alfred/total?label=Total%20Downloads&style=plastic) ![](https://img.shields.io/github/v/release/chrisgrieser/pdf-annotation-extractor-alfred?label=Latest%20Release&style=plastic)

An [Alfred Workflow](https://www.alfredapp.com/) to extract annotations as Markdown & insert Pandoc Citations as References. Outputs annotations to [Obsidian](https://obsidian.md/), [Drafts](https://getdrafts.com/), or a Markdown file.

Automatically determines correct page numbers, merges highlights across page breaks, prepends a YAML Header bibliographic information, and some more small Quality-of-Life conveniences.

<img src="https://user-images.githubusercontent.com/73286100/132963514-f08463cb-de2a-45d2-80fb-8c29afa35fb8.gif" alt="PDF Annotation Extractor" width=60%>

## Table of Contents
<!--toc:start-->
- [Installation](#installation)
- [How to Use](#how-to-use)
	- [Requirements for the PDF](#requirements-for-the-pdf)
	- [Basics](#basics)
	- [Automatic Page Number Identification](#automatic-page-number-identification)
	- [Annotation Codes](#annotation-codes)
	- [Extracting Images](#extracting-images)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)
	- [Thanks](#thanks)
	- [About the Developer](#about-the-developer)
	- [Donate](#donate)
<!--toc:end-->

## Installation
- Requirement: [Alfred 5](https://www.alfredapp.com/) with Powerpack
- Install [Homebrew](https://brew.sh/)
- Install `pdfannots2json` by pasting the following into your terminal:

  ```bash
  brew install mgmeyers/pdfannots2json/pdfannots2json
  ```

- Download the [latest release](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/releases/latest/).
- Set the hotkey by double-clicking the sky-blue field at the top left. (You can also use this workflow with the Alfred keyword `anno`.)
- Set up the workflow configuration inside the app.

## How to Use

### Requirements for the PDF
- The PDF Annotation Extractor works on any PDF that has valid annotations saved *in the PDF file*. (Some PDF readers like __Skim__ or __Zotero 6__ do not store annotations int eh PDF itself by default.)
- The filename of the PDF must be *exactly* the citekey, optionally followed by an underscore and some text like `{citekey}_{title}.pdf`. The citekey must not contain underscores (`_`).

> __Note__  
> You can achieve such a filename pattern with via renaming rules of most reference managers, for example with the [ZotFile plugin for Zotero](http://zotfile.com/#renaming-rules) or the [AutoFile feature of BibDesk](https://bibdesk.sourceforge.io/manual/BibDeskHelp_77.html#SEC140).

### Basics
- Use the hotkey to trigger the Annotation Extraction of the PDF file currently selected in Finder, or if it is open in PDF Expert or Highlights.
- Alternatively, you can use the Alfred keyword `anno` to select a PDF from which to extract the annotations. (Uses your [Alfred default search scope](https://www.alfredapp.com/help/features/default-results/#search-scope).)

__Annotation Types extracted__
- Highlights
- Underlines
- Free Comments
- Strikethroughs
- Rectangles (as Images)

Highlights, Underlines, Strikethroughs are extracted as blockquotes when they  have no comments, and as annotated quote when they have a comment. Highlights and Underlines are extracted in visually the same way, while Strikethroughs are extracted as Markdown Strikethroughs.

### Automatic Page Number Identification
Instead of the PDF page numbers, this workflow retrieves information about the *real* page numbers from the BibTeX library and inserts them. If there is no page data in the BibTeX entry (e.g., monographies), you are prompted to enter the page number manually.
- In that case, enter the __real page number__ of your __first PDF page__.
- In case there is content before the actual text (e.g., a foreword or Table of Contents), the real page number `1` often occurs later in the PDF. In that case, you must enter a __negative page number__, reflecting the true page number the first PDF would have. *Example: Your PDF is a book which has a foreword, and uses roman numbers for it; real page number 1 is PDF page number 12. If you continued the numbering backwards, the first PDF page would have page number `-10`, you enter the value `-10` when prompted for a page number.*

### Annotation Codes
Insert these special codes at the __beginning__ of an annotation to invoke special actions on that annotation. Annotation Codes do not apply to Strikethroughs. (You can run the Alfred command `acode` to display a cheat sheet showing all the following information.)

- `+`: Merge this highlight/underline with the previous highlight/underline.
	- Both annotations on the same page: puts a "(…)" in between them. This is useful to omit certain parts of text. Used for jumping sections on the same page.
	- The second annotation is on the following page: Assuming a continuation of a highlight/underline across page borders, this does not insert a `(…)`. However, both pages are inserted in the Pandoc citation, e.g. `[Grieser2020, p. 14-15]`.
- `? foo` __(free comments)__: Turns "foo" into a [Question Callout](https://help.obsidian.md/How+to/Use+callouts)  (`> ![QUESTION]`) and move up. (Callouts are Obsidian-specific Syntax.)
- `##`: Turns highlighted/underlined text into a __heading__ that is added at that location. The number of `#` determines the heading level. If the annotation is a free comment, the text following the `#` is used as heading instead (Space after `#` required).
- `---` __(free comments)__: Inserts a markdown __hr__ (`---`) and removes the annotation.
- `X` Turns highlighted/underlines text into a markdown __task__ (`- [ ]`) and move up. If the annotation is a free comment, the text following the `X` is used as task text.
- `=`: Adds highlighted/underlined text as __tags__ to the YAML-frontmatter (mostly used for Obsidian as output). If the annotation is a free comment, uses the text after the `=`. In both cases, the annotation is removed afterwards.
- `_` __(highlights only)__: Removes the `_` and creates a copy of the annotation, but with the type `underline`. Intended for use when the split-off of underlines is enabled, and does nothing if it is disabled. This annotation code avoids having to highlight *and* underline the same text segment to have it in both places.

### Extracting Images
- Extracting images only works in Obsidian. The respective images is saved in the `attachments` subfolder of the Obsidian destination folder, and named `{citekey}_image{n}.png`.
- The images is embedded in the markdown file with the `![[ ]]` syntax, e.g. `![[filename.png|foobar]]`
- Any `rectangle` type annotation in the PDF is extracted as image.
- If the rectangle annotation has any comment, it is used as the alt-text for the image. (Note that some PDF readers like PDF Expert do not allow you to add a comment to rectangular annotations.)

## Troubleshooting
- Update to the latest version of `pdfannots2json` by running the following Terminal command `brew upgrade pdfannots2json` in your terminal.
- This workflow won't work with annotations that are not actually saved in the PDF file. Some PDF Readers like __Skim__ or __Zotero 6__ do this, but you can [tell those PDF readers to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)
- This workflow sometimes does not work when the PDF contains bigger free-form annotations (e.g., from using a stylus on a tablet). Delete all those annotations that are "free form" and the workflow should work.
- When the hotkey does not work when triggered in Preview, most likely the Alfred app does not have permission to access the app. You can give Alfred permission in the macOS System Settings:
<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=30%>
- There are some cases where the extracted text is all jumbled up. In that case, it's a is a problem with the upstream `pdfannots2json`. [The issue is tracked here](https://github.com/mgmeyers/pdfannots2json/issues/11), and you can also report your problem.

> __Note__  
> As a fallback, you can use `pdfannots` as extraction engine, as a different PDF engine sometimes fixes issues. This requires installing [pdfannots](https://github.com/mgmeyers/pdfannots2json/issues/11) via `pip3 install pdfannots`, and switching the fallback engine via `aconf`. Note that `pdfannots` does not support image extraction or extracting only recent annotations, so generally you want to keep using `pdfannots2json`.

## Credits

### Thanks
- Thanks to [Andrew Baumann for pdfannots](https://github.com/0xabu/pdfannots), which caused me to develop this workflow (even though it does not use `pdfannots` anymore).
- Also many thanks to [@mgmeyers for pdfannots2json](https://github.com/mgmeyers/pdfannots2json/), which enabled many improvements to this workflow.
- I also thank [@StPag](https://github.com/stefanopagliari/) for his ideas on annotation codes.
- <a href="https://www.flaticon.com/authors/freepik">Icons created by Freepik/Flaticon.</a>

<!-- vale Google.FirstPerson = NO -->
### About the Developer
In my day job, I am a sociologist studying the social mechanisms underlying the digital economy. For my PhD project, I investigate the governance of the app economy and how software ecosystems manage the tension between innovation and compatibility. If you are interested in this subject, feel free to get in touch!

<!-- markdown-link-check-disable -->
- [Academic Website](https://chris-grieser.de/)
- [Discord](https://discordapp.com/users/462774483044794368/)
- [GitHub](https://github.com/chrisgrieser/)
- [Twitter](https://twitter.com/pseudo_meta)
- [ResearchGate](https://www.researchgate.net/profile/Christopher-Grieser)
- [LinkedIn](https://www.linkedin.com/in/christopher-grieser-ba693b17a/)

### Donate
<a href='https://ko-fi.com/Y8Y86SQ91' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
