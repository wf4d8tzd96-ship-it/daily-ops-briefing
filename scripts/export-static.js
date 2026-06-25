const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const dataFile = path.join(root, "data", "reports.json");
const distDir = path.join(root, "dist");

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function buildIndex() {
  const indexPath = path.join(publicDir, "index.html");
  const html = fs.readFileSync(indexPath, "utf8");
  return html.replace(
    '<script src="/app.js"></script>',
    '<script>window.APP_MODE = "static";</script>\n    <script src="./app.js"></script>'
  ).replace('href="/styles.css"', 'href="./styles.css"');
}

cleanDist();
fs.writeFileSync(path.join(distDir, "index.html"), buildIndex(), "utf8");
copyFile(path.join(publicDir, "styles.css"), path.join(distDir, "styles.css"));
copyFile(path.join(publicDir, "app.js"), path.join(distDir, "app.js"));
copyFile(dataFile, path.join(distDir, "reports.json"));
fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

console.log(`Static site exported to ${distDir}`);
