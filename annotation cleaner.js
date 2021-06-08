function run() {
  ObjC.import('stdlib');
  var annotations = `{query}`;

  //prior cleaning
  annotations = annotations.replaceAll ("  "," "); //double spaces
  annotations = annotations.replaceAll ("\n\n\n","\n"); //empty lines
  annotations = annotations.replaceAll ("\n\n","\n"); //empty lines
  annotations = annotations.replaceAll ("- ",""); //removes copypasted hyphenation

  //genererates the reference from filename provided by Alfred
  var shortRef = $.getenv('ref_name');

  //gets first page number from Alfred
  var firstPageString = $.getenv('first_page_no');
  var firstPageNo = parseInt(firstPageString) -1 ; //converts str to int

  //formats annotations for Notion Markdown
  annotations = annotations.replace ("## Detailed comments",""); //remove heading
  annotations = annotations.replace (/ \* Page (\d+):\n +> +(.*)\n +(.*)\n/gm,`  - **$3:** "$2" (ZZZZ: $1) \n`); //re-formatting commented highlights
  annotations = annotations.replace (/ \* Page (\d*):[\n| ]?([^\*>]+)\n/gm,"  - *$2 (ZZZZ: $1)*\n"); //re-formating free comments
  annotations = annotations.replaceAll ("ZZZZ",shortRef); //insert reference

  //inserts correct page numbers based on https://stackoverflow.com/a/32664436
  annotations = annotations.replace (/\: (\d+)\)/g, function (match, n){
    return ": " + (parseInt(n) + firstPageNo) + ")";
  });


  var mdStyle = $.getenv('output_style');
  if (mdStyle == "notion"){
    annotations = "- **" + shortRef + "**" + annotations; //putting reference as heading
  } else {
    annotations = "# " + shortRef + annotations;
    annotations = annotations.replaceAll ("  ",""); //double spaces before the run
  }
  return annotations;
}
