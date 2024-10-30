# PDF Annotation Extractor
![Download count](https://img.shields.io/github/downloads/chrisgrieser/pdf-annotation-extractor-alfred/total?label=Total%20Downloads&style=plastic)
![Last release](https://img.shields.io/github/v/release/chrisgrieser/pdf-annotation-extractor-alfred?label=Latest%20Release&style=plastic)

A [Workflow for Alfred](https://www.alfredapp.com/) to extract annotations as
Markdown file. Primarily for scientific papers, but can also be used for
non-academic PDF files.

Automatically determines correct page numbers, inserts them as Pandoc citations,
merges highlights across page breaks, prepends a YAML header with bibliographic
information, and more.

## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Requirements for the PDF](#requirements-for-the-pdf)
  * [Automatic citekey identification](#automatic-citekey-identification)
- [Usage](#usage)
  * [Basics](#basics)
  * [Automatic Page Number Identification](#automatic-page-number-identification)
  * [Annotation Codes](#annotation-codes)
  * [Extracting Images](#extracting-images)
- [Troubleshooting](#troubleshooting)
- [Cite this software project](#cite-this-software-project)
- [Credits](#credits)
- [About the developer](#about-the-developer)

<!-- tocstop -->

## Installation
- Requirement: [Alfred 5](https://www.alfredapp.com/) with Powerpack
- Install [Homebrew](https://brew.sh/)
- Install `pdfannots2json` by running the following command into your terminal:
  `brew install mgmeyers/pdfannots2json/pdfannots2json`
- Download the [latest release](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/releases/latest/).
- Set the hotkey by double-clicking the sky-blue field at the top left.
- Set up the workflow configuration inside the app.

## Requirements for the PDF
`PDF Annotation Extractor` works on any PDF that has valid annotations
saved *in the PDF file*. Some PDF readers like **Skim** or **Zotero 6** do not
store annotations in the PDF itself by default.

This workflow automatically determines the citekey of based on the filename of
your PDF file.
- If the citekey is found, the `PDF Annotation Extractor`
prepends a yaml header to the annotations and [automatically
inserts the citekey](#automatic-page-number-identification) with the correct
page numbers using the [Pandoc citations
syntax](https://pandoc.org/MANUAL.html#citation-syntax).
- If your filename does not contain citekey that can be found in
  your library, the `PDF Annotation Extractor` extracts the annotations without
  a yaml header and uses the PDF numbers as page numbers.

### Automatic citekey identification
- The filename of the PDF file MUST begin with the citekey (without `@`).
- The citekey MUST NOT contain any underscores (`_`).
- The name of the file MAY be followed by an underscore and some
  text, such as `{citekey}_{title}.pdf`. It MUST NOT be followed by anything
  else, since then the citekey would not be found.
- Example: With the filename, `Grieser2023_Interdependent Technologies.pdf`, the
  identified citekey is `Grieser2023`.

> [!TIP]
> You can achieve such a filename pattern with automatic renaming rules of most
> reference managers, for example with the [ZotFile plugin for
> Zotero](http://zotfile.com/#renaming-rules) or the [AutoFile feature of
> BibDesk](https://bibdesk.sourceforge.io/manual/BibDeskHelp_77.html#SEC140).

## Usage

### Basics
Use the [hotkey](https://www.alfredapp.com/help/workflows/triggers/hotkey/) to
trigger the Annotation Extraction on the PDF file currently selected in Finder.
The hotkey also works when triggered from [PDF Expert](https://pdfexpert.com/)
or [Highlights](https://highlightsapp.net/). Alternatively, use the
`anno` keyword to search for PDFs and select one.

**Annotation Types extracted**
- Highlight ➡️ bullet point, quoting text and prepending the comment as bold text
- Free Comment ➡️ blockquote of the comment text
- Strikethrough ➡️ Markdown strikethrough
- Rectangle ➡️ [extracts image and inserts Markdown image link at the respective
  place](#extracting-images)
- Underlines ➡️ sent to `Reminders.app` as a task due today in the default list

### Automatic Page Number Identification
Instead of the PDF page numbers, this workflow retrieves information about the
*real* page numbers from the BibTeX library and inserts them. If there is no
page data in the BibTeX entry (for example, monographies), you are prompted to
enter the page number manually.
- In that case, enter the **real page number** of your **first PDF page**.
- In case there is content before the actual text (for example, a foreword or
  Table of Contents), the real page number `1` often occurs later in the PDF. If
  that is the case, you must enter a **negative page number**, reflecting the
  true page number the first PDF would have. *Example: Your PDF is a book, which
  has a foreword, and uses roman numbers for it; real page number 1 is PDF page
  number 12. If you continued the numbering backwards, the first PDF page would
  have page number `-10`, you enter the value `-10` when prompted for a page
  number.*

### Annotation Codes
Insert the following codes at the **beginning** of an annotation to invoke
special actions on that annotation. Annotation codes do not apply to
strikethroughs.

- `+`: Merge this highlight with the previous highlight or underline. Works for
  annotations on the same PDF-page (= skipping text in between) and for
  annotations across two pages.
  * `? foo` **(free comments)**: Turns "foo" into a Question
  Callout (`> ![QUESTION]`) and move up. (Callouts are [Obsidian-specific
  Syntax](https://help.obsidian.md/How+to/Use+callouts).)
- `##`: Turns highlighted text into a **heading** that is added at that
  location. The number of `#` determines the heading level. If the annotation is
  a free comment, the text following the `#` is used as heading instead. (The
  space after the is `#` required).
- `=`: Adds highlighted text as **tags** to the YAML frontmatter. If the
  annotation is a free comment, uses the text
  after the `=`. In both cases, the annotation is removed afterward.
- `_`: A copy of the annotation is sent `Reminders.app` as a task due today
  (default list).

> [!TIP]
> You can run the Alfred command `acode` to display a cheat sheet of all
> annotation codes.

### Extracting Images
- The respective images are saved in the `attachments` sub-folder of the output
  folder, and named `{citekey}_image{n}.png`.
- The images are embedded in the markdown file with the `![[ ]]` syntax, for
  example `![[filename.png|foobar]]`.
<!-- LTeX: enabled=false -->
- Any `rectangle` type annotation in the PDF is extracted as image.
<!-- LTeX: enabled=true -->
- If the rectangle annotation has any comment, it is used as the alt-text for
  the image. (Note that some PDF readers like PDF Expert do not allow you to add
  a comment to rectangular annotations.)

## Troubleshooting
- Update to the latest version of `pdfannots2json` by running
  `brew upgrade pdfannots2json` in your terminal.
- This workflow does not work with annotations that are not actually saved in
  the PDF file. Some PDF Readers like **Skim** or **Zotero 6** do this, but you
  can [tell those PDF readers to save the notes in the actual
  PDF](https://skim-app.sourceforge.io/manual/SkimHelp_45.html).

> [!NOTE]
> As a fallback, you can use `pdfannots` as extraction engine, as a different
> PDF engine sometimes fixes issues. This requires installing
> [pdfannots](https://github.com/mgmeyers/pdfannots2json/issues/11) via `pip3
> install pdfannots`, and switching the fallback engine in the settings. Note
> that `pdfannots` does not support image extraction and the extraction quality
> is slightly worse, so generally you want to use `pdfannots2json`.

## Cite this software project
If you want to mention this software project in an academic publication, please
cite it as:

```txt
Grieser, C. (2023). PDF Annotation Extractor [Computer software]. 
https://github.com/chrisgrieser/pdf-annotation-extractor-alfred
```

For other citation styles, use the following metadata: [Citation File
Format](./CITATION.cff).

<!-- vale Google.FirstPerson = NO -->
## Credits
- To [Andrew Baumann for pdfannots](https://github.com/0xabu/pdfannots), which
  caused me to develop this workflow (even though it does not use `pdfannots`
  anymore).
- Also, many thanks to [@mgmeyers for
  pdfannots2json](https://github.com/mgmeyers/pdfannots2json/), which enabled
  many improvements to this workflow.
- I also thank [@StPag](https://github.com/stefanopagliari/) for his ideas on
  annotation codes.
- [Icons created by Freepik/Flaticon](https://www.flaticon.com/authors/freepik)

## About the developer
In my day job, I am a sociologist studying the social mechanisms underlying the
digital economy. For my PhD project, I investigate the governance of the app
economy and how software ecosystems manage the tension between innovation and
compatibility. If you are interested in this subject, feel free to get in touch.

- [Academic Website](https://chris-grieser.de/)
- [Mastodon](https://pkm.social/@pseudometa)
- [ResearchGate](https://www.researchgate.net/profile/Christopher-Grieser)
- [LinkedIn](https://www.linkedin.com/in/christopher-grieser-ba693b17a/)

<a href='https://ko-fi.com/Y8Y86SQ91' target='_blank'>
<img
	height='36'
	style='border:0px;height:36px;'
	src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3'
	border='0'
	alt='Buy Me a Coffee at ko-fi.com'
/></a>
