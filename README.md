# PDF Annotation Extractor (Alfred Workflow)

![](https://img.shields.io/github/downloads/chrisgrieser/pdf-annotation-extractor-alfred/total?label=Total%20Downloads&style=plastic)  ![](https://img.shields.io/github/v/release/chrisgrieser/pdf-annotation-extractor-alfred?label=Latest%20Release&style=plastic)

An [Alfred Workflow](https://www.alfredapp.com/) to extract Annotations as Markdown & insert Pandoc Citations as References. Outputs Annotations to [Obsidian](https://obsidian.md/), [Drafts](https://getdrafts.com/), PDF, Markdown file, or simply the clipboard.

Automatically determines correct page numbers, merges highlights across page breaks, prepends a YAML Header bibliographic information, and some more small Quality-of-Life things.

<img src="https://user-images.githubusercontent.com/73286100/132963514-f08463cb-de2a-45d2-80fb-8c29afa35fb8.gif" alt="PDF Annotation Extractor" width=60% height=60%>

## Table of Content
- [How to Use](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#how-to-use)
- [Special Features](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#special-features)
- [Requirements & Installation](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#requirements--installation)
- [Troubleshooting](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#troubleshooting)
- [Credits](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#credits)

## How to Use
- Use the **hotkey** to trigger the Annotation Extraction of the frontmost document of Preview or PDF Expert. In case Finder is the frontmost app, the currently selected pdf file will be used. 
- **Automatic Page Number Identification**: the *correct* page numbers will automatically be determined from your BibTeX-Library and inserted into the references. If the page number cannot be determined, the PDF will be scanned for a DOI to query the correct page numbers. If this fails as well, you will be asked to enter the **first** page number of your PDF, e.g. with `Nature 20(41): 103-145` you have to enter `103`.
- use the Alfred keyword `aconf` to for configuration of this workflow
  -  the output format (PDF, Markdown, Clipboard, [Drafts](https://getdrafts.com/), or [Obsidian](https://obsidian.md/)). When selecting Markdown or Obsidian as output format, a YAML-Header with information from your BibTeX Library will be prepended. 
  -  set whether citekeys should be entered manually or determined automatically via filename. The latter requires a filename beginning with the citekey, followed by an underscore:`[citekey]_[...].pdf`. You can easily achieve such a filename pattern with via renaming rules of most reference managers, for example with the [ZotFile plugin for Zotero](http://zotfile.com/#renaming-rules)).
  -  the Obsidian destination (must be a folder in your vault)
  -  select the number of columns your PDF has

ℹ️ _Caveat: Right now, this workflow **only extracts free comments and highlights with comments**. More will be implemented in the future (this workflow has automatic updates so you will not miss it)._

## Special Features
- **automatically merge highlights that span two pages**: give the **second** highlight **exactly** the comment `c` (for "continue") and the two highlights will be merged. The comment from the first highlight will be preserved, and both page numbers will be referenced.
- **automatically merge highlights on one page**: If you just want to leave out some text _on the same page_, do the same as above but use `j` (for "join") instead. The PDF Annotation Extractor will then input a "[...]", join the two highlights, and use the comment of the first highlight.
- When using Obsidian, the wikilink is also copied to the clipboard
- With the output type set to Obsidian or Markdown, a YAML-Header with bibliographic information (author, title, citekey, year, keywords, etc.) is also prepended.
- When manually entering the number of the first page, *negative* page numbers are accepted. This is useful for books and reports where there are some PDF pages before the first page, e.g. due to a preface. 

## Requirements & Installation

**0) Requirements**
- Alfred (Mac only)
- [Alfred Powerpack](https://www.alfredapp.com/shop/) (~30€)
- References saved as BibTeX-Library (`.bib`)

**1) Install the following Third-Party-Software**

Don't be discouraged if you are not familiar with the Terminal. Just copypaste the following code into your Terminal and press enter – there is nothing more you have to do. (It may take a moment to download and install everything. )

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

**2) Download & Install the [PDF Annotation Extractor Workflow](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/releases/latest/)**.

**3) Define the Hotkey by double-clicking this field**

<img width=18% alt="Screenshot 2021-09-11 22 12 14" src="https://user-images.githubusercontent.com/73286100/132960488-a60eff61-16a9-42cf-801f-c42612fbfb5e.png">

**4) Set BibTeX Library Path**
- using the `aconf` command, select `Set BibTeX Library`, and then search/select your `.bib` file

**5) optional: further steps only required for specific output types**
- _Obsidian as Output_: Use the `aconf` command, select `Obsidian Destination`, and then search/select the folder 
- _PDF as Output Format_: Install Pandoc and a [PDF-Engine](https://pandoc.org/MANUAL.html#option--pdf-engine) of your choice

```bash
brew install pandoc
brew install wkhtmltopdf # can be changed to a pdf-engine of your choice
```

## Troubleshooting 
- This workflow won't work with annotations that are not actually saved in the PDF file. Some PDF Readers like **Skim** do this, but you can [tell those PDF readers to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)
- The workflow sometimes does not work when the pdf contains bigger free-form annotations (e.g. from using a stylus on a tablet to). Delete all annotations that are "image" or "free form" and the workflow should work again.
- Do not use backticks (`` ` ``) in any type of comment – this will break the annotation extraction.
- When the hotkey does not work in Preview, most likely the Alfred app does not have permissions to access Preview. You can give Alfred permission in the Mac OS System Settings.
<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=30%> 

- When you cannot resolve the problem, please [open an GitHub issue](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/issues). Be sure to include screenshots and/or a debugging log, as I will not be able to help you otherwise. You can get a debugging log by opening the workflow in Alfred preferences and pressing `cmd + D`. A small window will open up which will log everything happening during the execution of the Workflow. Use the malfunctioning part of the workflow once more, copy the content of the log window, and attach it as text file. 



## Credits
This workflow was created by [Chris Grieser](https://chris-grieser.de/) aka pseudometa. Thanks to [Andrew Baumann for his python CLI _pdfannots_](https://github.com/0xabu/pdfannots) without which this Alfred Workflow would not be possible.
