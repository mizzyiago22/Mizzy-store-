'use strict';
// "How to fund your wallet" guide — shown as a pop-up when a customer opens the Deposit page,
// BEFORE the Virtual Account / Payment Link options. The admin edits the text (or switches it
// off) in the admin panel; customers must tap "I understand, continue" to reach the deposit page.
//
// Routes:
//   GET /api/deposit-guide        public — { enabled, message, version }
//   GET /api/admin/deposit-guide  admin  — same, for the editor (+ defaultMessage)
//   PUT /api/admin/deposit-guide  admin  — { enabled, message }

const DEFAULT_MESSAGE = [
  'HOW TO FUND YOUR WALLET',
  '',
  'Please read this quickly before you continue. You can deposit in 2 ways:',
  '',
  'Option 1 — Virtual Account (bank transfer):',
  '1. Tap "Generate Virtual Account" (first time only — it is free and permanent).',
  '2. Copy the account number and bank name shown on your page.',
  '3. Open your bank app and send money to that account. Add the small flat fee shown in the fee table (example: to get ₦1,000 in your wallet, send ₦1,050).',
  '4. Wait a few minutes. Your wallet is credited automatically — no receipt needed.',
  '',
  'Option 2 — Payment Link:',
  '1. Tap "Payment Link" and enter the amount you want to add.',
  '2. Tap Continue, then pay on the secure payment page that opens.',
  '3. The link expires after 30 minutes, so pay quickly. If it expires, just generate a new one.',
  '4. Do not close the page until your payment is done. Your wallet is credited automatically.',
  '',
  'Important:',
  'Only pay into the account or link shown on YOUR own deposit page. Never send money to anyone who messages you privately. If your wallet is not credited after 30 minutes, contact support with your payment proof.',
].join('\n');

module.exports.register = function register(app, deps) {
  const { mongoose, anyAdminAuth } = deps;

  const schema = new mongoose.Schema({
    key:       { type: String, default: 'main', unique: true },
    enabled:   { type: Boolean, default: true },
    message:   { type: String, default: DEFAULT_MESSAGE, maxlength: 4000 },
    updatedAt: { type: Date, default: Date.now },
  });
  const DepositGuide = mongoose.models.DepositGuide || mongoose.model('DepositGuide', schema);

  async function load() {
    try {
      let d = await DepositGuide.findOne({ key: 'main' });
      if (!d) d = await DepositGuide.create({ key: 'main' });
      return d;
    } catch (e) {
      return { enabled: true, message: DEFAULT_MESSAGE, updatedAt: new Date(0) };
    }
  }
  const shape = (d) => ({
    enabled: !!d.enabled,
    message: d.message || '',
    version: String(new Date(d.updatedAt || 0).getTime()),
  });

  app.get('/api/deposit-guide', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(shape(await load()));
  });

  app.get('/api/admin/deposit-guide', anyAdminAuth, async (req, res) => {
    res.json({ ...shape(await load()), defaultMessage: DEFAULT_MESSAGE });
  });

  app.put('/api/admin/deposit-guide', anyAdminAuth, async (req, res) => {
    try {
      const b = req.body || {};
      const d = await load();
      if (!d.save) return res.status(500).json({ error: 'Could not load the guide settings.' });
      if (typeof b.enabled === 'boolean') d.enabled = b.enabled;
      if (typeof b.message === 'string') {
        const m = b.message.replace(/\r\n/g, '\n').trim();
        if (m.length > 4000) return res.status(400).json({ error: 'Message is too long (max 4000 characters).' });
        d.message = m;
      }
      d.updatedAt = new Date();
      await d.save();
      res.json(shape(d));
    } catch (e) { res.status(500).json({ error: 'Could not save the guide.' }); }
  });
};
