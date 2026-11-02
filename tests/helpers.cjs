// Shared test helpers: a static server over dist/ that mirrors Cloudflare's
// "404-page" handling, Playwright page factory, and YAML reader.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  webp: 'image/webp',
  woff2: 'font/woff2',
  pdf: 'application/pdf',
  txt: 'text/plain; charset=utf-8',
};

function resolveFile(urlPath) {
  let p = path.join(DIST, urlPath);
  if (!p.startsWith(DIST)) return null;
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  else if (!fs.existsSync(p) && fs.existsSync(p + '.html')) p = p + '.html';
  return fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
}

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://local').pathname);
      const file = resolveFile(urlPath);
      if (file) {
        res.writeHead(200, { 'content-type': TYPES[path.extname(file).slice(1)] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
        return;
      }
      const notFound = path.join(DIST, '404.html');
      res.writeHead(404, { 'content-type': TYPES.html });
      if (fs.existsSync(notFound)) fs.createReadStream(notFound).pipe(res);
      else res.end('not found');
    });
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => srv.close(() => r())),
      });
    });
  });
}

function launch() {
  return require('playwright').chromium.launch();
}

async function openPage(browser, url, opts = {}) {
  const {
    width = 1440,
    height = 900,
    colorScheme = 'light',
    reducedMotion = 'no-preference',
    javaScriptEnabled = true,
    initScript,
  } = opts;
  const context = await browser.newContext({
    viewport: { width, height },
    colorScheme,
    reducedMotion,
    javaScriptEnabled,
  });
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load' });
  return { page, errors, context };
}

function readYaml(relPath) {
  const { parse } = require('yaml');
  return parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

module.exports = { ROOT, DIST, startServer, launch, openPage, readYaml };
