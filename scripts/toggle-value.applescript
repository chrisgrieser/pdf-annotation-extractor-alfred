#!/usr/bin/env osascript

on run argv

	set setting to item 1 of argv as string

	set oldValue to (system attribute setting)
	if (oldValue = "true")
		set newValue to "false"
	else
		set newValue to "true"
	end if

	tell application id "com.runningwithcrayons.Alfred" to set configuration setting to value newValue in workflow (system attribute "alfred_workflow_bundleid")
	return setting
end run
