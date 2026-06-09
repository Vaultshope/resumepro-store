const crypto = require('crypto');
const { PRODUCTS, WALLET_ADDRESS } = require('./_config');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://resumepro-store.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { product, templateName } = req.body;

    if (!product || !PRODUCTS[product]) {
      return res.status(400).json({ error: 'Invalid product. Valid: single, 3pack, bundle' });
    }

    if (!WALLET_ADDRESS) {
      return res.status(500).json({ error: 'Store not configured for payments' });
    }

    const p = PRODUCTS[product];
    const orderId = `RP-${crypto.randomUUID().split('-')[0].toUpperCase()}`;
    const label = product === 'single' && templateName
      ? `${templateName} Template`
      : p.label;

    return res.status(200).json({
      orderId,
      walletAddress: WALLET_ADDRESS,
      amount: p.price,
      currency: 'USDT',
      network: 'BSC (BEP-20)',
      productLabel: label,
      instructions: `Send exactly $${p.price} USDT (BEP-20) from your Binance wallet to the address above. After sending, come back and enter your TX hash + email to receive your files instantly.`
    });

  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};