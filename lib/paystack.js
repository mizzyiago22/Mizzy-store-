// Paystack helper (second payment-link gateway). Used by server.js as `klsPaystack`.
// Needs env PAYSTACK_SECRET_KEY. Amounts are sent to Paystack in the smallest unit (kobo / cents).
const axios = require('axios');
const crypto = require('crypto');

const BASE = 'https://api.paystack.co';
const secret = () => String(process.env.PAYSTACK_SECRET_KEY || '').trim();
const isConfigured = () => !!secret();

const toSubunit = (amount) => Math.round(Number(amount) * 100);
const fromSubunit = (amount) => Number(amount) / 100;

const http = () => axios.create({
  baseURL: BASE, timeout: 30000,
  headers: { Authorization: `Bearer ${secret()}`, 'Content-Type': 'application/json' }
});

function fail(err, fallback) {
  const msg = err?.response?.data?.message || err?.message || fallback;
  const e = new Error(msg); e.status = err?.response?.status || 502; return e;
}

async function initializeTransaction({ email, amount, currency = 'NGN', reference, callback_url, metadata, customerName }) {
  if (!isConfigured()) throw new Error('Paystack is not configured');
  try {
    const body = { email, amount: toSubunit(amount), currency, reference, callback_url, metadata: { ...(metadata || {}), customerName } };
    const r = await http().post('/transaction/initialize', body);
    if (!r.data?.status || !r.data?.data?.authorization_url) throw new Error(r.data?.message || 'Paystack did not return a payment link');
    return r.data.data; // { authorization_url, access_code, reference }
  } catch (err) { throw fail(err, 'Paystack initialize failed'); }
}

async function verifyTransaction(reference) {
  if (!isConfigured()) throw new Error('Paystack is not configured');
  try {
    const r = await http().get('/transaction/verify/' + encodeURIComponent(reference));
    if (!r.data?.status) throw new Error(r.data?.message || 'Paystack verify failed');
    return r.data.data; // { id, status, amount (subunit), currency, reference, ... }
  } catch (err) {
    if (err?.response?.status === 404) return null;   // unknown reference
    throw fail(err, 'Paystack verify failed');
  }
}

function verifyWebhookSignature(rawBody, signature) {
  if (!isConfigured() || !rawBody || !signature) return false;
  const expected = crypto.createHmac('sha512', secret()).update(rawBody).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const PAYSTACK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];
const isPaystackIp = (ip) => PAYSTACK_IPS.includes(String(ip || '').replace(/^::ffff:/, ''));

module.exports = { isConfigured, toSubunit, fromSubunit, initializeTransaction, verifyTransaction, verifyWebhookSignature, isPaystackIp };
