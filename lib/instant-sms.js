'use strict';
// Instant SMS provider client (sms-activate style dispatcher).
// Docs: https://tiger-sms.com/api  ·  OpenAPI: https://tiger-sms.com/api/openapi.json
// One endpoint: GET|POST /stubs/handler_api.php?action=<method>&api_key=<key>
// The key is read from the server environment only (TIGER_API_KEY). Never sent to the browser.

const axios = require('axios');

const TIGER_BASE_URL = process.env.TIGER_BASE_URL || 'https://api.tiger-sms.com/stubs/handler_api.php';
const http = axios.create({ timeout: 20000, validateStatus: () => true }); // read error bodies ourselves

const MESSAGES = {
  BAD_KEY: 'Number provider rejected our API key — contact support.',
  BAD_ACTION: 'Number provider rejected the request.',
  NO_BALANCE: 'Number provider wallet is empty — please contact support.',
  NO_NUMBERS: 'No numbers available right now — try another country or service.',
  NO_PROVIDERS: 'Nobody is selling that right now — try another one.',
  WRONG_MAX_PRICE: 'The price just changed — refresh and try again.',
  BAD_SERVICE: 'That service is not available — pick another one.',
  BAD_COUNTRY: 'That country is not available — pick another one.',
  BAD_VALUES: 'Number provider could not process that selection.',
  NOT_FOUND: 'That order no longer exists on the provider side.',
  NO_ACTIVATION: 'That order no longer exists on the provider side.',
  EARLY_CANCEL_DENIED: 'You can only cancel 2 minutes after buying the number.',
  SMS_RECEIVED: 'A code already arrived, so this order cannot be cancelled.',
  BAD_STATUS: 'Invalid status sent to the provider.'
};

class InstantError extends Error {
  constructor(code, message, info) {
    super(MESSAGES[code] || message || 'Number provider error — please try again.');
    this.name = 'InstantError';
    this.code = code || 'ERROR';
    this.info = info || null;
  }
}

// Instant answers with one of: a JSON object, a JSON array, a plain-text token
// (e.g. "STATUS_OK:852508"), or a JSON error envelope {title, details, info}.
async function call(action, params = {}) {
  const key = process.env.TIGER_API_KEY || '';
  if (!key) throw new InstantError('BAD_KEY', 'Instant SMS is not configured yet — contact support.');
  let res;
  try {
    res = await http.get(TIGER_BASE_URL, { params: { api_key: key, action, ...params } });
  } catch (e) {
    throw new InstantError('NETWORK', 'Could not reach the number provider — please try again shortly.');
  }
  if (res.status === 401) throw new InstantError('BAD_KEY');
  let body = res.data;
  if (typeof body === 'string') {
    const t = body.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try { body = JSON.parse(t); } catch (_) { body = t; }
    } else {
      body = t;
    }
  }
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    if (body.title) throw new InstantError(String(body.title), body.details ? String(body.details) : undefined, body.info);
    return body;
  }
  if (typeof body === 'string' && /^[A-Z_]+$/.test(body)) {
    // Bare error tokens. Success tokens always carry a value after a colon or a known prefix.
    if (res.status >= 400 || !/^(ACCESS_|STATUS_)/.test(body)) throw new InstantError(body);
  }
  return body;
}

// Countries: [{ id, eng, ... }]. Cached for an hour; the catalogue barely changes.
let countriesCache = null, countriesAt = 0;
async function getCountries() {
  if (countriesCache && Date.now() - countriesAt < 60 * 60 * 1000) return countriesCache;
  const raw = await call('getCountries');
  const list = (Array.isArray(raw) ? raw : [])
    .filter(c => c && Number(c.visible) !== 0)
    .map(c => ({ id: Number(c.id), name: String(c.eng || c.rus || c.id) }))
    .filter(c => c.id > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  countriesCache = list; countriesAt = Date.now();
  return list;
}

// Service catalogue: [{ code, name }]. Cached for an hour.
let servicesCache = null, servicesAt = 0;
async function getServiceNames() {
  if (servicesCache && Date.now() - servicesAt < 60 * 60 * 1000) return servicesCache;
  const raw = await call('getServicesList', { lang: 'en' });
  const map = new Map();
  for (const s of (raw && raw.services) || []) if (s && s.code) map.set(String(s.code), String(s.name || s.code));
  servicesCache = map; servicesAt = Date.now();
  return map;
}

// Live offers for one country: every service with stock there, with its price bucket.
// getOffers returns { data: { <service>: { <country>: { prices: { default, avg, min, retail }, counts: { total } } } } }
async function getOffersForCountry(countryId) {
  const raw = await call('getOffers', { countries: String(countryId) });
  const data = (raw && raw.data) || {};
  const out = [];
  for (const [service, byCountry] of Object.entries(data)) {
    const row = byCountry && byCountry[String(countryId)];
    if (!row || !row.prices || !(Number(row.counts && row.counts.total) > 0)) continue;
    const usd = Number(row.prices.default ?? row.prices.retail ?? row.prices.min);
    if (!(usd > 0)) continue;
    out.push({ service, usd, min: Number(row.prices.min) || usd, stock: Number(row.counts.total) });
  }
  return out;
}

// Re-check one service/country pair right before buying, so the charge matches live stock.
async function getOffer(service, countryId) {
  const raw = await call('getOffers', { services: service, countries: String(countryId) });
  const row = raw && raw.data && raw.data[service] && raw.data[service][String(countryId)];
  if (!row || !row.prices || !(Number(row.counts && row.counts.total) > 0)) return null;
  const usd = Number(row.prices.default ?? row.prices.retail ?? row.prices.min);
  if (!(usd > 0)) return null;
  return { usd, min: Number(row.prices.min) || usd, stock: Number(row.counts.total) };
}

// Buy a number. maxPrice = the live recommended price (prices.default), per the docs.
async function buyNumber({ service, country, maxPrice }) {
  const raw = await call('getNumberV2', {
    service, country: String(country), maxPrice: Number(maxPrice).toFixed(4)
  });
  if (!raw || !raw.activationId || !raw.phoneNumber) throw new InstantError('NO_NUMBERS');
  return {
    activationId: String(raw.activationId),
    phoneNumber: String(raw.phoneNumber),
    activationCost: Number(raw.activationCost) || Number(maxPrice),
    activationEndTime: raw.activationEndTime ? new Date(raw.activationEndTime) : null
  };
}

// Current code for an activation: { code, text } or null while still waiting.
// Uses getStatusV2 (JSON). If that method is switched off on the account, falls back to getStatus.
async function getCode(activationId) {
  try {
    const raw = await call('getStatusV2', { id: String(activationId) });
    if (raw && raw.sms && raw.sms.code) return { code: String(raw.sms.code), text: String(raw.sms.text || '') };
    return null;
  } catch (e) {
    if (e.code !== 'BAD_ACTION') throw e;
  }
  const t = await call('getStatus', { id: String(activationId) });
  const m = /^STATUS_OK:(.+)$/.exec(String(t));
  return m ? { code: m[1], text: '' } : null;
}

// Change activation status. 8 = cancel, 6 = complete. Tries the JSON method first, then the plain one.
async function setStatus(activationId, status) {
  try {
    await call('setStatusV2', { id: String(activationId), status });
    return true;
  } catch (e) {
    if (e.code !== 'BAD_ACTION') throw e;
  }
  const t = await call('setStatus', { id: String(activationId), status });
  return /^ACCESS_/.test(String(t)) || /^STATUS_OK/.test(String(t));
}

module.exports = {
  InstantError, MESSAGES, getCountries, getServiceNames, getOffersForCountry, getOffer,
  buyNumber, getCode, setStatus
};
