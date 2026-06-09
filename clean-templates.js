/**
 * clean-templates.js
 *
 * Strips watermarks + editor tooling from templates/, then produces:
 *   1) clean-templates/   — .html + .pdf for each template
 *   2) delivery/          — zips: one per template (.html + .pdf) + bundle
 *
 * Usage:  node clean-templates.js
 *
 * Requires: Chromium (already installed), puppeteer-core (in devDependencies)
 */

const fs        = require('fs');
const path      = require('path');
const { execSync, spawn } = require('child_process');

const SOURCE_DIR   = path.join(__dirname, 'templates');
const CLEAN_DIR    = path.join(__dirname, 'clean-templates');
const DELIVERY_DIR = path.join(__dirname, 'delivery');
const SERVER_PORT  = 8765;

const TEMPLATE_IDS = [
  'classic','modern','minimal','executive','editorial',
  'creative','technical','academic','bold','elegant',
  'compact','vibrant',
  'mcwell','altacv','friggeri','twentys','material',
  'orbit','hipster','rows','sidebarleft','infographic',
  'sharp','simple','thoughteer','pseudomanifold','bobok',
  'cies','gboeing','roycoding','agonist','sc932'
];

// ── helpers ──────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanHtml(html) {
  html = html.replace(/\s*editing-highlight/g, '');
  html = html.replace(/\s*contenteditable="[^"]*"/g, '');
  html = html.replace(/<div class="watermark">[\s\S]*?<\/div>\s*/gi, '');
  html = html.replace(/\/\*[\s\S]*?\.watermark[\s\S]*?\*\/\s*/gi, '');
  html = html.replace(/\.watermark[\s\S]*?\.watermark[\s\S]*?\}/gi, '');
  html = html.replace(/@media\s+print\s*\{[\s\S]*?\.watermark[\s\S]*?\n\s*\}/gi, '');
  html = html.replace(/<div class="resumepro-attribution">[\s\S]*?<\/div>\s*/gi, '');
  html = html.replace(/\.resumepro-attribution[\s\S]*?\}/gi, '');
  html = html.replace(/\n{3,}/g, '\n\n').trim();
  return html;
}

function waitForServer(port, retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const http = require('http');
      http.get(`http://127.0.0.1:${port}/`, (r) => {
        r.destroy();
        return true;
      }).on('error', () => {});
      return true;
    } catch (_) {
      require('child_process').execSync('sleep 0.3');
    }
  }
  throw new Error(`Server on port ${port} did not start`);
}

async function generatePdfs() {
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  for (const id of TEMPLATE_IDS) {
    const htmlPath = path.join(CLEAN_DIR, id + '.html');
    if (!fs.existsSync(htmlPath)) continue;

    const url = `http://127.0.0.1:${SERVER_PORT}/clean-templates/${id}.html`;
    const page = await browser.newPage();

    // Set print emulation for proper PDF output
    await page.emulateMediaType('print');
    await page.setViewport({ width: 794, height: 1123 }); // A4 at 96dpi

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdfPath = path.join(CLEAN_DIR, id + '.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: { top: '0.8cm', right: '0.8cm', bottom: '0.8cm', left: '0.8cm' },
      printBackground: true
    });

    await page.close();
    console.log(`  ✓ ${id}.pdf`);
  }

  await browser.close();
}

function zipFiles(files, outPath) {
  const absFiles = files.map(f => path.resolve(f));
  execSync(`zip -j "${outPath}" ${absFiles.map(f => `"${f}"`).join(' ')}`, {
    cwd: __dirname,
    stdio: 'pipe'
  });
}

// ── main ─────────────────────────────────────────────────────────────
(async function main() {
  console.log('\n🧹 Cleaning templates...\n');

  ensureDir(CLEAN_DIR);
  ensureDir(DELIVERY_DIR);

  // Step 1: write clean HTML files
  const cleanPaths = [];
  for (const id of TEMPLATE_IDS) {
    const srcPath = path.join(SOURCE_DIR, id + '.html');
    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠  Missing: ${srcPath}`);
      continue;
    }
    const raw   = fs.readFileSync(srcPath, 'utf8');
    const clean = cleanHtml(raw);
    const out   = path.join(CLEAN_DIR, id + '.html');
    fs.writeFileSync(out, clean, 'utf8');
    console.log(`  ✓ ${id}.html`);
    cleanPaths.push({ id, html: out });
  }

  // Step 2: start local server for PDF generation
  console.log('\n🌐 Starting local server for PDF generation...\n');
  const http = require('http');
  const fsServe = require('fs');
  const mime = {
    '.html': 'text/html',
    '.pdf': 'application/pdf',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let filePath;
    if (req.url.startsWith('/clean-templates/')) {
      filePath = path.join(__dirname, req.url.replace(/^\//, ''));
    } else if (req.url === '/') {
      filePath = path.join(CLEAN_DIR, 'classic.html');
    } else {
      filePath = path.join(CLEAN_DIR, req.url.replace(/^\//, ''));
    }

    const ext = path.extname(filePath);
    const contentType = mime[ext] || 'application/octet-stream';

    fsServe.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });

  server.listen(SERVER_PORT, '127.0.0.1', async () => {
    console.log(`  → Server running on http://127.0.0.1:${SERVER_PORT}`);

    try {
      // Step 3: generate PDFs
      console.log('\n📄 Generating PDFs...\n');
      await generatePdfs();
    } catch (err) {
      console.warn(`  ⚠  PDF generation failed: ${err.message}`);
      console.log('  → Falling back to HTML-only delivery (customers can print to PDF)');
    }

    server.close();

    // Step 4: zip each template individually (html + pdf)
    console.log('\n📦 Creating individual delivery zips...\n');
    for (const { id, html } of cleanPaths) {
      const pdf = path.join(CLEAN_DIR, id + '.pdf');
      const zipOut = path.join(DELIVERY_DIR, `${id}.zip`);
      const filesToZip = [html];
      if (fs.existsSync(pdf)) filesToZip.push(pdf);
      zipFiles(filesToZip, zipOut);
      console.log(`  ✓ ${id}.zip`);
    }

    // Step 5: bundle all 12
    console.log('\n📦 Creating Complete Bundle zip...\n');
    const bundleZip = path.join(DELIVERY_DIR, 'Complete-Bundle-32-Templates.zip');
    const allFiles = cleanPaths.map(({ id, html }) => {
      const pdf = path.join(CLEAN_DIR, id + '.pdf');
      return fs.existsSync(pdf) ? [html, pdf] : [html];
    }).flat();
    zipFiles(allFiles, bundleZip);
    console.log(`  ✓ Complete-Bundle-32-Templates.zip`);

    console.log('\n✅ Done!\n');
    console.log(`  Clean files  → ${CLEAN_DIR}`);
    console.log(`  Delivery zips → ${DELIVERY_DIR}\n`);
    process.exit(0);
  });
})();
