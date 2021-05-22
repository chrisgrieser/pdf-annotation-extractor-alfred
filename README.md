# PDF Annotation Extractor
Alfred Workflow that does pretty much what the name implies

## Requirements
- Alfred (🍏️ only)
- [Alfred Powerpack](https://www.alfredapp.com/shop/) (~30€)

## Installation
1) Check if Python3 and Pip, the python package manager, are installed on your machine: 
```
python3 --version
python3 -m pip3 --version
```
3) If not, install [Python3](https://www.python.org/downloads/mac-osx/) and [Pip3](https://pip.pypa.io/en/stable/installing/#installing-with-get-pip-py).
4) 


7) Install [Pandoc](https://pandoc.org/installing.html) and a [PDF engine](https://pandoc.org/MANUAL.html#option--pdf-engine) of your choice, e.g. [wkhtmltopdf](https://wkhtmltopdf.org/).

```
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
```
# assuming you have Homebrew
brew install pandoc
brew install wkhtmltopdf
```

## How to use
- Use the hotkey in when you have a PDF selectd in Finder or open in Preview. The Hotkey can be set in Alfred by doubleclicking the respective field at the top left.
- Alternatively when you are familiar with Alfred, you can also use fiel filter and a file search with the keyword `anno`
- Use the Alfred keyword `aconf` to set up output style, reference insertion, and (optionally) pdf engine.
  - output styles: Markdown file, PDF (Pandoc & PDF Engine needed), Markdown specifically for [Notion.so Toggled Lists](https://www.notion.so/Toggles-c720af26b4bd4789b736c140b2dc73fe).
  - reference insertion: The workflow inserts the references (e.g. Grieser 2019: 24). You either tell the Annotation Extractor manually which Reference to insert, or it will automatically determine the correct reference from the filename of your pdf. For that, it must be formatted as `"authors_year_[...].pdf"`. You can use bibliography management software to name your papers automatically like that.
- Right now, this workflow only extracts free comments and highlights with comments. More in the future (this workflow has automatic updates).

## Troubleshooting 
- This workflow won't work with annotations that are not actually saved in the PDF file. [Some PDF Readers like Skim so this, but you can tell them to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)
- When the hotkey does not work in Preview, most likely the Alfred app does not have permissions to access Preview. You can give Alfred permission in the Mac OS System Settings.

<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=60% height=60%> 

## Credits
This workflow was created by [Chris Grieser](https://chris-grieser.de/). Thanks to [Andrew Baumann for his python script 'pdfannots'](https://github.com/0xabu/pdfannots), which is basically the whole backend of this workflow.
