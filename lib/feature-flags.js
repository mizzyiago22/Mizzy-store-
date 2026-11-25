// Admin on/off switches for every customer-facing feature, plus per-category
// switches inside the marketplaces and boosting catalogues.
//
//  • A feature that is OFF is blocked on the server (its API returns 503, its page
//    shows "temporarily unavailable") and its links are hidden on the customer site.
//  • A category that is OFF (e.g. "Facebook" in Marketplace 2, "Facebook followers"
//    in Boosting 2) is removed from the customer's list and cannot be bought.
//
// Settings live in one MongoDB document (key 'main') and are cached in memory.
// Every change made in the admin panel takes effect immediately on this instance,
// and other instances pick it up within ~15 seconds.

const mongoose = require('mongoose');

// Every customer feature. `apis` = API path prefixes, `pages` = customer page paths.
// Paths match exactly or as a parent folder (so '/boost' never catches '/boost1').
const FEATURES = [
  { key: 'marketplace-2', label: 'Marketplace 2', group: 'Marketplace', apis: ['/api/market2'], pages: ['/marketplace2'] },
  { key: 'marketplace-3', label: 'Marketplace 3', group: 'Marketplace', apis: ['/api/market3'], pages: ['/marketplace3'] },
  { key: 'marketplace-4', label: 'Marketplace 4', group: 'Marketplace', apis: ['/api/market4'], pages: ['/marketplace4'] },
  { key: 'marketplace-5', label: 'Marketplace 5', group: 'Marketplace', apis: ['/api/market5'], pages: ['/marketplace5'] },
  { key: 'buy-number-1', label: 'Buy Number 1', group: 'Numbers', pages: ['/buy-number-1'],
    apis: ['/api/numbers/buy', '/api/numbers/live-countries', '/api/numbers/live-services', '/api/numbers/status', '/api/numbers/cancel', '/api/numbers/my-orders', '/api/numbers/servers', '/api/numbers/n3-servers', '/api/numbers/options', '/api/numbers/health'] },
  { key: 'buy-number-server2', label: 'Buy Number – Server 2 (all services)', group: 'Numbers', apis: ['/api/numbers/server2'] },
  { key: 'buy-number-2', label: 'Buy Number 2 (SMS-COOL)', group: 'Numbers', apis: ['/api/numbers/otp-suite'], pages: ['/buy-number-2'] },
  { key: 'temp-email', label: 'Temp Email', group: 'Numbers', apis: ['/api/temp-email'], pages: ['/temp-email'] },
  { key: 'rentals', label: 'Rentals', group: 'Numbers', apis: ['/api/rentals'], pages: ['/rental'] },
  { key: 'boost-1', label: 'Boosting 1', group: 'Boosting', apis: ['/api/boost1'], pages: ['/boost1', '/boost1/order'] },
  { key: 'boost-2', label: 'Boosting 2 (Really Simple Social)', group: 'Boosting', apis: ['/api/boost'], pages: ['/boost', '/boost2'] },
  { key: 'vtu', label: 'Airtime, Data & Cable (VTU)', group: 'Services', apis: ['/api/vtu'], pages: ['/vtu', '/airtime', '/data', '/cable'] },
  { key: 'tools', label: 'Tools', group: 'Services', pages: ['/tools'] },
  { key: 'deposit', label: 'Deposit (fund wallet)', group: 'Wallet', apis: ['/api/deposit'], pages: ['/deposit'] },
  { key: 'giveaways', label: 'Giveaways', group: 'Rewards', apis: ['/api/giveaways'], pages: ['/giveaways'] },
  { key: 'games', label: 'Games', group: 'Rewards', apis: ['/api/games'], pages: ['/games'] },
  { key: 'referrals', label: 'Referrals', group: 'Rewards', apis: ['/api/referrals'], pages: ['/referrals'] },
  { key: 'tutorials', label: 'Tutorials', group: 'Help', apis: ['/api/tutorials', '/api/deposit-tutorials'], pages: ['/tutorials'] },
  { key: 'support', label: 'Support / live chat', group: 'Help', pages: ['/support'] },
  { key: 'groups', label: 'Groups', group: 'Community', pages: ['/groups'] },
];

// Category scopes. Each module registers a function that lists its current category names.
const CATEGORY_SCOPES = {
  market2: 'Marketplace 2 categories',
  market3: 'Marketplace 3 categories',
  market4: 'Marketplace 4 groups',
  market5: 'Marketplace 5 categories',
  'boost-1': 'Boosting 1 categories',
  'boost-2': 'Boosting 2 categories',
};
const sources = new Map();

// Callbacks from payment providers and suppliers must never be blocked by a switch.
const EXEMPT_RE = /\/(callback|webhook|hook)(\/|$)/i;

let Model = null;
let off = new Set();            // feature keys that are switched off
let hiddenSet = new Set();      // "scope\u0001name" (lower-cased) for hidden categories
let loaded = false;

const under = (p, base) => p === base || p.startsWith(base + '/');
const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();
const hKey = (scope, name) => scope + '\u0001' + norm(name);

function featureFor(p) {
  if (!p || EXEMPT_RE.test(p)) return null;
  for (const f of FEATURES) {
    if ((f.apis || []).some(a => under(p, a)) || (f.pages || []).some(pg => under(p, pg))) return f;
  }
  return null;
}

function applyDoc(d) {
  off = new Set((d && d.disabled) || []);
  hiddenSet = new Set((d && d.hidden) || []);
  loaded = true;
}

async function load() {
  if (!Model) return;
  try { applyDoc(await Model.findOne({ key: 'main' }).lean()); } catch (e) { console.error('[features] load failed:', e.message); }
}

function model() {
  return mongoose.models.FeatureSetting || mongoose.model('FeatureSetting', new mongoose.Schema({
    key: { type: String, unique: true, default: 'main' },
    disabled: { type: [String], default: [] },
    hidden: { type: [String], default: [] }
  }));
}

async function save(update) {
  await Model.updateOne({ key: 'main' }, { $set: update }, { upsert: true });
}

function gate(app) {
  Model = model();
  load();
  const t = setInterval(load, 15000); if (t.unref) t.unref();
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    const f = featureFor(req.path || '');
    if (!f || !off.has(f.key)) return next();
    const msg = f.label + ' is temporarily unavailable right now.';
    if (req.path.startsWith('/api/')) return res.status(503).json({ error: msg, feature: f.key, maintenance: true });
    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.status(503).type('html').send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unavailable</title><body style="font-family:system-ui;padding:40px;text-align:center"><h2>' + f.label + '</h2><p>' + msg + '</p><p><a href="/">Back to home</a></p></body>');
    }
    return res.status(503).json({ error: msg, feature: f.key, maintenance: true });
  });
}

function routes(app, { anyAdminAuth }) {
  if (!Model) Model = model();
  const superOnly = (req, res, next) => (req.adminRole === 'super' ? next() : res.status(403).json({ error: 'Only the owner can change these switches.' }));

  // Public: which features are off (the customer site hides their links).
  app.get('/api/features', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const pages = {};
    FEATURES.forEach(f => { if (f.pages) pages[f.key] = f.pages; });
    res.json({ disabled: [...off], pages });
  });

  // Admin: every feature and every category with its current state.
  app.get('/api/admin/features', anyAdminAuth, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const categories = [];
    for (const [scope, label] of Object.entries(CATEGORY_SCOPES)) {
      const src = sources.get(scope);
      let names = [];
      if (src) { try { names = await src(); } catch (e) { names = []; } }
      const counts = new Map();
      names.forEach(n => { const k = String(n || '').trim(); if (k) counts.set(k, (counts.get(k) || 0) + 1); });
      const items = [...counts.keys()].sort((a, b) => a.localeCompare(b))
        .map(name => ({ name, hidden: hiddenSet.has(hKey(scope, name)) }));
      categories.push({ scope, label, items });
    }
    res.json({
      features: FEATURES.map(f => ({ key: f.key, label: f.label, group: f.group, enabled: !off.has(f.key) })),
      categories,
      loaded
    });
  });

  app.put('/api/admin/features/:key', anyAdminAuth, superOnly, async (req, res) => {
    const f = FEATURES.find(x => x.key === req.params.key);
    if (!f) return res.status(404).json({ error: 'Unknown feature.' });
    if (typeof (req.body || {}).enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be true or false.' });
    const on = req.body.enabled;
    off[on ? 'delete' : 'add'](f.key);
    try { await save({ disabled: [...off] }); } catch (e) { return res.status(500).json({ error: 'Could not save: ' + e.message }); }
    res.json({ ok: true, key: f.key, enabled: on });
  });

  app.put('/api/admin/feature-categories', anyAdminAuth, superOnly, async (req, res) => {
    const { scope, name, hidden } = req.body || {};
    if (!CATEGORY_SCOPES[scope] || !norm(name) || typeof hidden !== 'boolean') return res.status(400).json({ error: 'Scope, category name and hidden (true/false) are required.' });
    try { await module.exports.setCategoryHidden(scope, name, hidden); } catch (e) { return res.status(500).json({ error: 'Could not save: ' + e.message }); }
    res.json({ ok: true, scope, name, hidden });
  });
}

module.exports = {
  FEATURES,
  gate,
  routes,
  // Modules call these to filter their own catalogues.
  isFeatureOff: (key) => off.has(key),
  isHidden: (scope, name) => hiddenSet.has(hKey(scope, name)),
  setCategoryHidden: async (scope, name, hidden) => {
    if (!Model) Model = model();
    const k = hKey(scope, name);
    hidden ? hiddenSet.add(k) : hiddenSet.delete(k);
    await save({ hidden: [...hiddenSet] });
  },
  registerCategorySource: (scope, fn) => { sources.set(scope, fn); },
  // Test hooks (no database needed).
  _featureFor: featureFor,
  _setState: (disabled, hidden) => applyDoc({ disabled, hidden }),
};
