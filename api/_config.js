const PRODUCTS = {
  single: { price: 2, label: 'Single Template' },
  '3pack': { price: 5, label: '3-Template Pack' },
  bundle: { price: 10, label: 'Complete Bundle (All 32 Templates)' }
};

const ALL_TEMPLATE_IDS = [
  'classic','modern','minimal','executive','editorial',
  'creative','technical','academic','bold','elegant',
  'compact','vibrant',
  'mcwell','altacv','friggeri','twentys','material',
  'orbit','hipster','rows','sidebarleft','infographic',
  'sharp','simple','thoughteer','pseudomanifold','bobok',
  'cies','gboeing','roycoding','agonist','sc932'
];

const TEMPLATE_NAMES = {
  classic:'Classic', modern:'Modern', minimal:'Minimal', executive:'Executive',
  editorial:'Editorial', creative:'Creative', technical:'Technical',
  academic:'Academic', bold:'Bold', elegant:'Elegant', compact:'Compact', vibrant:'Vibrant',
  mcwell:'McWell', altacv:'AltaCV', friggeri:'Friggeri', twentys:'TwentySeconds',
  material:'Material', orbit:'Orbit', hipster:'Hipster', rows:'Rows',
  sidebarleft:'Sidebar Left', infographic:'Infographic',
  sharp:'Sharp', simple:'Simple', thoughteer:'Thoughteer',
  pseudomanifold:'Pseudomanifold', bobok:'Bobok',
  cies:'Cies', gboeing:'GBoeing', roycoding:'RoyCoding',
  agonist:'Agonist', sc932:'SC932'
};

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || '0x56da8226d5a0e833e91ca4b3614be0b4e5b34b6b';
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'thinkedover@gmail.com';
const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.SITE_URL || 'http://localhost:8000');

const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';
const DOWNLOADS_FILE = '/tmp/downloads.json';

module.exports = {
  PRODUCTS, ALL_TEMPLATE_IDS, TEMPLATE_NAMES,
  WALLET_ADDRESS, BSCSCAN_API_KEY, RESEND_API_KEY,
  FROM_EMAIL, SITE_URL, USDT_CONTRACT, DOWNLOADS_FILE
};