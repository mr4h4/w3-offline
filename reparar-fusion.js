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
const MARK = 'document.addEventListener("DOMContentLoaded",sweep);})();';
let repaired = [];
for (const d of DIRS) {
  for (const f of walk(d)) {
    let t = fs.readFileSync(f, "utf8");
    let idx = 0, dirty = false;
    while ((idx = t.indexOf(MARK, idx)) !== -1) {
      const after = t.slice(idx + MARK.length);
      const m = after.match(/^\s*/);
      const rest = after.slice(m[0].length);
      if (!rest.toLowerCase().startsWith("</script>")) {
        // Falta el cierre: la pagina quedo fusionada -> restaurar frontera </script><script>
        t = t.slice(0, idx + MARK.length) + "</script>\n<script>" + after;
        dirty = true;
        idx = idx + MARK.length + 20;
      } else {
        idx = idx + MARK.length;
      }
    }
    if (dirty) { fs.writeFileSync(f, t); repaired.push(path.relative(__dirname, f)); }
  }
}
console.log("reparados (" + repaired.length + "):");
repaired.forEach((f) => console.log("  " + f));
