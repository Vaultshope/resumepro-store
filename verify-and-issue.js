/**
 * verify-and-issue.js
 *
 * One-command seller workflow:
 *   1. Verifies TX hash via BscScan API
 *   2. Generates an unlock code
 *   3. Updates codes.json (public)
 *   4. Commits + pushes to GitHub
 *
 * Usage:
 *   node verify-and-issue.js <TX_HASH> <customer_email> [template_ids...]
 *
 * Examples:
 *   node verify-and-issue.js 0xabc123... buyer@email.com vibrant
 *   node verify-and-issue.js 0xabc123... buyer@email.com classic modern creative
 *   node verify-and-issue.js 0xabc123... buyer@email.com all
 *
 * Requires:
 *   - BSCSCAN_API_KEY env variable (free at bscscan.com/apis)
 *   - Git configured in this repo
 */

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const USDT_CONTRACT   = '0x55d398326f99059ff775485246999027b3197955';
const CODES_FILE      = path.join(__dirname, 'codes.json');
const REPO_DIR        = __dirname;

const args = process.argv.slice(2);
const txHash  = args[0];
const email   = args[1];
const rawTemplates = args.slice(2) || ['all'];

if (!BSCSCAN_API_KEY) {
  console.error('❌ BSCSCAN_API_KEY not set.');
  console.error('   Export it first: export BSCSCAN_API_KEY=your_key_here');
  console.error('   Get a free key at: https://bscscan.com/apis');
  process.exit(1);
}
if (!txHash) {
  console.error('Usage: node verify-and-issue.js <TX_HASH> <customer_email> [template_ids]');
  console.error('  template_ids: classic modern minimal ... or "all" for bundle');
  process.exit(1);
}

// ── BscScan helpers ──────────────────────────────────────────────────
function bscscanCall(params) {
  return new Promise((resolve, reject) => {
    const q = new URLSearchParams({ ...params, apikey: BSCSCAN_API_KEY });
    https.get(`https://api.bscscan.com/api?${q}`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function verifyTx(hash) {
  const [receipt, txData, blockData] = await Promise.all([
    bscscanCall({ module: 'proxy', action: 'eth_getTransactionReceipt', txhash: hash }),
    bscscanCall({ module: 'proxy', action: 'eth_getTransactionByHash', txhash: hash }),
    bscscanCall({ module: 'proxy', action: 'eth_getBlockByNumber', tag: (await receipt).result.blockNumber, boolean: false })
  ]);

  if (receipt.status !== '1') throw new Error('Transaction not found');
  const tx = receipt.result;
  const details = txData.result;
  const blockTime = parseInt(blockData.result.timestamp, 16);

  const status = tx.status === '0x1' ? 'SUCCESS' : 'FAILED';
  const isUsdt = details.to && details.to.toLowerCase() === USDT_CONTRACT.toLowerCase();
  const value = parseInt(details.value, 16) / 1e6; // USDT 6 decimals

  return { status, from: details.from, to: details.to, value, isUsdt, blockTime, blockNumber: tx.blockNumber };
}

// ── Code generation ──────────────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1
  let code = 'RESUME-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── codes.json helpers ───────────────────────────────────────────────
function loadCodes() {
  try { return JSON.parse(fs.readFileSync(CODES_FILE, 'utf8')); }
  catch { return { codes: [], templateAccess: {}, issued: [] }; }
}
function saveCodes(data) { fs.writeFileSync(CODES_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8'); }

const EXPIRY_DAYS = 365;

// ── Main ─────────────────────────────────────────────────────────────
(async function main() {
  console.log(`\n🔍 Verifying TX: ${txHash}\n`);

  let verified;
  try {
    verified = await verifyTx(txHash);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }

  console.log('  Status:', verified.status);
  console.log('  From:', verified.from);
  console.log('  To:', verified.to);
  console.log('  Value:', verified.value.toFixed(6), 'USDT');
  console.log('  USDT contract:', verified.isUsdt ? '✅' : '❌');
  console.log('  Age:', Math.floor((Date.now() / 1000 - verified.blockTime) / 60), 'min\n');

  if (verified.status !== 'SUCCESS' || !verified.isUsdt) {
    console.error('❌ VERIFICATION FAILED — not a valid USDT transfer.');
    process.exit(1);
  }

  console.log('✅ TX verified! Generating unlock code...\n');

  // Determine which templates this code unlocks
  const templates = rawTemplates.includes('all')
    ? 'ALL'
    : [...new Set(rawTemplates)];

  const code = generateCode();
  const codes = loadCodes();
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 86400000).toISOString();

  codes.codes.push(code);
  codes.templateAccess[code] = templates;
  codes.issued.push({
    code,
    txHash,
    email: email || 'unknown',
    templates,
    issuedAt: new Date().toISOString(),
    expiresAt,
    amount: verified.value
  });
  saveCodes(codes);

  // Commit to repo
  console.log('📤 Pushing codes.json to GitHub...\n');
  try {
    execSync('git add codes.json', { cwd: REPO_DIR, stdio: 'pipe' });
    execSync(`git commit -m "feat: add unlock code ${code} for ${templates}"`, { cwd: REPO_DIR, stdio: 'pipe' });
    execSync('git push origin master', { cwd: REPO_DIR, stdio: 'inherit' });
  } catch (err) {
    console.error('⚠️  Git push failed — codes.json updated locally but NOT public.');
    console.error('   Run: git push origin master');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ UNLOCK CODE READY\n');
  console.log(`   Code:        ${code}`);
  console.log(`   Templates:   ${Array.isArray(templates) ? templates.join(', ') : templates}`);
  console.log(`   Customer:    ${email || 'unknown'}`);
  console.log(`   Expires:     ${expiresAt.split('T')[0]} (${EXPIRY_DAYS} days)`);
  console.log(`   TX:          ${txHash}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📧 Email this to the customer:\n');
  console.log(`Subject: Your ResumePro Unlock Code — ${templates === 'ALL' ? 'Complete Bundle' : templates.join(', ')}\n`);
  console.log(`Hi,\n\nYour payment has been verified! Here's your unlock code:\n\n   ${code}\n\nValid for: ${Array.isArray(templates) ? templates.join(', ') : 'All 32 templates'}\nExpires: ${expiresAt.split('T')[0]}\n\nHow to use:\n1. Go to your store's customizer\n2. Enter this code to unlock all templates (or the ones you bought)\n3. Edit and download your resume instantly\n\nNeed help? Reply to this email.\n\nBest,\nResumePro\n`);
})();
