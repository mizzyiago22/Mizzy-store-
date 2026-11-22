// Tutorials + Working Pics (admin-managed content, customer purchase flow).
// Mounted from server.js with: require('./lib/extras')({ app, mongoose, auth, adminAuth, upload, fileUrl, User, Transaction });
module.exports = function mountExtras({ app, mongoose, auth, adminAuth, upload, fileUrl, makeStorage, multer, User, Transaction }) {
  const { Schema } = mongoose;
  const { makeNewOrderId } = require('./orderid');
  const newOrderId = makeNewOrderId([Transaction]);

  const WorkingPic = mongoose.model('WorkingPic', new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    kind: { type: String, enum: ['link', 'image', 'text'], default: 'link' },
    content: { type: String, default: '' },          // link/mega URL or text (only sent after purchase)
    imageUrl: { type: String, default: '' },          // delivered image (only sent after purchase)
    price: { type: Number, required: true, min: 0 },
    unlimited: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }));

  const WorkingPicOrder = mongoose.model('WorkingPicOrder', new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    picId: { type: Schema.Types.ObjectId, ref: 'WorkingPic' },
    title: String, logo: String, kind: String, content: String, imageUrl: String,
    pricePaid: Number,
    orderId: { type: String, index: true },
    createdAt: { type: Date, default: Date.now }
  }));

  const str = (v, n) => String(v || '').trim().slice(0, n);
  const bool = v => v === true || v === 'true' || v === 'on' || v === '1';
  const pubPic = p => ({
    _id: p._id, title: p.title, description: p.description, logo: p.logo, kind: p.kind, price: p.price,
    unlimited: p.unlimited, sold: p.sold || 0, remaining: p.unlimited ? null : Math.max(0, p.stock - p.sold),
    soldOut: !p.unlimited && p.sold >= p.stock
  });

  // ── Working Pics: admin ─────────────────────────────────────
  const picUpload = upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'image', maxCount: 1 }]);
  function picFields(b, files) {
    const u = {};
    if (b.title !== undefined) u.title = str(b.title, 140);
    if (b.description !== undefined) u.description = str(b.description, 1000);
    if (b.kind !== undefined && ['link', 'image', 'text'].includes(b.kind)) u.kind = b.kind;
    if (b.content !== undefined) u.content = str(b.content, 5000);
    if (b.price !== undefined) u.price = Math.max(0, Number(b.price) || 0);
    if (b.unlimited !== undefined) u.unlimited = bool(b.unlimited);
    if (b.stock !== undefined) u.stock = Math.max(0, parseInt(b.stock, 10) || 0);
    if (b.active !== undefined) u.active = bool(b.active);
    if (files && files.logo && files.logo[0]) u.logo = fileUrl(files.logo[0]);
    if (files && files.image && files.image[0]) u.imageUrl = fileUrl(files.image[0]);
    return u;
  }
  app.get('/api/admin/working-pics', adminAuth, async (req, res) => {
    try { res.json(await WorkingPic.find().sort({ createdAt: -1 }).lean()); }
    catch (e) { res.status(500).json({ error: 'Failed to load' }); }
  });
  app.post('/api/admin/working-pics', adminAuth, picUpload, async (req, res) => {
    try {
      const u = picFields(req.body || {}, req.files);
      if (!u.title) return res.status(400).json({ error: 'Title is required' });
      if (u.price === undefined) return res.status(400).json({ error: 'Amount is required' });
      if (u.kind === 'image' ? !u.imageUrl : !u.content) return res.status(400).json({ error: u.kind === 'image' ? 'Upload the image customers will receive' : 'Add the link or text customers will receive' });
      if (u.unlimited === false && !u.stock) return res.status(400).json({ error: 'Enter a stock quantity or choose Unlimited' });
      res.json({ ok: true, pic: await WorkingPic.create(u) });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.put('/api/admin/working-pics/:id', adminAuth, picUpload, async (req, res) => {
    try {
      const u = picFields(req.body || {}, req.files);
      if (u.title === '') return res.status(400).json({ error: 'Title is required' });
      if (u.unlimited === false && u.stock !== undefined && !u.stock) return res.status(400).json({ error: 'Enter a stock quantity or choose Unlimited' });
      const pic = await WorkingPic.findByIdAndUpdate(req.params.id, { $set: u }, { new: true });
      res.json({ ok: !!pic, pic });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/admin/working-pics/:id', adminAuth, async (req, res) => {
    try { await WorkingPic.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── Working Pics: customer ──────────────────────────────────
  app.get('/api/working-pics', auth, async (req, res) => {
    try { res.json((await WorkingPic.find({ active: true }).sort({ createdAt: -1 })).map(pubPic)); }
    catch (e) { res.status(500).json({ error: 'Failed to load' }); }
  });
  app.get('/api/working-pics/mine', auth, async (req, res) => {
    try { res.json(await WorkingPicOrder.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean()); }
    catch (e) { res.status(500).json({ error: 'Failed to load' }); }
  });
  app.post('/api/working-pics/:id/buy', auth, async (req, res) => {
    let reserved = null;
    try {
      // 1) reserve one unit of stock atomically
      reserved = await WorkingPic.findOneAndUpdate(
        { _id: req.params.id, active: true, $or: [{ unlimited: true }, { $expr: { $lt: ['$sold', '$stock'] } }] },
        { $inc: { sold: 1 } }, { new: true });
      if (!reserved) return res.status(400).json({ error: 'This item is unavailable or sold out.' });
      // 2) deduct wallet atomically (only if balance covers it)
      const user = await User.findOneAndUpdate(
        { _id: req.user._id, balance: { $gte: reserved.price } }, { $inc: { balance: -reserved.price } }, { new: true });
      if (!user) {
        await WorkingPic.updateOne({ _id: reserved._id }, { $inc: { sold: -1 } });
        return res.status(400).json({ error: 'Insufficient balance. Please deposit funds.' });
      }
      const orderId = await newOrderId();
      const order = await WorkingPicOrder.create({
        userId: user._id, picId: reserved._id, title: reserved.title, logo: reserved.logo, kind: reserved.kind,
        content: reserved.content, imageUrl: reserved.imageUrl, pricePaid: reserved.price, orderId
      });
      await Transaction.create({ userId: user._id, type: 'purchase', amount: reserved.price, description: `Purchased: ${reserved.title}`, status: 'success', orderId });
      res.json({ ok: true, newBalance: user.balance, order });
    } catch (e) {
      if (reserved) await WorkingPic.updateOne({ _id: reserved._id }, { $inc: { sold: -1 } }).catch(() => {});
      res.status(500).json({ error: 'Purchase failed. You were not charged.' });
    }
  });

  // ── Admin: look up any order by our order ID, the supplier's order ID, or the buyer's email ──
  app.get('/api/admin/order-search', adminAuth, async (req, res) => {
    try {
      const q = String(req.query.q || '').trim().slice(0, 80);
      if (q.length < 4) return res.status(400).json({ error: 'Type at least 4 characters (order ID, supplier order ID or customer email).' });
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exact = new RegExp('^' + safe + '$', 'i');
      const part = new RegExp(safe, 'i');
      const emailHit = q.includes('@');
      const out = [];
      const seen = new Set();
      const add = r => { const k = r.orderId || ('x' + out.length + (r.date || '')); if (!seen.has(k)) { seen.add(k); out.push(r); } };
      const userInfo = u => u ? { id: String(u._id), name: u.name, email: u.email } : null;

      // 1) purchase records (logs / tools / accounts) kept on the buyer
      const buyers = await User.find({ $or: [
        { 'purchaseDetails.orderId': part }, { 'purchaseDetails.providerOrderId': part },
        { 'purchaseDetails.orderRef': part }, ...(emailHit ? [{ email: part }] : [])
      ] }).select('name email purchaseDetails').limit(20);
      for (const u of buyers) for (const p of u.purchaseDetails) {
        const hit = (p.orderId && part.test(p.orderId)) || (p.providerOrderId && part.test(p.providerOrderId)) ||
                    (p.orderRef && part.test(p.orderRef)) || (emailHit && part.test(u.email || ''));
        if (!hit) continue;
        const content = p.toolLink || p.logDetails || (p.deliverableFileName ? 'File: ' + p.deliverableFileName : '');
        add({
          orderId: p.orderId || '', kind: p.logType === 'tool' ? 'Tool' : 'Account / log', title: p.logTitle, amount: p.pricePaid,
          date: p.purchasedAt, user: userInfo(u), delivered: content, status: content ? 'delivered' : 'no credentials stored',
          source: p.source || 'market1', supplierOrderId: p.providerOrderId || ''
        });
      }
      // 2) working pics
      const wps = await WorkingPicOrder.find({ orderId: part }).populate('userId', 'name email').limit(20);
      for (const o of wps) add({
        orderId: o.orderId, kind: 'Working pic', title: o.title, amount: o.pricePaid, date: o.createdAt, user: userInfo(o.userId),
        status: 'delivered', delivered: o.kind === 'image' ? (o.imageUrl || '') : (o.content || '')
      });
      // 3) wallet transactions (covers every other purchase type too)
      const txns = await Transaction.find({ orderId: part }).populate('userId', 'name email').limit(20);
      for (const t of txns) {
        const r = out.find(x => x.orderId === t.orderId);
        if (r) { r.walletStatus = t.status; r.description = t.description; continue; }
        add({ orderId: t.orderId, kind: 'Wallet purchase', title: t.description, amount: t.amount, date: t.createdAt, user: userInfo(t.userId), status: t.status, description: t.description });
      }
      out.sort((x, y) => new Date(y.date || 0) - new Date(x.date || 0));
      res.json({ query: q, exact: out.some(r => r.orderId && exact.test(r.orderId)), results: out });
    } catch (e) { res.status(500).json({ error: 'Order search failed' }); }
  });

  // ── Pages ───────────────────────────────────────────────────
  const path = require('path');
  const page = f => (req, res) => { res.set('Cache-Control', 'no-store, must-revalidate'); res.sendFile(path.join(__dirname, '..', 'public', f)); };
  app.get('/working-pics', page('working-pics.html'));
};
