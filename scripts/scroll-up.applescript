#!/usr/bin/env osascript
tell application "System Events" to set frontApp to (name of first process where it is frontmost)
if (frontApp is "PDF Expert") or (frontApp is "Highlights") then
	tell application frontApp to activate
	tell application "System Events" to key code 126 using {command down}
end if


