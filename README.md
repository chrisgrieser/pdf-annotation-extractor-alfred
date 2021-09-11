# PDF Annotation Extractor
Alfred Workflow that does pretty much what the name says.

---
**⚠️⚠️⚠️⚠️  
The documentation and the version uploaded here are out of date – I have done a complete overhaul of how this workflow works. Version 3.0 will automate even more things, prepend YAML headers, and will work purely with *Pandoc citations*. I will release 3.0 with documentation when I have the time. You can watch the releases to be notified, and use version 2.0 which works with more manual input as well as APA-style citations instead of Pandoc citations until then.  
⚠️⚠️⚠️⚠️**

---

<img src="https://i.imgur.com/MqoPtO2.gif" alt="" width=50% height=50%>

## Requirements & Installation

0) Requirements
- Alfred (Mac only)
- [Alfred Powerpack](https://www.alfredapp.com/shop/) (~30€)

1) Install the following Third-Party-Software:
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

1a) Further installation for PDF as output Format
```bash
brew install pandoc
brew install basictex
```

2) Download & Install the [PDF Annotation Extractor Workflow](https://github.com/chrisgrieser/pdf-annotation-extractor-alfred/releases/latest/).

3) Define the Hotkey by doubleclicking this field
<img width="170" alt="Screenshot 2021-09-11 20 40 27" src="https://user-images.githubusercontent.com/73286100/132958090-432b2c0b-98d6-4e88-81a7-8cba272b7fc0.png">


## How to use
- Use the **hotkey** when you have a PDF selected in Finder, or the currently open document in Preview or PDF Expert (needs to set folder of PDFs for PDF Expert). The hotkey can be set in Alfred by doubleclicking the respective field at the top left.(When you are familiar with Alfred, you can also use file filter or a file search with the keyword `anno`).
- automatically **merges highlights that span two pages**: give the highlight on the next page *exactly* the comment `c` and they two highlights will be merge. The comment from the first highlight will be preserved and the reference will be corrected to include two pages, e.g. `Pohl 2018: **13-14**`. If you just want to leave out a bit on the same page, do the same but use `j` instead – the PDF Annotation Extractor will then input a "[...]" and join the two highlights.
- **automatically recognize the reference and page numbers to input**: You can enter them manually, or have the workflow recognize them automatically from the filename, when the filename is in the format `authors_year_page-page_[...].pdf`. You can easily achieve this with automatic renaming from your reference manager. When you use Zotero, [Zotfile](http://zotfile.com/) does this when you use the renaming rule `{%a_}{%y_}{%t}{_%f}` set in the Zotfile preferences.
- Alernatively, you can also use the DOI to automatically recognize the page numbers
- Use the Alfred keyword `aconf` to configure the workflow
  - output styles: Markdown file, PDF (Pandoc & PDF Engine needed), Obsidian, or Drafts.
  - set the number of columns per pdf page (wrong column number results in wrong order of some annotations in the resulting document)
  - type of reference / page number recognition
- Right now, this workflow **only extracts free comments and highlights with comments**. More in the future (this workflow has automatic updates).


## Troubleshooting 
- This workflow won't work with annotations that are not actually saved in the PDF file. Some PDF Readers like **Skim** do this, but you can [tell them to save the notes in the actual PDF.](https://skim-app.sourceforge.io/manual/SkimHelp_45.html)
- The workflow sometimes does not work when the pdf contains bigger free-form annotations (e.g. by using a stylus on a tablet to). Delete all annotations that are "image" or "free form" and the workflow should work again.
- Do not use backticks (`` ` ``) in any type of comment as this will break the annotation extraction.
- When the hotkey does not work in Preview/PDF Expert, most likely the Alfred app does not have permissions to access Preview/PDF Expert. You can give Alfred permission in the Mac OS System Settings.

<img src="https://i.imgur.com/ylGDs2f.png" alt="Permission for Alfred to access Preview" width=50% height=50%> 

## Credits
This workflow was created by [Chris Grieser](https://chris-grieser.de/). Thanks to [Andrew Baumann for his python script 'pdfannots'](https://github.com/0xabu/pdfannots), which is basically the whole backend of this workflow.
