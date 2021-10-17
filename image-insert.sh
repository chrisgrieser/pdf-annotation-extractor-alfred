#!/bin/zsh

# filename will be citekey (or ISOdate, when no citation key available)
filename="$*"
image_folder="${obsidian_destination/#\~/$HOME}"/attachments

# count number of images for that file
image_count=$(find "$image_folder" -name "$filename*" | wc -l | tr -d " ")
new_count=$(($image_count + 1));

# take screenshot
new_file="$image_folder"/"$filename"_image"$new_count".png
screencapture -i "$new_file"

# copy count to clipboard and return it
annotation_code="!""$new_count"" "
echo -n "$annotation_code" | pbcopy
echo -n "$annotation_code"
