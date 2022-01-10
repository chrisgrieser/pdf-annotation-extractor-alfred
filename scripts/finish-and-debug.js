#!/usr/bin/env osascript -l JavaScript

function run () {
	ObjC.import("stdlib");
	const app = Application.currentApplication();
	app.includeStandardAdditions = true;

	// either logs to console or returns for clipboard
	function log (str) { console.log (str) }
	const onlineJSON = url => JSON.parse(app.doShellScript("curl -sL '" + url + "'"));

	// remove config
	// Application("com.runningwithcrayons.Alfred").removeConfiguration("underlines", { inWorkflow: $.getenv("alfred_workflow_bundleid") } );
	// Application("com.runningwithcrayons.Alfred").removeConfiguration("tags", { inWorkflow: $.getenv("alfred_workflow_bundleid") } );
	// Application("com.runningwithcrayons.Alfred").removeConfiguration("annotations", { inWorkflow: $.getenv("alfred_workflow_bundleid") } );

	// stop when no debugging required https://www.alfredapp.com/help/workflows/script-environment-variables/
	if ($.getenv("alfred_debug") !== "1") return;

	// log Version info to debugging log
	const appTempPath = app.pathTo("home folder") + "/Library/Application Support/obsidian/";
	const obsiVer = app.doShellScript("cd '" + appTempPath + "'; ls *.asar | grep -Eo '(\\d|\\.)*'").slice (0, -1);
	const macVer = app.doShellScript("sw_vers -productVersion");

	const obsiVerOnline = onlineJSON("https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/desktop-releases.json")
		.latestVersion;
	const obsiVerBetaOnline = onlineJSON("https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/desktop-releases.json")
		.beta.latestVersion;
	const workflowVerOnline = onlineJSON("https://api.github.com/repos/chrisgrieser/shimmering-obsidian/tags")[0]
		.name;

	log("_");
	log("-------------------------------");
	log("INSTALLED VERSION");
	log("macOS: " + macVer);
	log("Obsidian: " + obsiVer);
	log("Alfred: " + $.getenv("alfred_version"));
	log("Workflow: " + $.getenv("alfred_workflow_version"));
	log("-------------------------------");
	log("LATEST VERSION");
	log("Obsidian: " + obsiVerOnline);
	log("Obsidian (Insider): " + obsiVerBetaOnline);
	log("Workflow: " + workflowVerOnline);
	log("-------------------------------");
}
