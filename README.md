# PDF Annotation Extractor
Alfred Workflow that does pretty much what the name implies

## Requirements
- Alfred (🍏️ only)
- [Alfred Powerpack](https://www.alfredapp.com/shop/) (~30€)
- the CL-Tools described below under "Installation"
- works with any PDF Reader that can annotate

## Installation
1) Check if Pip, the python package manager, is installed on your machine: `python3 -m pip --version`
2) If is not installed, [install it](https://pip.pypa.io/en/stable/installing/#installing-with-get-pip-py).
3) Install [PDFminer](https://github.com/pdfminer/pdfminer.six): `pip install pdfminer.six`
4) [Download pdfannots](https://github.com/0xabu/pdfannots/archive/refs/heads/master.zip).
5) unzip at '/usr/local/lib/python3.9/site-packages'
6) run in the Terminal:
```
cd '/usr/local/lib/python3.9/site-packages'
run python3 setup.py install 
```
*in case you want to output your annotations as PDF File*

7) Install [Pandoc](https://pandoc.org/installing.html) and a [PDF engine](https://pandoc.org/MANUAL.html#option--pdf-engine) of your choice, e.g. [wkhtmltopdf](https://wkhtmltopdf.org/).
```
brew install pandoc
brew install wkhtmltopdf
```
----

## How to use
- Use the hotkey in when you have a PDF selectd in Finder or open in Preview. The Hotkey can be set in Alfred by doubleclicking the respective field at the top left.
- Alternatively when you are familiar with Alfred, you can also use fiel filter and a file search with the keyword `anno`
- Use the Alfred keyword `aconf` to set up output style, reference insertion, and (optionally) pdf engine.
  - output styles: Markdown file, PDF (Pandoc & PDF Engine needed), Markdown specifically for [Notion.so Toggled Lists](https://www.notion.so/Toggles-c720af26b4bd4789b736c140b2dc73fe).
  - reference insertion: The workflow inserts the references (e.g. Grieser 2019: 24). You either tell the Annotation Extractor manually which Reference to insert, or it will automatically determine the correct reference from the filename of your pdf. For that, it must be formatted as `"authors_year_[...].pdf"`. You can use bibliography management software to name your papers automatically like that.
- Right now, this workflow only extracts free comments and highlights with comments. More in the future.

## Troubleshooting 
When the hotkey does not work in Preview, most likely the Alfred app does not have permissions to access Preview. You can give Alfred permission in the Mac OS System Settings.

<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=50% height=50%> 
