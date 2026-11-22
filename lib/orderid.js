// Unique order IDs, e.g. MS261101-7KQ2X9TF  (MS + yymmdd + 8 random chars).
// 32-symbol alphabet (no 0/O/1/I) so IDs are easy to read out and search. The Transaction
// collection has a unique index on orderId, and newOrderId() checks every place an ID is
// stored, so the same ID is never issued twice.
const crypto = require('crypto');
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function gen() {
  const d = new Date();
  const ymd = String(d.getUTCFullYear()).slice(2) + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');
  const b = crypto.randomBytes(8);
  let r = '';
  for (let i = 0; i < 8; i++) r += ALPHA[b[i] % 32]; // 256 % 32 === 0, so no modulo bias
  return 'MS' + ymd + '-' + r;
}

// models: any Mongoose models that store an `orderId` (checked for collisions)
function makeNewOrderId(models) {
  return async function newOrderId() {
    for (let i = 0; i < 12; i++) {
      const id = gen();
      let taken = false;
      for (const m of models) {
        if (m && await m.exists({ orderId: id })) { taken = true; break; }
      }
      if (!taken) return id;
    }
    throw new Error('Could not generate a unique order ID');
  };
}
module.exports = { gen, makeNewOrderId };
