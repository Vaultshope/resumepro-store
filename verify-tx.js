/**
 * verify-tx.js
 *
 * Verifies a BSC transaction via BscScan API and returns transaction details.
 *
 * Usage:
 *   node verify-tx.js <TX_HASH>
 *
 * Requires: BSCSCAN_API_KEY env variable (get free at bscscan.com/apis)
 */

const https = require('https');

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;
const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955';

if (!BSCSCAN_API_KEY) {
  console.error('Error: Set BSCSCAN_API_KEY environment variable.');
  console.error('Get a free key at: https://bscscan.com/apis');
  process.exit(1);
}

const txHash = process.argv[2];
if (!txHash) {
  console.error('Usage: node verify-tx.js <TX_HASH>');
  process.exit(1);
}

function bscscanCall(params) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams({
      ...params,
      apikey: BSCSCAN_API_KEY
    });
    const url = `https://api.bscscan.com/api?${query}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    // 1. Get transaction receipt
    const receipt = await bscscanCall({
      module: 'proxy',
      action: 'eth_getTransactionReceipt',
      txhash: txHash
    });

    if (receipt.status !== '1') {
      console.error('❌ Transaction not found or not confirmed on BSC.');
      process.exit(1);
    }

    const tx = receipt.result;

    // 2. Get transaction details
    const txData = await bscscanCall({
      module: 'proxy',
      action: 'eth_getTransactionByHash',
      txhash: txHash
    });

    const txDetails = txData.result;

    // 3. Get block timestamp
    const blockData = await bscscanCall({
      module: 'proxy',
      action: 'eth_getBlockByNumber',
      tag: tx.blockNumber,
      boolean: false
    });

    const blockTime = parseInt(blockData.result.timestamp, 16);
    const now = Math.floor(Date.now() / 1000);

    // 4. Check status
    const status = tx.status === '0x1' ? 'SUCCESS' : 'FAILED';
    
    // 5. Check if it's a USDT transfer
    const isUsdt = txDetails.to && txDetails.to.toLowerCase() === USDT_CONTRACT.toLowerCase();
    
    // 6. Parse USDT transfer value (USDT has 18 decimals on BSC)
    const valueWei = parseInt(txDetails.value, 16);
    const valueUsdt = valueWei / 1e6; // USDT on BSC typically uses 6 decimals

    console.log('\n🔍 Transaction Verification Result\n');
    console.log(`  TX Hash:   ${txHash}`);
    console.log(`  Status:    ${status}`);
    console.log(`  From:      ${txDetails.from}`);
    console.log(`  To:        ${txDetails.to}`);
    console.log(`  Value:     ${valueUsdt.toFixed(6)} USDT`);
    console.log(`  Block:     ${tx.blockNumber}`);
    console.log(`  Time:      ${new Date(blockTime * 1000).toISOString()}`);
    console.log(`  USDT:      ${isUsdt ? '✅ Yes' : '❌ No (not a USDT transfer)'}`);
    console.log(`  Age:       ${Math.floor((now - blockTime) / 60)} minutes ago\n`);

    if (status === 'SUCCESS' && isUsdt) {
      console.log('✅ VERIFICATION PASSED — This is a valid USDT transfer on BSC.');
    } else {
      console.log('❌ VERIFICATION FAILED — Please check the transaction details above.');
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
