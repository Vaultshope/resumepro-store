const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROMIUM_PATH = '/usr/bin/chromium';
const BASE_URL = 'http://localhost:8000';
const OUTPUT_DIR = path.join(__dirname, 'previews');

// Template IDs matching index.html
const TEMPLATES = [
  'classic', 'modern', 'minimal', 'executive', 'editorial',
  'creative', 'technical', 'academic', 'bold', 'elegant', 'compact', 'vibrant',
  'mcwell', 'altacv', 'friggeri', 'twentys', 'material',
  'orbit', 'hipster', 'rows', 'sidebarleft', 'infographic',
  'sharp', 'simple', 'thoughteer', 'pseudomanifold', 'bobok',
  'cies', 'gboeing', 'roycoding', 'agonist', 'sc932'
];

async function main() {
  // Ensure output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching Chromium...');
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1100 });

  for (const id of TEMPLATES) {
    const url = `${BASE_URL}/templates/${id}.html`;
    console.log(`Capturing ${id}... (${url})`);
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
      // Wait a moment for fonts to load
      await new Promise(r => setTimeout(r, 500));
      const outputPath = path.join(OUTPUT_DIR, `${id}.png`);
      await page.screenshot({ path: outputPath, fullPage: true });
      const stats = fs.statSync(outputPath);
      console.log(`  ✓ Saved: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Failed: ${id} — ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! All previews captured.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});