// Fallback global de imagenes a nicocage.png (uso via file:// y http://)
// Uso: node parche-cage.js
// - Si el HTML ya tiene el offline-shim, anade el fallback dentro de ese <script>.
// - Si no, inyecta un bloque <script> propio tras <head>.
// El fallback: cualquier <img> que falle (404, file:// bloqueado, offline) pasa a
// mostrar nicocage.png (copiado en la raiz de www.w3schools.com y w3schools.com).
// No toca las imagenes que cargan bien. Sin bucles: marca data-cage-fallback.
const fs = require("fs");
const path = require("path");

const DIRS = ["www.w3schools.com", "w3schools.com"].map((d) => path.join(__dirname, d));

const FALLBACK_CODE = `/* cage-fallback-v2: toda <img> que falle muestra nicocage.png */
(function(){var DONE="data-cage-fallback";function rootPrefix(){var els=document.querySelectorAll("script[src],link[href]");for(var i=0;i<els.length;i++){var u=els[i].getAttribute("src")||els[i].getAttribute("href")||"";var k=u.indexOf("lib/");if(k>=0)return u.slice(0,k);}return "";}var FB=null;function target(){if(FB===null)FB=rootPrefix()+"nicocage.png";return FB;}function fix(g){if(!g||g.tagName!=="IMG"||g.getAttribute(DONE))return;g.setAttribute(DONE,"1");try{g.removeAttribute("srcset");}catch(x){}g.src=target();}function sweep(){var im=document.images;for(var i=0;i<im.length;i++){var g=im[i];if(g.complete&&g.naturalWidth===0)fix(g);}}document.addEventListener("error",function(e){fix(e.target);},true);sweep();document.addEventListener("DOMContentLoaded",sweep);})();`;

// Codigo de la v1 (para migrar los ya parcheados a v2)
const FALLBACK_V1 = `/* cage-fallback: toda <img> que falle muestra nicocage.png */`;

const ANCHOR = "window.UserSession=window.UserSession||{loggedIn:false};</script>";
const stats = { files: 0, changed: 0, extendedShim: 0, standalone: 0, skipped: 0 };

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && /\.html?$/i.test(e.name)) yield p;
  }
}

function patchFile(file) {
  let t = fs.readFileSync(file, "utf8");
  if (t.includes("cage-fallback-v2")) { stats.files++; return; } // idempotente
  const orig = t;
  if (t.includes("cage-fallback") && t.includes("document.addEventListener(\"error\",function(e){var t=e.target;")) {
    // migrar v1 -> v2: sustituir el bloque IIFE completo de v1 (termina en })(); )
    const v1re = /\/\* cage-fallback: toda <img> que falle muestra nicocage\.png \*\/\s*\(function\(\)\{var DONE[\s\S]*?\}\)\(\);/;
    if (v1re.test(t)) { t = t.replace(v1re, FALLBACK_CODE); stats.extendedShim++; }
  } else if (t.includes("offline-shim") && t.includes(ANCHOR)) {
    t = t.replace(ANCHOR, "window.UserSession=window.UserSession||{loggedIn:false};\n" + FALLBACK_CODE + "</script>");
    stats.extendedShim++;
  } else if (/<head[^>]*>/i.test(t)) {
    t = t.replace(/<head[^>]*>/i, (m) => m + "\n<script>" + FALLBACK_CODE + "</script>");
    stats.standalone++;
  } else if (/<body[^>]*>/i.test(t)) {
    // paginas sin <head> (p. ej. academy/): inyectar tras <body>; el sweep() cubre las imgs anteriores
    t = t.replace(/<body[^>]*>/i, (m) => m + "\n<script>" + FALLBACK_CODE + "</script>");
    stats.standalone++;
  } else {
    stats.skipped++; // fragmentos/JSON sin body: sin <img> propio o cubiertos por la pagina anfitriona
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
