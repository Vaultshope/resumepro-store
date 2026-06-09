const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  BSCSCAN_API_KEY, RESEND_API_KEY, FROM_EMAIL, SITE_URL,
  USDT_CONTRACT, ALL_TEMPLATE_IDS, TEMPLATE_NAMES,
  PRODUCTS, WALLET_ADDRESS
} = require('./_config');

const CODES_FILE = '/tmp/codes.json';
const SIGNING_KEY = process.env.TOKEN_SIGNING_KEY || 'resumepro-default-signing-key-change-me';

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadJSON(file) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  return null;
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = crypto.randomBytes(8);
  let code = 'RESUME-';
  for (let i = 0; i < 4; i++) code += chars[rand[i] % chars.length];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[rand[i + 4] % chars.length];
  return code;
}

function generateDownloadToken(data) {
  const encodedData = Buffer.from(JSON.stringify(data)).toString('base64url');
  const ts = Date.now().toString(36);
  const sig = crypto.createHmac('sha256', SIGNING_KEY)
    .update(encodedData + '.' + ts)
    .digest('hex');
  return encodedData + '.' + ts + '.' + sig;
}

function bscscanCall(params) {
  return new Promise((resolve, reject) => {
    const q = new URLSearchParams({ ...params, apikey: BSCSCAN_API_KEY });
    const req = https.get(`https://api.bscscan.com/api?${q}`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('BscScan API timeout')); });
  });
}

async function verifyTx(hash) {
  const [receipt, txData] = await Promise.all([
    bscscanCall({ module: 'proxy', action: 'eth_getTransactionReceipt', txhash: hash }),
    bscscanCall({ module: 'proxy', action: 'eth_getTransactionByHash', txhash: hash })
  ]);
  if (receipt.status !== '1') throw new Error('Transaction not found on BSC');
  const tx = receipt.result;
  const details = txData.result;
  if (tx.status !== '0x1') throw new Error('Transaction failed');
  const isUsdt = details.to && details.to.toLowerCase() === USDT_CONTRACT.toLowerCase();
  const value = parseInt(details.value, 16) / 1e6;
  return { success: true, from: details.from, to: details.to, value, isUsdt, blockNumber: tx.blockNumber, status: 'SUCCESS', logs: tx.logs || [] };
}

function sendEmail(email, subject, html) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ from: FROM_EMAIL ? `ResumePro <${FROM_EMAIL}>` : 'ResumePro <noreply@resumepro.store>', to: email, subject, html });
    const req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b))); });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://resumepro-store.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; }, 25000);

  try {
    const { txHash, email, product, templateIds } = req.body;
    if (timedOut) return;

    if (!txHash || !email || !product) {
      return res.status(400).json({ error: 'Missing required fields: txHash, email, product' });
    }

    if (!TX_HASH_RE.test(txHash)) {
      return res.status(400).json({ error: 'Invalid TX hash format. Must be a 66-character hex string starting with 0x.' });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    if (!BSCSCAN_API_KEY) return res.status(500).json({ error: 'BSCSCAN_API_KEY not configured' });
    if (!WALLET_ADDRESS) return res.status(500).json({ error: 'WALLET_ADDRESS not configured' });

    const productConfig = PRODUCTS[product];
    if (!productConfig) return res.status(400).json({ error: 'Invalid product type' });

    // Prevent TX hash reuse
    const existing = loadJSON(CODES_FILE);
    if (existing && existing.processedTxs && existing.processedTxs.includes(txHash.toLowerCase())) {
      return res.status(400).json({ error: 'This transaction has already been verified.' });
    }

    const verified = await verifyTx(txHash);
    if (!verified.isUsdt) return res.status(400).json({ error: 'Transaction is not a USDT transfer' });

    // Verify the USDT was sent TO the store's wallet by parsing Transfer event logs
    const logs = verified.logs || [];
    let sentToStore = false;
    for (const log of logs) {
      const topic0 = log.topics && log.topics[0];
      if (topic0 && topic0.toLowerCase() === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
        const recipient = log.topics[2] ? '0x' + log.topics[2].slice(-40).toLowerCase() : '';
        if (recipient === WALLET_ADDRESS.toLowerCase()) {
          sentToStore = true;
          break;
        }
      }
    }

    if (!sentToStore) {
      return res.status(400).json({ error: 'Payment was not sent to the store wallet. Verify the recipient address.' });
    }

    const expectedPrice = productConfig.price;
    const tolerance = 0.01;
    if (verified.value < expectedPrice - tolerance) {
      return res.status(400).json({ error: `Payment too low: ${verified.value.toFixed(2)} USDT. Expected at least $${expectedPrice} USDT.` });
    }

    // Determine which templates are unlocked based on product + templateIds
    let unlockedTemplates = [];
    let templateLabel = '';
    let templateNamesList = '';

    if (product === 'bundle') {
      unlockedTemplates = ['ALL'];
      templateLabel = 'Complete Bundle (All 32 Templates)';
      templateNamesList = ALL_TEMPLATE_IDS.map(id => `• ${TEMPLATE_NAMES[id]}`).join('<br>');
    } else if (product === 'single') {
      const id = (Array.isArray(templateIds) && templateIds[0]) ? templateIds[0].toLowerCase() : null;
      if (!id || !TEMPLATE_NAMES[id]) {
        return res.status(400).json({ error: 'Invalid template ID for single purchase' });
      }
      unlockedTemplates = [id];
      templateLabel = `${TEMPLATE_NAMES[id]} Template`;
      templateNamesList = `• ${TEMPLATE_NAMES[id]}`;
    } else if (product === '3pack') {
      if (!Array.isArray(templateIds) || templateIds.length !== 3) {
        return res.status(400).json({ error: '3-Pack requires exactly 3 template IDs' });
      }
      const validIds = templateIds.map(id => id.toLowerCase()).filter(id => TEMPLATE_NAMES[id]);
      if (validIds.length !== 3) {
        return res.status(400).json({ error: 'One or more template IDs are invalid' });
      }
      unlockedTemplates = validIds;
      templateLabel = `3-Template Pack (${validIds.map(id => TEMPLATE_NAMES[id]).join(', ')})`;
      templateNamesList = validIds.map(id => `• ${TEMPLATE_NAMES[id]}`).join('<br>');
    } else {
      return res.status(400).json({ error: 'Invalid product type' });
    }

    const unlockCode = generateCode();
    const downloadToken = generateDownloadToken({
      product,
      templateId: product === 'single' ? unlockedTemplates[0] : null,
      exp: Date.now() + 90 * 86400000
    });

    const downloadUrl = `${SITE_URL}/download/${downloadToken}`;

    const codes = loadJSON(CODES_FILE) || { codes: [], templateAccess: {}, issued: [], processedTxs: [] };
    codes.processedTxs = codes.processedTxs || [];
    codes.processedTxs.push(txHash.toLowerCase());
    codes.codes.push(unlockCode);
    codes.templateAccess[unlockCode] = unlockedTemplates.includes('ALL') ? 'ALL' : unlockedTemplates;
    codes.issued.push({
      code: unlockCode, txHash, email,
      templates: unlockedTemplates.includes('ALL') ? 'ALL' : unlockedTemplates,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
      amount: verified.value, product
    });
    try { saveJSON(CODES_FILE, codes); } catch {}

    // Send email with unlock code
    if (RESEND_API_KEY && FROM_EMAIL) {
      const templatesText = unlockedTemplates.includes('ALL')
        ? 'all 32 templates'
        : unlockedTemplates.map(id => TEMPLATE_NAMES[id]).join(', ');

      await sendEmail(email, `Your ResumePro Unlock Code — ${templateLabel}`, `
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:2rem;">
          <h2 style="color:#4f46e5;">Payment Verified!</h2>
          <p style="color:#475569;">USDT payment confirmed: <strong>$${verified.value.toFixed(2)}</strong></p>
          <p style="color:#475569;">Product: <strong>${templateLabel}</strong></p>
          <div style="background:#f5f3ff;border:2px dashed #4f46e5;border-radius:12px;padding:1.5rem;margin:1.5rem 0;text-align:center;">
            <p style="font-size:0.8rem;color:#64748b;margin-bottom:0.5rem;">Your unlock code:</p>
            <div style="font-family:monospace;font-size:1.5rem;font-weight:700;color:#4f46e5;letter-spacing:0.15em;">${unlockCode}</div>
          </div>
          <div style="background:#f0fdf4;border-radius:12px;padding:1rem;margin:1rem 0;">
            <p style="font-weight:600;color:#065f46;margin-bottom:0.5rem;">Unlocks:</p>
            <div style="color:#166534;font-size:0.85rem;line-height:1.6;">${templateNamesList}</div>
          </div>
          <div style="background:#f0fdf4;border-radius:12px;padding:1rem;margin:1rem 0;">
            <p style="font-weight:600;color:#065f46;margin-bottom:0.5rem;">How to use:</p>
            <ol style="color:#166534;font-size:0.85rem;line-height:1.8;padding-left:1.2rem;">
              <li>Go to <strong>${SITE_URL}/customize.html</strong></li>
              <li>Select your template</li>
              <li>Click <strong>"Enter Unlock Code"</strong> in the sidebar</li>
              <li>Paste: <strong>${unlockCode}</strong></li>
              <li>Edit your resume, then click <strong>"Download PDF"</strong></li>
            </ol>
          </div>
          <div style="background:#fefce8;border-radius:8px;padding:0.75rem;margin:1rem 0;font-size:0.8rem;color:#854d0e;">
            Download link: <a href="${downloadUrl}" style="color:#4f46e5;">${downloadUrl}</a>
          </div>
        </div>
      `);
    }

    clearTimeout(timer);
    return res.status(200).json({
      success: true,
      unlockCode,
      downloadUrl,
      productLabel: templateLabel,
      unlockedTemplates,
      amount: verified.value,
      message: 'Payment verified! Check your email for the unlock code.'
    });

  } catch (err) {
    clearTimeout(timer);
    console.error('verify-payment error:', err.message);
    if (err.message.includes('not found') || err.message.includes('not confirmed')) {
      return res.status(400).json({ error: 'Transaction not found on BSC. Make sure you entered the correct TX hash.' });
    }
    if (err.message.includes('failed')) {
      return res.status(400).json({ error: 'Transaction failed on-chain. Check the TX status on BscScan.' });
    }
    if (err.message === 'BscScan API timeout' || timedOut) {
      return res.status(504).json({ error: 'BscScan API timed out. Please try again in a few minutes.' });
    }
    return res.status(500).json({ error: 'Verification failed. Try again or email support.' });
  }
};