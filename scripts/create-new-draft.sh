#!/bin/zsh
# shellcheck disable=SC2154

# using '"' somehow leads to a parsing error, so this needs to be translated
annos=$(echo "$underlines" | tr '"' "'")

# insert Citekey and title
input="# $citekey\n_${title}_\n\n$annos"

# create Draft and save UUID
uuid=$(osascript -e "tell application \"Drafts\" to make new draft with properties {content: \"$input\", tags: {\"underlines\" }}" \
| cut -c10-)

# save Draft
open "drafts://x-callback-url/open?uuid=$uuid"
