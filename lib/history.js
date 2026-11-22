'use strict';
// Per-product history: one list per marketplace (1-4) and per number server (1-2).
// Read-only, and every query is limited to the signed-in customer's own records.

const MARKET_SOURCES = { 'market-1': 'market1', 'market-2': 'market2', 'market-3': 'market3', 'market-4': 'market4' };
const NUMBER_SERVERS = { 'number-1': 'server1', 'number-2': 'server2' };

function mountHistory(app, { auth, User, NumberListing }) {
  app.get('/api/history/market/:kind', auth, async (req, res) => {
    try {
      const source = MARKET_SOURCES[req.params.kind];
      if (!source) return res.status(404).json({ error: 'Unknown history' });
      const u = await User.findById(req.user._id).select('purchaseDetails').lean();
      const rows = ((u && u.purchaseDetails) || [])
        // Marketplace 1 records have no source tag on older rows, so a missing tag counts as market1.
        .filter(p => (p.source || 'market1') === source)
        .sort((a, b) => new Date(b.purchasedAt || 0) - new Date(a.purchasedAt || 0))
        .map(p => ({
          id: String(p._id),
          orderId: p.orderId || '',
          providerOrderId: p.providerOrderId || '',
          title: p.logTitle || '',
          price: Number(p.pricePaid) || 0,
          date: p.purchasedAt || null,
          details: p.logDetails || '',
          link: p.toolLink || ''
        }));
      res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Could not load history' }); }
  });

  app.get('/api/history/number/:kind', auth, async (req, res) => {
    try {
      const server = NUMBER_SERVERS[req.params.kind];
      if (!server) return res.status(404).json({ error: 'Unknown history' });
      // Same server split as /api/numbers/my-orders: rows with no server field are server 1.
      const serverClause = server === 'server1'
        ? { $or: [{ server: 'server1' }, { server: { $exists: false } }, { server: null }, { server: '' }] }
        : { server: 'server2' };
      const list = await NumberListing.find({ soldTo: req.user._id, ...serverClause })
        .sort({ soldAt: -1, createdAt: -1 }).limit(300).lean();
      const now = Date.now();
      const rows = list.map(r => {
        let status = 'waiting';
        if (r.code) status = 'code';
        else if (r.status === 'cancelled' || r.cancelledAt) status = 'cancelled';
        else if (r.status === 'expired' || r.expiredAt || (r.expiresAt && new Date(r.expiresAt).getTime() < now)) status = 'expired';
        return {
          id: String(r._id),
          service: r.provider || '',
          country: r.country || '',
          phoneNumber: r.phoneNumber || '',
          price: Number(r.sellPrice) || 0,
          date: r.soldAt || r.createdAt || null,
          status,
          code: r.code || '',
          codeAt: r.codeAddedAt || null,
          cancelledAt: r.cancelledAt || null,
          expiredAt: r.expiredAt || null
        };
      });
      res.json(rows);
    } catch (e) { res.status(500).json({ error: 'Could not load history' }); }
  });
}

module.exports = { mountHistory, MARKET_SOURCES, NUMBER_SERVERS };
