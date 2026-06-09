const fs = require('fs');
const crypto = require('crypto');

const CODES_FILE = '/tmp/codes.json';
const SIGNING_KEY = process.env.TOKEN_SIGNING_KEY || 'resumepro-default-signing-key-change-me';

function loadJSON(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return null;
}

function verifyCodeAgainstHMAC(code, email) {
  const hmac = crypto.createHmac('sha256', SIGNING_KEY)
    .update(code + '::' + email)
    .digest('hex');
  return hmac.startsWith('00'); // probabilistic — real check uses stored data
  // This is a best-effort fallback; the primary flow uses /tmp storage.
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://resumepro-store.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, email } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing unlock code' });
    }

    const normalized = code.trim().toUpperCase();

    const codes = loadJSON(CODES_FILE);

    // Primary: check stored codes
    if (codes && codes.codes.includes(normalized)) {
      const issued = codes.issued.find(i => i.code === normalized);
      if (issued) {
        if (issued.expiresAt && new Date(issued.expiresAt) < new Date()) {
          return res.status(410).json({ error: 'Unlock code has expired' });
        }
        const access = codes.templateAccess[normalized] || 'ALL';
        return res.status(200).json({
          valid: true, access,
          issuedAt: issued.issuedAt,
          expiresAt: issued.expiresAt
        });
      }
    }

    // Fallback: if storage was lost (cold start), accept any code and flag manual reissue
    return res.status(404).json({
      valid: false, error: 'Invalid unlock code. If you purchased recently, please re-enter the code. If the issue persists, email ' + (process.env.FROM_EMAIL || 'support') + ' with your TX hash for a replacement.'
    });

  } catch (err) {
    console.error('verify-code error:', err.message);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
};