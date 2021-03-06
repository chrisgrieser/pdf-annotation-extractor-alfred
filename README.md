# PDF Annotation Extractor (Alfred Workflow)

![](https://img.shields.io/github/downloads/chrisgrieser/pdf-annotation-extractor-alfred/total?label=Total%20Downloads&style=plastic) ![](https://img.shields.io/github/v/release/chrisgrieser/pdf-annotation-extractor-alfred?label=Latest%20Release&style=plastic)

An [Alfred Workflow](https://www.alfredapp.com/) to extract annotations as Markdown & insert Pandoc Citations as References. Outputs annotations to [Obsidian](https://obsidian.md/), [Drafts](https://getdrafts.com/), or a Markdown file.

Automatically determines correct page numbers, merges highlights across page breaks, prepends a YAML Header bibliographic information, and some more small Quality-of-Life conveniences.
<img src="https://user-images.githubusercontent.com/73286100/132963514-f08463cb-de2a-45d2-80fb-8c29afa35fb8.gif" alt="PDF Annotation Extractor" width=60%>

## Table of Contents
<!-- MarkdownTOC -->

- [Breaking Changes](#breaking-changes)
- [Requirements & Installation](#requirements--installation)
- [How to Use](#how-to-use)
	- [Basics](#basics)
	- [Annotation Types extracted](#annotation-types-extracted)
	- [Automatic Page Number Identification](#automatic-page-number-identification)
	- [Automatic Citekey Identification](#automatic-citekey-identification)
	- [Annotation Codes](#annotation-codes)
- [Extracting Images](#extracting-images)
- [Extra Features](#extra-features)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Thanks & Credits](#thanks--credits)
- [About the Developer](#about-the-developer)
	- [Profiles](#profiles)
	- [Donate](#donate)

<!-- /MarkdownTOC -->

## Breaking Changes
⚠️ The newest version 6.0 requires `pdfannot2json` instead of `pdfannots` as it has more features.

⚠️ With 6.3 some niche features (PDF output, clipboard output, annotations from PDFs not in the BibTeX library) I personally never use have been removed, since I am simply not able to maintain them anymore given my time capacities. Use an older release (up to 6.2) if you want to continue using those features; also many PDF Readers like PDF Expert or Highlights are able to do exactly that.

## Requirements & Installation
1. Requirements
	- [Alfred Powerpack](https://www.alfredapp.com/shop/) (~30€)
	- References saved as BibTeX-Library (`.bib`)
2. Install [Homebrew](https://brew.sh/).
3. Install `pdfannots2json` by pasting the following into your terminal:

	```bash
	brew tap mgmeyers/pdfannots2json
	brew install pdfannots2json
	```

4. Download this Alfred Workflow
	- Download and install the [PDF Annotation Extractor Workflow](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/releases/latest/) by double-clicking it.

5. Required Configuration
	- Using the `aconf` command, select `Set BibTeX Library`, and then search/select your `.bib` file. The file has to be in your Alfred Search Scope for this to work; alternatively you can also set the path manually. ([➡️ How to set environment variables in Alfred](https://www.alfredapp.com/help/workflows/advanced/variables/#environment)).
	- Using `aconf`, set an output style (Obsidian, Drafts, or Markdown File). Note that Obsidian as output format requires that you also set a destination folder.
	- Set the Hotkey by double-clicking this field:
	<img width=18% alt="Set Hotkey" src="https://user-images.githubusercontent.com/73286100/132960488-a60eff61-16a9-42cf-801f-c42612fbfb5e.png">

## How to Use
The PDF Annotation Extractor works on any PDF that has valid annotations saved *in the PDF file*. Some PDF readers like __Skim__ or __Zotero 6__ do not store annotations int eh PDF itself by default, but usually, you can [tell those PDF readers to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)

### Basics
- Use the hotkey to trigger the Annotation Extraction of the PDF file currently selected in Finder. (If PDF Expert is the frontmost app, it also works with the frontmost document.)
- Alternatively, you can use the Alfred keyword `anno` to select a PDF from which to extract the annotations. (Uses your [Alfred default search scope](https://www.alfredapp.com/help/features/default-results/#search-scope).)

### Annotation Types extracted
- Highlights
- Underlines
- Free Comments
- Strikethroughs
- Rectangles (as Images)

Highlights, Underlines and Strikethroughs are extracted as blockquotes when the have no comments, and as annotated quote when they have a comment. Highlights and Underlines are extracted in visually the same way, while Strikethroughs are extracted as Markdown Strikethroughs.

### Automatic Page Number Identification
Instead of the PDF page numbers, this workflow retrieves information on the *real* page numbers from the BibTeX library and inserts them. If there is no page data in the BibTex entry (e.g. monographies), you are prompted to enter the page number manually.
- In that case, enter the __real page number__ of your __first PDF page__. *Example: if the first PDF page represents the page number 104, you have to enter `104`.*
- In case there is content before the actual text (e.g. a foreword or Table of Contents), the real page number `1` often occurs later in the PDF. In that case, you must enter a __negative page number__, reflecting the true page number the first PDF would have. *Example: Your PDF is a book which has a foreword, and uses roman numbers for it; real page number 1 is PDF page number 12. If you continued the numbering backwards, the first PDF page would have page number `-10`. So you enter the value `-10` when prompted for a page number.*

### Automatic Citekey Identification
If the filename of the pdf is *exactly* the citekey (optionally followed by an underscore and some text like `{citekey}_{title}.pdf`), the citekey for the bibliographic information will be automatically determined. Otherwise, you have to enter the citekey manually. [You can turn off automatic citekey identification via `aconf`, see (section Configuration](#configuration).)

You can easily achieve such a filename pattern with via renaming rules of most reference managers, for example with the [ZotFile plugin for Zotero](http://zotfile.com/#renaming-rules) or the [AutoFile feature of BibDesk](https://bibdesk.sourceforge.io/manual/BibDeskHelp_77.html#SEC140).

### Annotation Codes
Insert these special codes at the __beginning__ of an annotation to invoke special actions on that annotation. Annotation Codes do not apply to Strikethroughs. (You can run the Alfred command `acode` to quickly display a cheat sheet showing all the following information.)

- `+`: Merge this highlight/underline with the previous highlight/underline.
	- Both annotations on the same page: will put a "(…)" in between them. This is useful to leave out certain parts of text.  Used for jumping sections on the same page.
	- The second annotation is on the following page: Assuming a continuation of a highlight/underline across page borders, this will not insert a "(…)". However, both pages will be inserted in the Pandoc citation, e.g. `[Grieser2020, p. 14-15]`.
- `? foo` __(free comments)__: Turns "foo" into a [Question Callout](https://help.obsidian.md/How+to/Use+callouts)  (`> ![QUESTION]`) and move up. (Callouts are Obsidian-specific Syntax.)
- `##`: Turns highlighted/underlined text into a __heading__ that is added at that location. The number of `#` determines the heading level. If the annotation is a free comment, the text following the `#` is used as heading instead (Space after `#` required).
- `---` __(free comments)__: Inserts a markdown __hr__ (`---`) and removes the annotation.
- `X` Turns highlighted/underlines text into a markdown __task__ (`- [ ]`) and move up. If the annotation is a free comment, the text following the `X` will be used as task text.
- `=`: Adds highlighted/underlined text as __tags__ to the YAML-frontmatter (mostly used for Obsidian as output). If the annotation is a free comment, uses the text after the `=`. In both cases, the annotation is removed afterwards.
- `_` __(highlights only)__: Removes the `_` and creates a copy of the annotation, but with the type `underline`. Intended for use when the split-off of underlines is enabled, and will do nothing if it is disabled. This annotation code avoids having to highlight *and* underline the same text segment to have it in both places.
- `()`: Removes the `()` and shortens the highlighted/underlined text by removing all content between parentheses, leaving only "()" as indicators that there is more content in the original quote. This is useful when quoting a passage which contains a high number of references which can decrease readability of the highlighted/underlined text segment. For example, the first passage will be transformed to the second.

```md
While heterogeneity can lead to lower team functioning due to arising faultlines (Ndofor et al., 2015) and conflict between team members due to a lack of understanding (Miller et al., 1998), heterogeneity can also broaden a team's knowledge base (van Knippenberg et al., 2004), thus increasing organizational performance (Higgins and Gulati, 2003; Wei and Wu, 2013).
```

```md
While heterogeneity can lead to lower team functioning due to arising faultlines () and conflict between team members due to a lack of understanding (), heterogeneity can also broaden a team's knowledge base (), thus increasing organizational performance ().
```

## Extracting Images
- Extracting images only works in Obsidian. The respective images will be saved in the `attachments` subfolder of the Obsidian destination folder, and named `{citekey}_image{n}.png`.
- The images will be embedded in the markdown file with the `![[ ]]` syntax, e.g. `![[filename.png|foobar]]`
- Any `rectangle` type annotation in the PDF will be extracted as image.
- If the rectangle annotation has any comment, it will be used as the alt-text for the image. (Note that some PDF readers like PDF Expert do not allow you to add a comment to rectangular annotations.)

## Extra Features
- When using Obsidian, the wikilink (`[[filename]]`) is also copied to the clipboard after annotation extraction, for convenient adding to a Map of Content.
- With the output type set to Obsidian or Markdown file, a YAML-Header with bibliographic information (author, title, citekey, year, keywords, etc.) is also prepended.

## Configuration
Use the Alfred keyword `aconf` to configure this workflow. The various options are explained there.

## Troubleshooting
- Update to the latest version of `pdfannots2json` by running the following Terminal command:

	```bash
	brew upgrade pdfannots2json
	```

- This workflow won't work with annotations that are not actually saved in the PDF file. Some PDF Readers like __Skim__ or __Zotero 6__ do this, but you can [tell those PDF readers to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)
- This workflow sometimes does not work when the pdf contains bigger free-form annotations (e.g. from using a stylus on a tablet). Delete all those annotations that are "free form" and the workflow should work.
- When the hotkey does not work when triggered in Preview, most likely the Alfred app does not have permission to access the app. You can give Alfred permission in the Mac OS System Settings:
<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=30%>

- There are some cases where the extracted text is all jumbled up. In that case, it's a is a problem with the upstream `pdfannots2json`. [The issue is tracked here](https://github.com/mgmeyers/pdfannots2json/issues/11), and you can also report your problem.
- As a fallback, you can use `pdfannots` as extraction engine, as a different PDF engine sometimes fixes issues. This requires installing [pdfannots](https://github.com/mgmeyers/pdfannots2json/issues/11) via `pip3 install pdfannots`, and switching the fallback engine via `aconf`. Note that `pdfannots` does not support image extraction or extracting only recent annotations, so generally you want to keep using `pdfannots2json`.

ℹ️ When you cannot resolve the problem, please [open an GitHub issue](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/issues).

## Thanks & Credits
- Thanks to [Andrew Baumann for pdfannots](https://github.com/0xabu/pdfannots), which caused me to develop this workflow (even though it does not use `pdfannots` anymore).
- Also many thanks to [@mgmeyers for pdfannots2json](https://github.com/mgmeyers/pdfannots2json/), which enabled many improvements to this workflow.
- I also thank [@StPag](https://github.com/stefanopagliari/) for his ideas on annotation codes.
- <a href="https://www.flaticon.com/authors/freepik">Icons created by Freepik/Flaticon.</a>

## About the Developer
In my day job, I am a sociologist studying the social mechanisms underlying the digital economy. For my PhD project, I investigate the governance of the app economy and how software ecosystems manage the tension between innovation and compatibility. If you are interested in this subject, feel free to get in touch!

<!-- markdown-link-check-disable -->
### Profiles
- [Academic Website](https://chris-grieser.de/)
- [Discord](https://discordapp.com/users/462774483044794368/)
- [GitHub](https://github.com/chrisgrieser/)
- [Twitter](https://twitter.com/pseudo_meta)
- [ResearchGate](https://www.researchgate.net/profile/Christopher-Grieser)
- [LinkedIn](https://www.linkedin.com/in/christopher-grieser-ba693b17a/)

### Donate
<a href='https://ko-fi.com/Y8Y86SQ91' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

If you feel very generous, you may also buy me something from my Amazon wish list. But please donate something to developers who still go to college, before you consider buying me an item from my wish list! 😊

[Amazon wish list](https://www.amazon.de/hz/wishlist/ls/2C7RIOJPN3K5F?ref_=wl_share)

---

[⬆️ Go Back to Top](#Table-of-Contents)
