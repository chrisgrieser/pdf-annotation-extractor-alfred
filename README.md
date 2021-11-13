# PDF Annotation Extractor (Alfred Workflow)

![](https://img.shields.io/github/downloads/chrisgrieser/pdf-annotation-extractor-alfred/total?label=Total%20Downloads&style=plastic)  ![](https://img.shields.io/github/v/release/chrisgrieser/pdf-annotation-extractor-alfred?label=Latest%20Release&style=plastic)

An [Alfred Workflow](https://www.alfredapp.com/) to extract Annotations as Markdown & insert Pandoc Citations as References. Outputs Annotations to [Obsidian](https://obsidian.md/), [Drafts](https://getdrafts.com/), PDF, Markdown file, or simply the clipboard.

Automatically determines correct page numbers, merges highlights across page breaks, prepends a YAML Header bibliographic information, and some more small Quality-of-Life things.

<img src="https://user-images.githubusercontent.com/73286100/132963514-f08463cb-de2a-45d2-80fb-8c29afa35fb8.gif" alt="PDF Annotation Extractor" width=60%>

## Table of Contents

<!-- MarkdownTOC autolink="true" levels="2" -->

- [How to Use](#how-to-use)
- [Annotation Codes](#annotation-codes)
- [Extra Features](#extra-features)
- [Requirements & Installation](#requirements--installation)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)

<!-- /MarkdownTOC -->

## How to Use
- Use the **hotkey** to trigger the Annotation Extraction of the frontmost document of Preview or PDF Expert. In case Finder is the frontmost app, the currently selected pdf file will be used. 
- **Automatic Page Number Identification**: the *correct* page numbers will automatically be determined from your BibTeX-Library and inserted into the references. If the page number cannot be determined, the PDF will be scanned for a DOI to query the correct page numbers. If this fails as well, you will be asked to enter the **first** page number of your PDF, e.g. with `Nature 20(41): 103-145` you have to enter `103`.
- use the Alfred keyword `aconf` to for configuration of this workflow
  -  the output format (PDF, Markdown, Clipboard, [Drafts](https://getdrafts.com/), or [Obsidian](https://obsidian.md/)). When selecting Markdown or Obsidian as output format, a YAML-Header with information from your BibTeX Library will be prepended. 
  -  set whether citekeys should be entered manually or determined automatically via filename. The latter requires a filename beginning with the citekey, followed by an underscore:`[citekey]_[...].pdf`. You can easily achieve such a filename pattern with via renaming rules of most reference managers, for example with the [ZotFile plugin for Zotero](http://zotfile.com/#renaming-rules).
  -  the Obsidian destination (must be a folder in your vault)

ℹ️ : This workflow **only extracts free comments and highlights with comments**.

## Annotation Codes
Insert these special codes at the **beginning** of an annotation to invoke special actions on that annotation. You can run the Alfred command `acode` to display a quick cheat sheet showing all these.

- `+` **(highlights)**: Merge with previous highlight and puts a "(…)" in between. Used for jumping sections on the same page. If jumping across pages, both Pages will be included in the citation.
- `++` **(highlights)**: Merge with previous highlight. Used for continuing a highlight on the next page. Both Pages will be included in the citation.
- `? foo` **(comments)**: Turns "foo" into h6 & move up to the top. Removes the comment afterwards. Used for Introductory Comments or Questions ("Pseudo-Admonitions").
- `##` **(highlights)**: Turns highlight into heading added at that location. Number of "#" determines the heading level.
- `## foo` **(comments)**: Adds "foo" as heading at that location. Number of "#" determines the heading level.
- `X` **(highlights)**: Turns highlight into task and move up. Removes the comment afterwards.
- `X foo` **(comments)**: Turns "foo" into task and move up. Removes the comment afterwards.
- `!n foo` **(comments)**: Insert nth image taken with the image-hotkey at the location of the comment location. "n" being the number of images taken, e.g. "!3" for the third image. "foo" will be added as image alt-text (image label). Removes the comment afterwards.
- `=` **(highlights)**: Adds highlight as keyword to the YAML-frontmatter. Removes the highlight afterwards
- `= foo` **(comments)**: Adds "foo" as keyword to the YAML-frontmatter. Removes the comment afterwards.

ℹ️ **multi-line-annotations** only work in highlights for now, but not yet in free comments.

## Extra Features
- When using Obsidian, the wikilink is also copied to the clipboard
- With the output type set to Obsidian or Markdown, a YAML-Header with bibliographic information (author, title, citekey, year, keywords, etc.) is also prepended.
- When manually entering the number of the first page, *negative* page numbers are accepted. This is useful for books and reports where there are some PDF pages before the first page, e.g. due to a preface. 

## Requirements & Installation

### Requirements
- Alfred (Mac only)
- [Alfred Powerpack](https://www.alfredapp.com/shop/) (~30€)
- References saved as BibTeX-Library (`.bib`)

### Install the following Third-Party-Software

Don't be discouraged if you are not familiar with the Terminal. Just copypaste the following code into your Terminal and press enter – there is nothing more you have to do. (It may take a moment to download and install everything.)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python3
brew install python3

# Install pip3
curl -s https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
rm get-pip.py

# CLIs needed for Annotation Extraction
pip3 install pdfminer.six
pip3 install pdfannots
brew install pdfgrep
```

### Download & Install the [PDF Annotation Extractor Workflow](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/releases/latest/).

### Define the Hotkey by double-clicking this field
<img width=18% alt="Set Hotkey" src="https://user-images.githubusercontent.com/73286100/132960488-a60eff61-16a9-42cf-801f-c42612fbfb5e.png">

### Set BibTeX Library Path
- using the `aconf` command, select `Set BibTeX Library`, and then search/select your `.bib` file

### Further steps only required for specific output types
- _Obsidian as Output_: Use the `aconf` command, select `Obsidian Destination`, and then search/select the folder .
- _PDF as Output Format_: Install Pandoc and a [PDF-Engine](https://pandoc.org/MANUAL.html#option--pdf-engine) of your choice.

```bash
brew install pandoc
brew install wkhtmltopdf # can be changed to a pdf-engine of your choice
```

## Troubleshooting 
- Upgrade to the newest version of pdfannots: `pip3 install --upgrade pdfannots`
- This workflow won't work with annotations that are not actually saved in the PDF file. Some PDF Readers like **Skim** do this, but you can [tell those PDF readers to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)
- The workflow sometimes does not work when the pdf contains bigger free-form annotations (e.g. from using a stylus on a tablet to). Delete all annotations that are "image" or "free form" and the workflow should work again.
- Do not use backticks (`` ` ``) in any type of comment – this will break the annotation extraction.
- When the hotkey does not work in Preview, most likely the Alfred app does not have permissions to access Preview. You can give Alfred permission in the Mac OS System Settings.
<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=30%> 

➡️ When you cannot resolve the problem, please [open an GitHub issue](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/issues). Be sure to include screenshots and/or a debugging log, as I will not be able to help you otherwise. You can get a debugging log by opening the workflow in Alfred preferences and pressing `cmd + D`. A small window will open up which will log everything happening during the execution of the Workflow. Use the malfunctioning part of the workflow once more, copy the content of the log window, and attach it as text file.

## Credits
### Thanks
- Thanks to [Andrew Baumann for pdfannots](https://github.com/0xabu/pdfannots) without which this Alfred Workflow would not be possible.
- Thanks to @StPag from the Obsidian Discord Server for his ideas on annotation codes.

### Donations 🙏
- [PayPal](https://www.paypal.com/paypalme/ChrisGrieser)
- [Ko-Fi](https://ko-fi.com/pseudometa)

### About the Author
This workflow has been created by [@pseudo_meta (Twitter)](https://twitter.com/pseudo_meta) aka Chris Grieser (rl). In my day job, I am a PhD student in sociology, studying the governance of the app economy. If you are interested in this subject, check out [my academic homepage](https://chris-grieser.de/) and get in touch.
