const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { TEMPLATE_NAMES, PRODUCTS } = require('./_config');

const VALID_IDS = new Set(Object.keys(TEMPLATE_NAMES));
const SIGNING_KEY = process.env.TOKEN_SIGNING_KEY || 'resumepro-default-signing-key-change-me';

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedData, ts, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SIGNING_KEY)
      .update(encodedData + '.' + ts)
      .digest('hex');
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf8'));
    if (Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="' + path.basename(filePath) + '"',
    'Content-Length': stat.size,
    'Cache-Control': 'private, max-age=3600'
  });
  fs.createReadStream(filePath).pipe(res);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://resumepro-store.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    return res.status(400).send('Invalid download token');
  }

  const data = verifyToken(token);
  if (!data) return res.status(404).send('Invalid or expired download link');

  const deliveryDir = path.resolve(__dirname, '..', 'delivery');

  if (data.product === 'bundle' || data.product === '3pack') {
    const bundlePath = path.join(deliveryDir, 'Complete-Bundle-32-Templates.zip');
    return serveFile(bundlePath, res);
  }

  if (data.product === 'single' && data.templateId) {
    const id = data.templateId;
    if (!VALID_IDS.has(id)) return res.status(400).send('Invalid template');
    const zipPath = path.join(deliveryDir, id + '.zip');
    return serveFile(zipPath, res);
  }

  return res.status(404).send('Delivery file not found. Contact support.');
};