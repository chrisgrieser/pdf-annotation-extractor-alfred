#!/usr/bin/env osascript -l JavaScript

ObjC.import("stdlib");

Application("com.runningwithcrayons.Alfred").removeConfiguration("underlines", { inWorkflow: $.getenv("alfred_workflow_bundleid") } );
Application("com.runningwithcrayons.Alfred").removeConfiguration("tags", { inWorkflow: $.getenv("alfred_workflow_bundleid") } );

