// One-off generator for public/og.png (1200×630 share image) and
// public/favicon-32.png. Run after changing the name, research line or colors:
//   node scripts/make-og.cjs
// Needs Playwright with Chromium available to require('playwright').
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const font = (pkg, file) => pathToFileURL(path.join(ROOT, 'node_modules', pkg, 'files', file)).href;

const NAME = 'Luiz Takahashi';
const LINE = 'I measure cognition and behavior in daily life, and ask when a recorded change is real rather than practice, context or noise.';

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'Newsreader'; src: url('${font('@fontsource-variable/newsreader', 'newsreader-latin-opsz-normal.woff2')}'); font-weight: 200 800; }
@font-face { font-family: 'Newsreader'; font-style: italic; src: url('${font('@fontsource-variable/newsreader', 'newsreader-latin-opsz-italic.woff2')}'); font-weight: 200 800; }
@font-face { font-family: 'Plex Mono'; src: url('${font('@fontsource/ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff2')}'); }
html, body { margin: 0; width: 1200px; height: 630px; background: #EDEEEA; color: #15171A; }
.card { box-sizing: border-box; width: 1200px; height: 630px; padding: 72px 80px; display: grid;
  grid-template-columns: 1fr 340px; column-gap: 64px; align-items: center; }
.kicker { font: 400 20px 'Plex Mono'; letter-spacing: .14em; text-transform: uppercase; color: #B3361F; margin: 0 0 22px; }
h1 { font: 500 96px/1 'Newsreader'; letter-spacing: -.025em; margin: 0; }
.line { font: italic 400 33px/1.3 'Newsreader'; color: #15171A; margin: 28px 0 0; max-width: 17em; }
.foot { display: flex; align-items: center; gap: 22px; margin-top: 44px; font: 400 22px 'Plex Mono'; color: #5A5F66; }
.rule { width: 96px; height: 6px; background: #B3361F; }
.fig { width: 340px; height: 255px; background: #E1E3DE; border: 1px solid #15171A; padding: 10px; box-sizing: content-box; }
</style></head><body><div class="card"><div>
<p class="kicker">PhD applicant · Fall 2027</p>
<h1>${NAME}</h1>
<p class="line">${LINE}</p>
<div class="foot"><span class="rule"></span><span>luiztakahashi.com</span></div>
</div>
<div class="fig"><svg viewBox="0 0 400 300" width="340" height="255">
<line x1="40" y1="250" x2="370" y2="250" stroke="#15171A" stroke-width="1.5"/>
<line x1="40" y1="40" x2="40" y2="250" stroke="#15171A" stroke-width="1.5"/>
<rect x="40" y="172" width="330" height="48" fill="#15171A" opacity=".07"/>
<line x1="40" y1="196" x2="370" y2="196" stroke="#15171A" stroke-width="1.2" stroke-dasharray="4 4" opacity=".55"/>
<path d="M50,186 C110,128 170,90 240,78 S330,68 360,66 L360,110 C330,112 300,116 240,122 C170,134 110,172 50,234 Z" fill="#B3361F" opacity=".18"/>
<path d="M50,210 C110,150 170,112 240,100 S330,90 360,88" fill="none" stroke="#B3361F" stroke-width="2.6"/>
<g fill="#15171A"><circle cx="60" cy="212" r="3.8"/><circle cx="82" cy="176" r="3.8"/><circle cx="104" cy="174" r="3.8"/><circle cx="126" cy="146" r="3.8"/><circle cx="148" cy="141" r="3.8"/><circle cx="170" cy="122" r="3.8"/><circle cx="192" cy="124" r="3.8"/><circle cx="214" cy="106" r="3.8"/><circle cx="236" cy="109" r="3.8"/><circle cx="258" cy="96" r="3.8"/><circle cx="302" cy="90" r="3.8"/><circle cx="324" cy="96" r="3.8"/><circle cx="346" cy="86" r="3.8"/></g>
<circle cx="280" cy="152" r="5" fill="#B3361F"/><circle cx="280" cy="152" r="11" fill="none" stroke="#B3361F" stroke-width="1.5"/>
</svg></div></div></body></html>`;

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
  const htmlFile = path.join(tmp, 'og.html');
  fs.writeFileSync(htmlFile, html);

  const browser = await chromium.launch();
  try {
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await og.goto(pathToFileURL(htmlFile).href);
    await og.evaluate(() => document.fonts.ready);
    await og.screenshot({ path: path.join(ROOT, 'public/og.png') });

    const icon = await browser.newPage({ viewport: { width: 32, height: 32 }, colorScheme: 'light' });
    await icon.goto(pathToFileURL(path.join(ROOT, 'public/favicon.svg')).href);
    await icon.screenshot({ path: path.join(ROOT, 'public/favicon-32.png'), omitBackground: true });
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log('wrote public/og.png and public/favicon-32.png');
})();
