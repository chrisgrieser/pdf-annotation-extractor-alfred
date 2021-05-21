function run() {
  var filepath = `{query}`;
  filename = filepath.replace (/.*\/(.*)\.pdf/,"$1"); //cuts extension and path

  //the following assumes that the file was named "authors_year_title.pdf"
  shortRef = filename.replace (/(.*)_(\d{4})_.*$/,"$1 $2"); //removes title
  shortRef = shortRef.replace ("_","/"); //in case of two authors, puts /
  shortRef = shortRef.replace ("et al","et al."); //in case of three authors sets the point

  return shortRef;
}
