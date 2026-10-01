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
let v1 = 0, v2 = 0, both = 0, neither = 0;
const bothFiles = [];
for (const d of DIRS) {
  for (const f of walk(d)) {
    const t = fs.readFileSync(f, "utf8");
    const hasV1 = /cage-fallback: toda/.test(t) && !t.includes("cage-fallback-v2");
    const hasV2 = t.includes("cage-fallback-v2");
    if (hasV1 && hasV2) { both++; if (bothFiles.length < 5) bothFiles.push(path.relative(__dirname, f)); }
    else if (hasV1) v1++;
    else if (hasV2) v2++;
    else neither++;
  }
}
console.log(JSON.stringify({ soloV1: v1, soloV2: v2, ambas: both, ninguna: neither }, null, 2));
console.log("ejemplos con ambas:", bothFiles);
