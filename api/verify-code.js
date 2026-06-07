const fs = require('fs');

const CODES_FILE = '/tmp/codes.json';

function loadJSON(file) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {}
  return null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing unlock code' });
    }

    const normalized = code.trim().toUpperCase();

    const codes = loadJSON(CODES_FILE);
    if (!codes || !codes.codes.includes(normalized)) {
      return res.status(404).json({ error: 'Invalid unlock code' });
    }

    const issued = codes.issued.find(i => i.code === normalized);
    if (!issued) {
      return res.status(404).json({ error: 'Unlock code not found' });
    }

    if (issued.expiresAt && new Date(issued.expiresAt) < new Date()) {
      return res.status(410).json({ error: 'Unlock code has expired' });
    }

    const access = codes.templateAccess[normalized] || 'ALL';

    return res.status(200).json({
      valid: true,
      access,
      issuedAt: issued.issuedAt,
      expiresAt: issued.expiresAt
    });

  } catch (err) {
    console.error('verify-code error:', err.message);
    return res.status(500).json({ error: 'Failed to verify code' });
  }
};