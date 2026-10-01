const fs = require("fs");
const path = require("path");
const vm = require("vm");
const DIRS = ["www.w3schools.com", "w3schools.com"].map((d) => path.join(__dirname, d));
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && /\.html?$/i.test(e.name)) yield p;
  }
}
const jsErrors = [];
for (const d of DIRS) {
  for (const f of walk(d)) {
    const t = fs.readFileSync(f, "utf8");
    const re = /<script(?![^>]*\bsrc=)(?![^>]*type=["']?module)[^>]*>([\s\S]*?)<\/script>/gi;
    let s;
    while ((s = re.exec(t)) !== null) {
      const code = s[1];
      if (!code.trim()) continue;
      try { vm.compileFunction(code); }
      catch (e2) {
        const mine = code.includes("cage-fallback") || code.includes("offline-shim");
        jsErrors.push({ f: path.relative(__dirname, f), mio: mine, msg: e2.message.slice(0, 80), tail: JSON.stringify(code.slice(-120)) });
        break;
      }
    }
  }
}
console.log("errores: " + jsErrors.length);
jsErrors.forEach((e) => { console.log("### " + e.f + " mio=" + e.mio + " :: " + e.msg); console.log("    cola bloque: ..." + e.tail); });
