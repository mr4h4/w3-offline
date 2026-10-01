// Servidor estatico sin dependencias para ver el mirror offline por http://
// Uso: node servidor-local.js [puerto]  (por defecto 8000)
// Sirve la carpeta del repo, ignora query strings (?v=...) y pone los MIME correctos.
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = parseInt(process.argv[2] || "8000", 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // Ignorar query strings (?v=1.0.54, ?update=...) y %3F incrustados por el mirror
  // (p. ej. main.css%3Fv=1.0.54.css -> main.css). Asi las paginas sin parchear
  // tambien funcionan via http://
  let urlPath = req.url.split("#")[0].split("?")[0].split("%3F")[0].split("%3f")[0];
  // Quitar sufijo de version tipo ?v= que haya quedado como parte del nombre
  // y corregir el doble ".css" del mirror (main.css?v=1.0.54.css -> main.css)
  urlPath = urlPath.replace(/\.css\.css$/, ".css");
  try {
    urlPath = decodeURIComponent(urlPath);
  } catch (e) { /* mantener tal cual */ }
  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden");

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) {
      for (const idx of ["index.html", "index.htm", "default.asp.html"]) {
        if (fs.existsSync(path.join(filePath, idx))) {
          filePath = path.join(filePath, idx);
          stat = fs.statSync(filePath);
          break;
        }
      }
    }
    if (err || !stat.isFile()) return send(res, 404, "Not found: " + urlPath);

    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (err2, data) => {
      if (err2) return send(res, 500, "Read error");
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log("W3Schools offline en: http://localhost:" + PORT + "/www.w3schools.com/index.html");
});
