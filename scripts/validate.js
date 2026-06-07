const fs = require('fs');
const path = require('path');

const INDEX = path.join(__dirname, '..', 'index.html');
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const PREVIEWS_DIR = path.join(__dirname, '..', 'previews');

let errors = 0;
let warnings = 0;

function check(msg, ok, detail) {
  if (ok) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.log(`  ✗ ${msg}${detail ? ` — ${detail}` : ''}`);
    errors++;
  }
}

function warn(msg, detail) {
  console.log(`  ⚠ ${msg}${detail ? ` — ${detail}` : ''}`);
  warnings++;
}

function parseTemplateIds(html) {
  const match = html.match(/const\s+templates\s*=\s*\[([\s\S]*?)\];/);
  if (!match) return [];
  return [...match[1].matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);
}

function parseTemplateNames(html) {
  const match = html.match(/const\s+templates\s*=\s*\[([\s\S]*?)\];/);
  if (!match) return [];
  return [...match[1].matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
}

function parseLivePreviewLinks(html) {
  const links = [...html.matchAll(/href="templates\/([^"]+)\.html"/g)].map(m => m[1]);
  return [...new Set(links)];
}

// 1. index.html exists
check('index.html exists', fs.existsSync(INDEX));

const indexHtml = fs.readFileSync(INDEX, 'utf8');

// 2. Parse template IDs from data
const templateIds = parseTemplateIds(indexHtml);
const templateNames = parseTemplateNames(indexHtml);
check('Template data found in index.html', templateIds.length > 0, `Found ${templateIds.length} entries`);

// 3. All template HTML files exist
if (fs.existsSync(TEMPLATES_DIR)) {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html'));
  const fileIds = files.map(f => f.replace('.html', ''));

  check(`templates/ directory exists with ${files.length} HTML files`, files.length > 0);

  for (const id of templateIds) {
    check(`Template file: ${id}.html`, fileIds.includes(id));
  }

  for (const f of files) {
    const id = f.replace('.html', '');
    if (!templateIds.includes(id)) {
      warn(`Orphan template file not referenced in index.html: ${f}`);
    }
  }
}

// 4. Preview images exist
if (fs.existsSync(PREVIEWS_DIR)) {
  const previews = fs.readdirSync(PREVIEWS_DIR).filter(f => f.endsWith('.png'));
  check(`previews/ directory exists with ${previews.length} PNGs`, previews.length > 0);

  for (const id of templateIds) {
    if (previews.includes(`${id}.png`)) {
      check(`Preview image: ${id}.png`, true);
    } else {
      warn(`Preview image: ${id}.png is missing (run npm run preview:capture to generate)`);
    }
  }

  for (const f of previews) {
    const id = f.replace('.png', '');
    if (!templateIds.includes(id)) {
      warn(`Orphan preview not referenced in index.html: ${f}`);
    }
  }
}

// 5. Live preview links resolve to existing files
const liveLinks = parseLivePreviewLinks(indexHtml);
if (liveLinks.length > 0) {
  const fileIds = fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html')).map(f => f.replace('.html', '')) : [];
  for (const id of liveLinks) {
    if (id.startsWith('${')) {
      warn(`Template literal in live preview link (dynamic): templates/${id}.html`);
      continue;
    }
    check(`Live preview link → ${id}.html`, fileIds.includes(id), 'broken link');
  }
}

// 6. Check for placeholder wallet address (security)
const PLACEHOLDER_WALLET = '0x56da8226d5a0e833e91ca4b3614be0b4e5b34b6b';
if (indexHtml.includes(PLACEHOLDER_WALLET)) {
  warn('Placeholder wallet address still present in index.html', 'Replace with your real address before going live');
}

// 7. Check for placeholder seller password
if (indexHtml.includes("sellerPassword: 'BlueMoon_2026'")) {
  warn('Default seller password still present', 'Change in STORE config before going live');
}

// 8. Check for old placeholder email
if (indexHtml.includes('memospixel@gmail.com')) {
  warn('Old placeholder contact email still present', 'Update to real email before going live');
}

// Summary
console.log('\n---');
if (errors === 0 && warnings === 0) {
  console.log('All checks passed! ✓');
} else {
  console.log(`Results: ${errors} error(s), ${warnings} warning(s)`);
  if (errors > 0) process.exit(1);
}
