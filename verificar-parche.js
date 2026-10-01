const fs = require("fs");
const files = [
  "www.w3schools.com/index.html",
  "www.w3schools.com/html/default.asp.html",
  "www.w3schools.com/css/default.asp.html",
  "www.w3schools.com/js/default.asp.html",
  "www.w3schools.com/python/default.asp.html",
  "www.w3schools.com/java/ref_linkedlist_addfirst.asp.html",
  "www.w3schools.com/java/ref_linkedlist_clear.asp.html",
];
for (const f of files) {
  const t = fs.readFileSync(f, "utf8");
  const reV = /(src|href)="(?!https?:|data:)[^"]*\?(v=|update=|14663396)/g;
  const badV = (t.match(reV) || []).length;
  const badE = (t.match(/%3[Ff](v=|update=|14663396)/g) || []).length;
  const fa = t.includes("fontawesome.woff2\"");
  const co = (t.match(/crossorigin/g) || []).length;
  const shim = t.includes("offline-shim");
  console.log([f, "?v-local:" + badV, "%3F:" + badE, "fa:" + fa, "crossorigin:" + co, "shim:" + shim].join(" | "));
}
