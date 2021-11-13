---
aliases: 
tags: pdf
---

# Annotation-Code-Cheatsheet
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
