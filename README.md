# Mizzy Sales

Mizzy Sales is a Node.js, Express, and MongoDB application. This guide describes the providers actually mounted by `server.js` and the provider modules it loads. It does not change the existing site design or purchase/payment business logic.

## Repository layout

- `server.js` and `site.config.js` — application server and branding/SEO configuration.
- `lib/` — server-side integrations and reusable application modules.
- `public/` — browser pages, scripts, stylesheets, icons, and static assets.
- `package.json` and `package-lock.json` — Node.js scripts and locked dependencies.

## Runtime and deployment

- **Runtime:** Node.js 18 or newer
- **Server:** Express (`server.js`), started by `npm start`
- **Database:** MongoDB / MongoDB Atlas via `MONGODB_URI`
- **Deployment:** No host-specific deployment manifest is included. Configure your host to install dependencies with `npm install`, start with `npm start`, and use `/healthz` as the health check.
- **Health endpoint:** `GET /healthz` returns `{"ok":true}` without authentication.
- **Uploads:** Cloudinary is used when `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are all configured. On hosts with ephemeral local storage, fallback uploads may be lost on restart or redeploy.

## Provider map verified against `server.js`

| Area | Provider | Implementation / status |
|---|---|---|
| Buy Number 1 | Grizzly SMS | Active integration in `server.js`; configured with `GRIZZLY_API_KEY` and optional `GRIZZLY_BASE_URL`. |
| Buy Number 2 | OTP Suite | Active integration mounted from `lib/otp-suite.js`; uses `OTP_SUITE_API_KEY` and `OTP_SUITE_BASE_URL`, or credentials configured in the admin settings. |
| Buy Number 3 | NovaSolution | Active number-provider integration in `server.js`; uses `NOVA_API_KEY` and `NOVA_BASE_URL`. |
| Marketplace 1 | Admin-managed inventory | The core application manages the manual marketplace inventory. |
| Marketplace 2 | Sameeha Social Hub | Active integration mounted from `lib/market2.js`; uses `SAMEEHA_API_KEY` and `SAMEEHA_BASE_URL`, with admin configuration support. |
| Marketplace 5 | ExpressLogs | `lib/market5.js`; uses `EXPRESSLOGS_API_KEY` / `EXPRESSLOGS_BASE_URL` or the key saved in Admin → Marketplace 5. |
| Marketplace 3 | Sujan Department | Active integration mounted from `lib/market3.js`; uses `SUJAN_API_KEY` and `SUJAN_BASE_URL`, with admin configuration support. |
| Marketplace 4 | No provider integration mounted | The `marketplace4` page route exists, but the reviewed `server.js` does not mount a Marketplace 4 provider API. Do not treat it as a working provider integration until one is added. |
| Boosting 1 | Really Simple Social | Active integration mounted from `lib/boost.js`; uses `BOOST_API_KEY` and `BOOST_API_URL`, with admin-managed settings. |
| Boosting 2 | NovaSolution | Active integration mounted from `lib/boost2.js`; uses the same `NOVA_API_KEY` and `NOVA_BASE_URL` as Buy Number 3. |

**OTP Suite and NovaSolution are different active providers.** OTP Suite is Buy Number 2. NovaSolution is used for Buy Number 3 and Boosting 2. A stale source comment claiming Boosting 2 was removed has been corrected; `lib/boost2.js` is mounted by `server.js`.

Provider readiness depends on valid credentials, admin enablement/settings, supplier access, and supplier account balance. The provider status diagnostic is `GET /api/admin/providers/status` and requires admin authentication; it reports readiness without returning API keys. A configured key alone does not prove that live supplier requests or purchases succeed.

## Production environment variables

Provide the required values through your hosting environment or a private local `.env` file. This repository does not include an `.env.example` or a host-specific deployment manifest. Never commit a real `.env` file or expose provider keys in browser JavaScript.

These four values are **required for production startup**:

- `MONGODB_URI` — reachable MongoDB Atlas connection string.
- `JWT_SECRET` — at least 32 characters; use a randomly generated secret.
- `ADMIN_PASSCODE` — at least 12 characters; use a strong, private passcode.
- `ADMIN_SECRET_PATH` — a long random private path; the insecure value `ksl-admin-secret` is rejected in production.

Set `NODE_ENV=production` in the hosting environment. Most platforms supply `PORT` at runtime. Other variables are needed to enable their associated payment, provider, email, branding, webhook, or Cloudinary features.

### Cloudinary

For persistent production uploads, set all three values: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. The app logs a clear startup warning when they are missing. Do not rely on files written to an ephemeral host filesystem to survive restarts or redeploys.

### Payments

Flutterwave and Paystack are optional integrations and must be configured with the real credentials and webhook settings from their respective dashboards before accepting real deposits. Keep the Flutterwave webhook hash synchronized with the dashboard. Test the complete deposit approval/crediting flow before production use.

## Local setup

1. Install Node.js 18 or newer.
2. Provide at least the four production-critical values above through your environment or a private local `.env` file (`JWT_SECRET` is required by the current server startup check).
3. Install dependencies with `npm install`.
4. Start with `npm start`.
5. Check `GET /healthz` and open the site root.

## Deployment checklist

1. Create a MongoDB Atlas database user and allow your hosting service to reach the cluster using Atlas Network Access.
2. Configure your hosting provider to run `npm install` and `npm start`, and set `/healthz` as the health check.
3. Set the required environment variables in your hosting provider; do not put credentials in the repository.
4. Set all three Cloudinary credentials before accepting uploads in production.
5. Configure only the providers and payment gateways you intend to enable.
6. Verify the health endpoint, sign-up/sign-in, provider catalogue loads, order delivery/status, cancellation/refund behavior, deposit webhooks and admin approval flow using test accounts before accepting real money.

## Security and testing notes

- Passwords and tokens must remain server-side; provider secrets must never be embedded in public assets.
- This package has not been live-tested against supplier or payment accounts as part of this deployment configuration update. Use test/sandbox credentials where available and confirm each live provider's API behavior before launch.
- Only distribute products and credentials you are authorized to sell.
