#!/usr/bin/env zsh

underlines=$(cat "$alfred_workflow_data/underlines")

if [[ "$underlines" != "none" ]]; then
	annos=$(echo "$underlines" | tr '"' "'") # using '"' somehow leads to a parsing error, so this needs to be translated
	input="# $citekey\n_${title}_\n\n$annos" # insert Citekey and title
	uuid=$(osascript -e "tell application \"Drafts\" to make new draft with properties {content: \"$input\", tags: {\"underlines\" }}" |
		cut -c10-)                                    # create Draft and save UUID
	open "drafts://x-callback-url/open?uuid=$uuid" # open Draft
	sleep 0.4
fi
