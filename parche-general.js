// Parche generalizado del mirror offline para uso via file:// y http://
// Uso: node parche-general.js
// Recorre todos los *.html/*.htm de www.w3schools.com y w3schools.com y aplica:
//  1. Elimina preload de fontawesome (archivo no existe en el mirror -> 404/CORS siempre)
//  2. Repara URLs locales con version incrustada: main.css%3Fv=... / uic.js?v=... -> main.css / uic.js
//     (solo rutas locales, nunca https://...)
//  3. Quita crossorigin de preloads de fuentes y del manifest (rompe file:// con origin 'null')
//  4. Inserta shim en <head> con no-ops para uic_prov_pre/uic_prov_al/MyLearning/displayInternalFeatures
//     para que ningun fallo de JS tumbe el resto de la pagina (adblock, file://, offline)
const fs = require("fs");
const path = require("path");

const DIRS = ["www.w3schools.com", "w3schools.com"].map((d) => path.join(__dirname, d));

const SHIM = `<script>/* offline-shim: evita ReferenceError si un JS local no carga (file://, adblock) */
window.uic_prov_pre=window.uic_prov_pre||function(){};
window.uic_prov_al=window.uic_prov_al||function(){};
window.displayInternalFeatures=window.displayInternalFeatures||function(){};
window.MyLearning=window.MyLearning||{loadUser:function(a,b){if(typeof b==="function"){try{b()}catch(e){}}},getUrlFriendlyName:function(u){return (u||"").toLowerCase().replace(/[^a-z0-9]+/g,"-")}};
window.UserSession=window.UserSession||{loggedIn:false};</script>`;

const stats = { files: 0, changed: 0, fontawesome: 0, versionUrls: 0, crossorigin: 0, shim: 0 };

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && /\.(html?|asp\.html)$/i.test(e.name) || (e.isFile() && /\.html$/i.test(e.name))) yield p;
  }
}

function patchFile(file) {
  let t = fs.readFileSync(file, "utf8");
  const orig = t;

  // 1. fontawesome no existe en el mirror: eliminar su preload (siempre 404 + error CORS)
  const faRe = /^[ \t]*<link[^>]*fontawesome[^>]*>\s*(?:\r?\n)?/gim;
  if (faRe.test(t)) { t = t.replace(faRe, "<!-- offline: fontawesome no incluido en el mirror -->\n"); stats.fontawesome++; }
  // Variante por si quedo la forma con %3F pegada a otra linea
  if (t.includes("fontawesome.woff2")) {
    t = t.replace(/<link[^>]*fontawesome\.woff2[^>]*>/gi, "<!-- offline: fontawesome no incluido en el mirror -->");
    stats.fontawesome++;
  }

  // 2a. Forma %3F incrustada (subpaginas): lib/x%3Fv=... / %3Fupdate= / %3F14663396 -> quitar desde %3F hasta cierre de comilla,
  //     y corregir el ".css" duplicado del mirror (main.css%3Fv=1.0.54.css -> main.css)
  const encRe = /((?:src|href)="(?!(?:https?:|data:|blob:|javascript:))[^"']*?\.(?:css|js|woff2?|ttf|eot|svg))%3[Ff](?:v=[^"']*|update=[^"']*|14663396[^"']*)(")/g;
  t = t.replace(encRe, (_, a, b) => { stats.versionUrls++; return a + b; });
  // resto generico %3F en rutas locales
  t = t.replace(/((?:src|href)="(?:\.\.\/)*lib\/[^"']*?)%3[Ff][^"']*(")/gi, (_, a, b) => { stats.versionUrls++; return a + b; });

  // 2b. Forma ? normal en rutas locales (raiz y resto): quitar ?v= / ?update= / ?14663396
  const qRe = /((?:src|href)="(?!(?:https?:|data:|blob:|javascript:|#))[^"']*?)\?(?:v=[^"']*|update=[^"']*|14663396[^"']*)(")/g;
  t = t.replace(qRe, (_, a, b) => { stats.versionUrls++; return a + b; });

  // 3. crossorigin en preloads de fuentes y manifest local -> fuera (bloquea file://)
  const coFontRe = / as="font" type="font\/woff2" crossorigin(?=[\s>])/g;
  if (coFontRe.test(t)) { t = t.replace(coFontRe, ' as="font" type="font/woff2"'); stats.crossorigin++; }
  if (t.includes('site.webmanifest" crossorigin')) {
    t = t.replace(/<link rel="manifest" href="([^"]*site\.webmanifest)" crossorigin="use-credentials">/g, '<link rel="manifest" href="$1">');
    stats.crossorigin++;
  }

  // 4. shim anti-ReferenceError (una sola vez, justo tras <head...>).
  //    Las paginas ya parcheadas a mano (guardas con typeof) siguen valiendo.
  if (!t.includes("offline-shim") && /<head[^>]*>/i.test(t)) {
    t = t.replace(/<head[^>]*>/i, (m) => m + "\n" + SHIM);
    stats.shim++;
  }

  if (t !== orig) { fs.writeFileSync(file, t); stats.changed++; }
  stats.files++;
}

for (const d of DIRS) {
  if (!fs.existsSync(d)) { console.log("omitido (no existe): " + d); continue; }
  console.log("recorriendo " + d + " ...");
  for (const f of walk(d)) {
    try { patchFile(f); } catch (e) { console.log("ERROR " + f + ": " + e.message); }
  }
}
console.log(JSON.stringify(stats, null, 2));
