const fs = require("fs");
const path = require("path");
const DIRS = ["www.w3schools.com", "w3schools.com"].map((d) => path.join(__dirname, d));
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && /\.html?$/i.test(e.name)) yield p;
  }
}
let n = 0;
const noHead = [], noHeadNoBody = [];
for (const d of DIRS) {
  for (const f of walk(d)) {
    const t = fs.readFileSync(f, "utf8");
    if (t.includes("cage-fallback")) continue;
    n++;
    const hasBody = /<body[^>]*>/i.test(t);
    if (!hasBody) noHeadNoBody.push(f);
    else noHead.push(f);
  }
}
console.log("sin fallback: " + n);
console.log("--- con <body> pero sin <head> (5 ejemplos):");
noHead.slice(0, 5).forEach((f) => console.log("  " + path.relative(__dirname, f)));
console.log("--- sin <body> (5 ejemplos + tamano):");
noHeadNoBody.slice(0, 5).forEach((f) => {
  const t = fs.readFileSync(f, "utf8");
  console.log("  " + path.relative(__dirname, f) + " len=" + t.length + " head:" + JSON.stringify(t.slice(0, 120)));
});
