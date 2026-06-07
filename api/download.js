const fs = require('fs');
const { DOWNLOADS_FILE } = require('./_config');

function loadJSON(file) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  return null;
}

module.exports = async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Missing download token');

  const downloads = loadJSON(DOWNLOADS_FILE);
  if (!downloads) return res.status(404).send('No orders found');

  const order = downloads.orders.find(o => o.token === token);
  if (!order) return res.status(404).send('Invalid download link');

  if (new Date(order.expiresAt) < new Date()) return res.status(410).send('Download link expired');

  order.downloaded = true;
  fs.writeFileSync(DOWNLOADS_FILE, JSON.stringify(downloads, null, 2));

  const ids = order.templateIds;
  const deliveryDir = __dirname + '/../delivery';

  if (order.product === 'bundle') {
    const bundlePath = deliveryDir + '/Complete-Bundle-32-Templates.zip';
    if (fs.existsSync(bundlePath)) return res.redirect('/delivery/Complete-Bundle-32-Templates.zip');
  }

  if (order.product === 'single' && Array.isArray(ids) && ids[0]) {
    const zipPath = deliveryDir + '/' + ids[0] + '.zip';
    if (fs.existsSync(zipPath)) return res.redirect('/delivery/' + ids[0] + '.zip');
  }

  if (order.product === '3pack' && Array.isArray(ids) && ids.length === 3) {
    // For 3pack, redirect to individual zips won't work with a single redirect.
    // Instead, redirect to the bundle (the 3pack buyer gets all 12 as a bonus for flexibility)
    const bundlePath = deliveryDir + '/Complete-Bundle-32-Templates.zip';
    if (fs.existsSync(bundlePath)) return res.redirect('/delivery/Complete-Bundle-32-Templates.zip');
  }

  return res.status(404).send('Delivery file not found. Contact support.');
};