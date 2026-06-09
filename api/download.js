const fs = require('fs');
const path = require('path');
const { DOWNLOADS_FILE, TEMPLATE_NAMES } = require('./_config');

function loadJSON(file) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  return null;
}

const VALID_IDS = new Set(Object.keys(TEMPLATE_NAMES));

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
  if (!token || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).send('Invalid download token');
  }

  const downloads = loadJSON(DOWNLOADS_FILE);
  if (!downloads) return res.status(404).send('No orders found');

  const order = downloads.orders.find(o => o.token === token);
  if (!order) return res.status(404).send('Invalid download link');
  if (new Date(order.expiresAt) < new Date()) return res.status(410).send('Download link expired');

  order.downloaded = true;
  fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));

  const deliveryDir = path.resolve(__dirname, '..', 'delivery');

  if (order.product === 'bundle' || order.product === '3pack') {
    const bundlePath = path.join(deliveryDir, 'Complete-Bundle-32-Templates.zip');
    return serveFile(bundlePath, res);
  }

  if (order.product === 'single' && Array.isArray(order.templateIds) && order.templateIds[0]) {
    const id = order.templateIds[0];
    if (!VALID_IDS.has(id)) return res.status(400).send('Invalid template');
    const zipPath = path.join(deliveryDir, id + '.zip');
    return serveFile(zipPath, res);
  }

  return res.status(404).send('Delivery file not found. Contact support.');
};