# PDF Annotation Extractor
Extract Annotations as Markdown & inserts Pandoc Citations with correct page numbers.

## Table of Content
- [How to Use](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#how-to-use)
- [Special Features](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#special-features)
- [Requirements & Installation](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#requirements--installation)
- [Troubleshooting](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#troubleshooting)
- [Credits](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred#credits)

## How to Use
- Use the **hotkey** to trigger the Annotation Extraction of the frontmost document of Preview or PDF Expert. In case Finder is the frontmost app, the currently selected pdf file will be selected. 
- **Automatic Page Number Identification**: the *correct* page numbers will automatically be determined from your BibTeX-Library and inserted into the references. If the page number cannot be determined, the PDF will be scanned for a DOI which can be used to query the correct page numbers. If this fails as well, you will be asked to enter the *first* page number of your PDF (e.g. with "Nature 20(41): 103-145" you will have to enter "103".)
- use the Alfred keyword `aconf` to for configuration of this workflow
  -  the output format (PDF, Markdown, Clipboard, [Drafts](https://getdrafts.com/), or [Obsidian](https://obsidian.md/)). When selecting Markdown or Obsidian as output format, a YAML-Header with information from your BibTeX Library will be prepended. 
  -  whether citekeys are entered manually or automatically via filename (requires filenames beginning with the citekey and followed by an underscore:`citekey_`. You can easily achieve with via renaming rules of your reference manger, [e.g. the ZotFile plugin for Zotero](http://zotfile.com/#renaming-rules)).
  -  the Obsidian destination (must be a folder in your vault)
  -  select the number of columns your PDF has

ℹ️ _Right now, this workflow **only extracts free comments and highlights with comments**. More will be implemented in the future (this workflow has automatic updates so you will not miss it)._

## Special Features
The PDF Annotation Extractor features some methods for merging/joining highlights.
- **automatically merge highlights that span two pages**: give the highlight _on the next page **exactly**_ the comment `c` (for "continue") and they two highlights will be merged. The comment from the first highlight will be preserved. 
- **automatically merge highlights on one page**: If you just want to leave out some text _on the same page_, do the same as above but use `j` (for "join") instead. The PDF Annotation Extractor will then input a "[...]" and otherwise join the two highlights.


## Requirements & Installation

**0) Requirements**
- Alfred (Mac only)
- [Alfred Powerpack](https://www.alfredapp.com/shop/) (~30€)

**1) Install the following Third-Party-Software**
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python3
brew install python3

# install pip3
curl -s https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py
rm get-pip.py

# further needed CLIs
pip3 install pdfminer.six
pip3 install pdfannots
brew install pdfgrep
```

**2) Download & Install the [PDF Annotation Extractor Workflow](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/releases/latest/)**.

**3) Define the Hotkey by double-clicking this field**

<img width=12% alt="Screenshot 2021-09-11 22 12 14" src="https://user-images.githubusercontent.com/73286100/132960488-a60eff61-16a9-42cf-801f-c42612fbfb5e.png">

**4) Set BibTeX Library Path**
- using the `aconf` command, select `Set BibTeX Library`, and then search/select your `.bib` file

**5) optional: further steps only required for specific output types**
- _Obsidian as Output_: - using the `aconf` command, select `Obsidian Destination`, and then search/select the folder 
- _PDF as Output Format_: Install Pandoc & a [PDF-Engine](https://pandoc.org/MANUAL.html#option--pdf-engine) of your choice

```bash
brew install pandoc
# can be changed to a pdf-engine of your choice
brew install wkhtmltopdf
```

## Troubleshooting 
- This workflow won't work with annotations that are not actually saved in the PDF file. Some PDF Readers like **Skim** do this, but you can [tell those PDF readers to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)
- The workflow sometimes does not work when the pdf contains bigger free-form annotations (e.g. from using a stylus on a tablet to). Delete all annotations that are "image" or "free form" and the workflow should work again.
- Do not use backticks (`` ` ``) in any type of comment – this will break the annotation extraction.
- When the hotkey does not work in Preview, most likely the Alfred app does not have permissions to access Preview. You can give Alfred permission in the Mac OS System Settings.
- When you cannot resolve the problem, please [open an GitHub issue](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/issues). Be sure to include screenshots and/or a debugging log, as I will not be able to help you otherwise. 
  - You can get a debugging log by opening the workflow in Alfred preferences and pressing `cmd + D`. A small window will open up which will log everything happening during the execution of the Workflow. Use the malfunctioning part of the workflow once more, copy the content of the log window, and attach it as text file. 

<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=40%> 

## Credits
This workflow was created by [Chris Grieser](https://chris-grieser.de/). Thanks to [Andrew Baumann for his python CLI 'pdfannots'](https://github.com/0xabu/pdfannots) without which this Alfred Workflow would not be possible.
