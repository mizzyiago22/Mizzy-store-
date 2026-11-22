'use strict';
// Tiger SMS number feature: customer routes, order model and signed webhook.
// Mounted from server.js with the app's own auth, wallet and pricing helpers.
const crypto = require('crypto');
const mongoose = require('mongoose');
const tiger = require('./tiger-sms');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Client-generated key per purchase attempt. Repeated requests return the same order, never a second charge.
  clientRef: { type: String, default: '', index: true },
  // Provider activation id. Kept server-side only; never returned to customers.
  activationId: { type: String, required: true, unique: true },
  service: { type: String, default: '' },
  serviceName: { type: String, default: '' },
  country: { type: Number, default: 0 },
  countryName: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  sellPrice: { type: Number, default: 0 },   // NGN charged to the customer
  costNgn: { type: Number, default: 0 },     // NGN cost before markup
  costUsd: { type: Number, default: 0 },
  // waiting -> delivered (code arrived) -> completed | waiting -> cancelled | expired
  status: { type: String, enum: ['waiting', 'delivered', 'completed', 'cancelled', 'expired'], default: 'waiting', index: true },
  code: { type: String, default: '' },
  smsText: { type: String, default: '' },
  codeAt: { type: Date },
  expiresAt: { type: Date },
  cancelledAt: { type: Date },
  completedAt: { type: Date },
  providerError: { type: String, default: '' }
}, { timestamps: true });

const TigerOrder = mongoose.models.TigerOrder || mongoose.model('TigerOrder', orderSchema);

function view(o) {
  return {
    id: String(o._id),
    service: o.serviceName || o.service,
    country: o.countryName,
    phoneNumber: o.phoneNumber,
    sellPrice: o.sellPrice,
    status: o.status,
    code: o.code || '',
    smsText: o.smsText || '',
    codeAt: o.codeAt || null,
    expiresAt: o.expiresAt || null,
    createdAt: o.createdAt || null,
    cancelledAt: o.cancelledAt || null,
    completedAt: o.completedAt || null
  };
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function mountTiger(app, deps) {
  const { auth, User, Transaction, getConfig, applyMarkup, creditReferralCommission, windowMs } = deps;
  const NGN_PER_USD = (cfg) => Number(cfg.usdToNgn) || 0;
  // Country list with the ISO code and flag, so the page can show real flags like the other buy pages.
  const withFlag = (c) => {
    const code = (deps.isoFor ? deps.isoFor(c.name) : '') || '';
    const flag = code.length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '🌍';
    return { ...c, code, flag };
  };

  // Refund exactly once. Only a 'waiting' order (no code yet) can be refunded, and the status flip is atomic.
  async function refundOnce(order, nextStatus, label) {
    const flipped = await TigerOrder.findOneAndUpdate(
      { _id: order._id, status: 'waiting', code: '' },
      { $set: { status: nextStatus, cancelledAt: new Date() } },
      { new: true }
    );
    if (!flipped) return null;
    await User.updateOne({ _id: order.userId }, { $inc: { balance: order.sellPrice } });
    await Transaction.create({
      userId: order.userId, type: 'admin_credit', amount: order.sellPrice,
      description: `Refund: ${order.serviceName} number (${order.countryName}) — ${label}`, status: 'success'
    });
    return flipped;
  }

  // Pull the code from the provider into the order. Safe to call repeatedly.
  async function syncCode(order) {
    if (order.code || order.status !== 'waiting') return order;
    try {
      const got = await tiger.getCode(order.activationId);
      if (got) {
        const updated = await TigerOrder.findOneAndUpdate(
          { _id: order._id, code: '', status: 'waiting' },
          { $set: { code: got.code, smsText: got.text.slice(0, 500), codeAt: new Date(), status: 'delivered', providerError: '' } },
          { new: true }
        );
        return updated || await TigerOrder.findById(order._id);
      }
      if (order.providerError) await TigerOrder.updateOne({ _id: order._id }, { $set: { providerError: '' } });
    } catch (e) {
      await TigerOrder.updateOne({ _id: order._id }, { $set: { providerError: String(e.message).slice(0, 300) } });
    }
    // Past the window with no code: release the number on the provider, then refund.
    if (order.expiresAt && Date.now() > new Date(order.expiresAt).getTime()) {
      try {
        await tiger.setStatus(order.activationId, 8);
      } catch (e) {
        // A code arrived after all: deliver it instead of refunding.
        if (e.code === 'SMS_RECEIVED' && e.info && e.info.code) {
          const delivered = await TigerOrder.findOneAndUpdate(
            { _id: order._id, code: '', status: 'waiting' },
            { $set: { code: String(e.info.code), codeAt: new Date(), status: 'delivered' } },
            { new: true }
          );
          return delivered || TigerOrder.findById(order._id);
        }
        // Other provider errors: still refund, because the window has closed for the customer.
      }
      const refunded = await refundOnce(order, 'expired', 'code not received');
      if (refunded) return refunded;
      return TigerOrder.findById(order._id);
    }
    return order;
  }

  // ── Catalogue for the page ──────────────────────────────────────────────────
  app.get('/api/tiger/countries', auth, async (req, res) => {
    try {
      res.json((await tiger.getCountries()).map(withFlag));
    } catch (e) { res.status(502).json({ error: e.message }); }
  });

  // Services that have stock in one country, with the NGN price the customer pays.
  app.get('/api/tiger/services', auth, async (req, res) => {
    try {
      const country = Number(req.query.country);
      if (!country) return res.status(400).json({ error: 'Pick a country first.' });
      const [cfg, offers, names] = await Promise.all([getConfig(), tiger.getOffersForCountry(country), tiger.getServiceNames()]);
      const list = offers.map(o => {
        const costNgn = Math.round(o.usd * NGN_PER_USD(cfg));
        return { code: o.service, name: names.get(o.service) || o.service, priceNgn: applyMarkup(costNgn, cfg), stock: o.stock };
      }).sort((a, b) => a.name.localeCompare(b.name));
      res.json(list);
    } catch (e) { res.status(502).json({ error: e.message }); }
  });

  // ── Buy ─────────────────────────────────────────────────────────────────────
  app.post('/api/tiger/buy', auth, async (req, res) => {
    let reserved = 0, userId = req.user._id;
    try {
      const service = String(req.body.service || '').trim();
      const country = Number(req.body.country);
      const clientRef = String(req.body.clientRef || '').trim().slice(0, 80);
      if (!service || !country || !clientRef) return res.status(400).json({ error: 'Pick a country and a service, then try again.' });

      // Same attempt sent twice (double tap, retry after a slow response): return the first result.
      const previous = await TigerOrder.findOne({ userId, clientRef });
      if (previous) return res.json(view(previous));

      const cfg = await getConfig();
      const offer = await tiger.getOffer(service, country);
      if (!offer) return res.status(400).json({ error: 'That number just sold out — pick another service.' });
      const costNgn = Math.round(offer.usd * NGN_PER_USD(cfg));
      const price = applyMarkup(costNgn, cfg);
      if (!(price > 0)) return res.status(400).json({ error: 'This number is not priced yet — try another one.' });

      // Take the money first, atomically, so two buys can never spend the same balance.
      const debited = await User.findOneAndUpdate(
        { _id: userId, balance: { $gte: price } },
        { $inc: { balance: -price } },
        { new: true }
      );
      if (!debited) return res.status(400).json({ error: 'Insufficient balance. Please deposit funds.' });
      reserved = price;

      let bought;
      try {
        bought = await tiger.buyNumber({ service, country, maxPrice: offer.usd });
      } catch (e) {
        await User.updateOne({ _id: userId }, { $inc: { balance: price } });
        reserved = 0;
        return res.status(400).json({ error: e.message });
      }

      const [services, countries] = await Promise.all([tiger.getServiceNames(), tiger.getCountries()]);
      const countryName = (countries.find(c => c.id === country) || {}).name || String(country);
      let order;
      try {
        order = await TigerOrder.create({
          userId, clientRef, activationId: bought.activationId, service,
          serviceName: services.get(service) || service, country, countryName,
          phoneNumber: bought.phoneNumber, sellPrice: price, costNgn, costUsd: bought.activationCost,
          status: 'waiting', expiresAt: bought.activationEndTime || new Date(Date.now() + windowMs)
        });
      } catch (e) {
        // Could not record the order: release the number on the provider and refund the customer.
        await tiger.setStatus(bought.activationId, 8).catch(() => {});
        await User.updateOne({ _id: userId }, { $inc: { balance: price } });
        reserved = 0;
        return res.status(500).json({ error: 'Could not save your order — nothing was charged. Please try again.' });
      }
      reserved = 0;
      await Transaction.create({ userId, type: 'purchase', amount: price, description: `Tiger number: ${order.serviceName} (${countryName})`, status: 'success' });
      await creditReferralCommission(debited, price, `${order.serviceName} number (${countryName})`);
      res.json(view(order));
    } catch (e) {
      if (reserved) await User.updateOne({ _id: userId }, { $inc: { balance: reserved } }).catch(() => {});
      res.status(500).json({ error: 'Failed to buy number: ' + e.message });
    }
  });

  // ── Orders ──────────────────────────────────────────────────────────────────
  app.get('/api/tiger/orders', auth, async (req, res) => {
    const rows = await TigerOrder.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(rows.map(view));
  });

  app.get('/api/tiger/orders/:id', auth, async (req, res) => {
    try {
      let order = await TigerOrder.findOne({ _id: req.params.id, userId: req.user._id });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      order = await syncCode(order);
      res.json(view(order));
    } catch (e) { res.status(500).json({ error: 'Failed to check the order' }); }
  });

  app.post('/api/tiger/orders/:id/cancel', auth, async (req, res) => {
    try {
      const order = await TigerOrder.findOne({ _id: req.params.id, userId: req.user._id });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.status !== 'waiting' || order.code) return res.status(400).json({ error: 'This order can no longer be cancelled.' });
      try {
        await tiger.setStatus(order.activationId, 8);
      } catch (e) {
        if (e.code === 'SMS_RECEIVED') {
          const synced = await syncCode(order);
          return res.status(400).json({ error: e.message, order: view(synced) });
        }
        // Provider did not confirm: do not refund yet, so the number cannot be double-used.
        return res.status(400).json({ error: e.message || 'The provider did not confirm the cancel — please try again.' });
      }
      const refunded = await refundOnce(order, 'cancelled', 'cancelled by customer');
      if (!refunded) {
        const latest = await TigerOrder.findById(order._id);
        return res.status(400).json({ error: 'This order was already handled.', order: view(latest) });
      }
      res.json({ ok: true, refunded: order.sellPrice, order: view(refunded) });
    } catch (e) { res.status(500).json({ error: 'Failed to cancel: ' + e.message }); }
  });

  app.post('/api/tiger/orders/:id/complete', auth, async (req, res) => {
    try {
      const order = await TigerOrder.findOne({ _id: req.params.id, userId: req.user._id });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (!order.code) return res.status(400).json({ error: 'Wait for the code before completing this order.' });
      if (order.status === 'delivered') {
        try { await tiger.setStatus(order.activationId, 6); } catch (e) { /* closing on the provider is best effort */ }
        const done = await TigerOrder.findOneAndUpdate(
          { _id: order._id, status: 'delivered' },
          { $set: { status: 'completed', completedAt: new Date() } },
          { new: true }
        );
        return res.json({ ok: true, order: view(done || await TigerOrder.findById(order._id)) });
      }
      res.json({ ok: true, order: view(order) });
    } catch (e) { res.status(500).json({ error: 'Failed to complete: ' + e.message }); }
  });
}

// Signed webhook for instant SMS delivery. Mounted separately because it needs the raw body.
function mountTigerWebhook(app) {
  app.post('/api/webhooks/tiger-sms', async (req, res) => {
    try {
      const secret = process.env.TIGER_WEBHOOK_SECRET || '';
      if (!secret) return res.status(503).json({ error: 'Webhook not configured' });
      if (!req.rawBody) return res.status(400).json({ error: 'Missing body' });
      const sig = String(req.get('X-Signature') || '').trim();
      const hmac = crypto.createHmac('sha256', secret).update(req.rawBody);
      const hex = hmac.digest('hex');
      const b64 = crypto.createHmac('sha256', secret).update(req.rawBody).digest('base64');
      if (!(safeEqual(sig, hex) || safeEqual(sig, b64))) return res.status(401).json({ error: 'Invalid signature' });

      const { activationId, code, text, receivedAt } = req.body || {};
      if (!activationId || !code) return res.json({ ok: true, ignored: true });
      // Only fills an order still waiting for its first code, so a repeated event is a no-op.
      await TigerOrder.updateOne(
        { activationId: String(activationId), status: 'waiting', code: '' },
        { $set: {
          code: String(code), smsText: String(text || '').slice(0, 500), status: 'delivered',
          codeAt: receivedAt && !isNaN(new Date(receivedAt)) ? new Date(receivedAt) : new Date(), providerError: ''
        } }
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

module.exports = { mountTiger, mountTigerWebhook, TigerOrder };
