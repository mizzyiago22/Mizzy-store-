'use strict';
// Admin control for Fast SMS: on/off, its own profit ladder, hidden countries and
// services, and exact price overrides. Read by lib/instant-routes.js on every request.
const instant = require('./instant-sms');

const DEFAULT_TIERS = [
  { upTo: 500, profit: 300 },
  { upTo: 999, profit: 450 },
  { upTo: 5000, profit: 700 },
  { upTo: 10000, profit: 1000 }
];

module.exports.register = function register(app, deps) {
  const { mongoose, anyAdminAuth, applyMarkup } = deps;

  const schema = new mongoose.Schema({
    key: { type: String, default: 'main', unique: true },
    enabled: { type: Boolean, default: true },
    markupTiers: { type: [{ upTo: Number, profit: Number }], default: DEFAULT_TIERS },
    highCostMarkupPercent: { type: Number, default: 20 },
    roundTo: { type: Number, default: 50 },
    // Simple markup the admin can switch to: 'tiers' = the profit ladder above, 'fixed' = cost + ₦X, 'percent' = cost + X%.
    markupMode: { type: String, enum: ['tiers', 'fixed', 'percent'], default: 'tiers' },
    markupFixed: { type: Number, default: 500 },
    markupPercent: { type: Number, default: 25 },
    // Markup for one service only (e.g. WhatsApp +₦700, or Telegram +30%). Beats the general markup.
    serviceMarkups: { type: [{ service: String, type: { type: String, enum: ['fixed', 'percent'] }, value: Number }], default: [] },
    hiddenCountries: { type: [Number], default: [] },
    hiddenServices: { type: [String], default: [] },
    priceOverrides: { type: [{ country: Number, service: String, priceNgn: Number }], default: [] }
  });
  const Settings = mongoose.models.InstantSettings || mongoose.model('InstantSettings', schema);

  async function getSettings() {
    let s = await Settings.findOne({ key: 'main' });
    if (!s) s = await Settings.create({ key: 'main' });
    return s;
  }

  const roundUp = (v, settings) => { const step = Number(settings.roundTo) || 1; return Math.ceil(v / step) * step; };

  // Order of priority: 1) exact price for that country+service, 2) markup set for that service,
  // 3) the general markup (ladder, or + fixed ₦, or + percent). Never below cost.
  function priceFor(settings, costNgn, country, service) {
    const hit = (settings.priceOverrides || []).find(o => Number(o.country) === Number(country) && o.service === service);
    if (hit && Number(hit.priceNgn) > 0) return Math.round(Number(hit.priceNgn));
    const sm = (settings.serviceMarkups || []).find(m => m.service === service && Number(m.value) >= 0);
    if (sm) {
      const add = sm.type === 'percent' ? costNgn * Number(sm.value) / 100 : Number(sm.value);
      return roundUp(costNgn + add, settings);
    }
    if (settings.markupMode === 'fixed') return roundUp(costNgn + Math.max(0, Number(settings.markupFixed) || 0), settings);
    if (settings.markupMode === 'percent') return roundUp(costNgn + costNgn * Math.max(0, Number(settings.markupPercent) || 0) / 100, settings);
    return applyMarkup(costNgn, settings);
  }

  app.get('/api/admin/instant-settings', anyAdminAuth, async (req, res) => {
    try {
      const s = await getSettings();
      res.json({
        enabled: s.enabled, markupTiers: s.markupTiers, highCostMarkupPercent: s.highCostMarkupPercent, roundTo: s.roundTo,
        markupMode: s.markupMode || 'tiers', markupFixed: s.markupFixed, markupPercent: s.markupPercent, serviceMarkups: s.serviceMarkups || [],
        hiddenCountries: s.hiddenCountries, hiddenServices: s.hiddenServices, priceOverrides: s.priceOverrides
      });
    } catch (e) { res.status(500).json({ error: 'Failed to load Fast SMS settings' }); }
  });

  // Countries and services for the admin pickers (names from Tiger's catalogue).
  app.get('/api/admin/instant-catalog', anyAdminAuth, async (req, res) => {
    try {
      const [countries, names] = await Promise.all([instant.getCountries(), instant.getServiceNames()]);
      res.json({
        countries,
        services: [...names.entries()].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name))
      });
    } catch (e) { res.status(502).json({ error: 'Could not load the Tiger catalogue: ' + e.message }); }
  });

  app.put('/api/admin/instant-settings', anyAdminAuth, async (req, res) => {
    try {
      const s = await getSettings();
      const b = req.body || {};
      if (typeof b.enabled === 'boolean') s.enabled = b.enabled;

      if (Array.isArray(b.markupTiers)) {
        const rows = b.markupTiers.map((t, i) => ({ i: i + 1, upTo: Number(t.upTo), profit: Number(t.profit) }));
        if (!rows.length) return res.status(400).json({ error: 'Profit ladder needs at least one tier.' });
        for (const t of rows) {
          if (!Number.isFinite(t.upTo) || t.upTo <= 0) return res.status(400).json({ error: `Tier ${t.i}: "cost up to" must be greater than 0.` });
          if (!Number.isFinite(t.profit) || t.profit < 0) return res.status(400).json({ error: `Tier ${t.i}: profit must be 0 or more.` });
        }
        const sorted = rows.slice().sort((a, b) => a.upTo - b.upTo);
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].upTo === sorted[i - 1].upTo) return res.status(400).json({ error: `Two tiers both end at ₦${sorted[i].upTo}. Each tier needs its own ceiling.` });
        }
        s.markupTiers = sorted.map(({ upTo, profit }) => ({ upTo, profit }));
      }
      if (Number.isFinite(Number(b.highCostMarkupPercent)) && Number(b.highCostMarkupPercent) >= 0) s.highCostMarkupPercent = Number(b.highCostMarkupPercent);
      if (Number(b.roundTo) > 0) s.roundTo = Number(b.roundTo);
      if (['tiers', 'fixed', 'percent'].includes(b.markupMode)) s.markupMode = b.markupMode;
      if (b.markupFixed !== undefined) {
        const v = Number(b.markupFixed);
        if (!Number.isFinite(v) || v < 0) return res.status(400).json({ error: 'Fixed markup must be 0 or more.' });
        s.markupFixed = Math.round(v);
      }
      if (b.markupPercent !== undefined) {
        const v = Number(b.markupPercent);
        if (!Number.isFinite(v) || v < 0 || v > 1000) return res.status(400).json({ error: 'Percent markup must be between 0 and 1000.' });
        s.markupPercent = v;
      }
      if (Array.isArray(b.serviceMarkups)) {
        const rows = [], seen = new Set();
        for (const m of b.serviceMarkups) {
          const service = String(m.service || '').trim(), type = m.type === 'percent' ? 'percent' : 'fixed', value = Number(m.value);
          if (!service) return res.status(400).json({ error: 'Each service markup needs a service.' });
          if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: `Markup for ${service} must be 0 or more.` });
          if (seen.has(service)) return res.status(400).json({ error: `${service} is listed twice in service markups.` });
          seen.add(service); rows.push({ service, type, value });
        }
        s.serviceMarkups = rows;
      }

      if (Array.isArray(b.hiddenCountries)) {
        s.hiddenCountries = [...new Set(b.hiddenCountries.map(Number).filter(n => Number.isInteger(n) && n > 0))];
      }
      if (Array.isArray(b.hiddenServices)) {
        s.hiddenServices = [...new Set(b.hiddenServices.map(x => String(x).trim()).filter(Boolean))];
      }
      if (Array.isArray(b.priceOverrides)) {
        const rows = [];
        for (const o of b.priceOverrides) {
          const country = Number(o.country), priceNgn = Number(o.priceNgn), service = String(o.service || '').trim();
          if (!Number.isInteger(country) || country <= 0 || !service) return res.status(400).json({ error: 'Each price needs a country and a service.' });
          if (!Number.isFinite(priceNgn) || priceNgn <= 0) return res.status(400).json({ error: `Price for ${service} must be greater than 0.` });
          rows.push({ country, service, priceNgn: Math.round(priceNgn) });
        }
        s.priceOverrides = rows;
      }
      await s.save();
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'Failed to save Fast SMS settings' }); }
  });

  return { getSettings, priceFor };
};

module.exports.DEFAULT_TIERS = DEFAULT_TIERS;
