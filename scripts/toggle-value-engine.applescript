#!/usr/bin/env osascript

on run argv

	set setting to item 1 of argv as string

	set oldValue to (system attribute setting)
	if (oldValue = "pdfannots2json")
		set newValue to "pdfannots"
	else
		set newValue to "pdfannots2json"
	end if

	tell application id "com.runningwithcrayons.Alfred" to set configuration setting to value newValue in workflow (system attribute "alfred_workflow_bundleid")
	return setting
end run
