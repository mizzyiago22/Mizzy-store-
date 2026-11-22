'use strict';
// "Before you buy a number" notice — shown as a pop-up on the buy-number pages.
// The admin edits the text (or switches it off) in the admin panel; customers must tap
// "I understand, continue" before the pop-up closes.
//
// Routes:
//   GET /api/buy-notice          public — { enabled, message, version }
//   GET /api/admin/buy-notice    admin  — same, for the editor
//   PUT /api/admin/buy-notice    admin  — { enabled, message }

const DEFAULT_MESSAGE = [
  '⚠️ BEFORE YOU BUY A NUMBER, PLEASE READ!',
  '',
  'Experiencing WhatsApp login issues like "Login Unavailable" or "Try Again Later"?',
  '',
  '1. Use a good VPN. We recommend Octohide Free VPN or Cat VPN.',
  '2. Set your VPN location to the same country as the number you want to purchase.',
  '3. Uninstall WhatsApp and reinstall the official version.',
  '4. Clear WhatsApp cache and data.',
  '5. Enter your number and request the verification code.',
  '6. Avoid requesting codes repeatedly.',
].join('\n');

module.exports.register = function register(app, deps) {
  const { mongoose, anyAdminAuth } = deps;

  const schema = new mongoose.Schema({
    key:       { type: String, default: 'main', unique: true },
    enabled:   { type: Boolean, default: true },
    message:   { type: String, default: DEFAULT_MESSAGE, maxlength: 4000 },
    updatedAt: { type: Date, default: Date.now },
  });
  const BuyNotice = mongoose.models.BuyNotice || mongoose.model('BuyNotice', schema);

  async function load() {
    try {
      let d = await BuyNotice.findOne({ key: 'main' });
      if (!d) d = await BuyNotice.create({ key: 'main' });
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

  app.get('/api/buy-notice', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json(shape(await load()));
  });

  app.get('/api/admin/buy-notice', anyAdminAuth, async (req, res) => {
    res.json({ ...shape(await load()), defaultMessage: DEFAULT_MESSAGE });
  });

  app.put('/api/admin/buy-notice', anyAdminAuth, async (req, res) => {
    try {
      const b = req.body || {};
      const d = await load();
      if (!d.save) return res.status(500).json({ error: 'Could not load the notice settings.' });
      if (typeof b.enabled === 'boolean') d.enabled = b.enabled;
      if (typeof b.message === 'string') {
        const m = b.message.replace(/\r\n/g, '\n').trim();
        if (m.length > 4000) return res.status(400).json({ error: 'Message is too long (max 4000 characters).' });
        d.message = m;
      }
      d.updatedAt = new Date(); // new version → customers see the updated notice again
      await d.save();
      res.json(shape(d));
    } catch (e) { res.status(500).json({ error: 'Could not save the notice.' }); }
  });
};
