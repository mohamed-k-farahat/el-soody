# Taking the El Soody store live

The store runs on Cloudflare (site + database + photos) with Paymob for card and wallet payments.
**Live now (cash on delivery):** https://el-soody.el-soody.workers.dev
Cloudflare account: elsoodycoffee@gmail.com. Database, photo storage (KV) and the site are deployed.

## Do now (takes days to approve)

**Paymob merchant account**: apply at paymob.com with the shop's commercial register, tax card, the
owner's national ID and the bank account for payouts. Paymob reviews the live website, so it must
be online with the policies page (step 4 below gets it online with cash on delivery first).

## Steps

| # | Who | What |
|---|---|---|
| 1 | You | ✅ Create a free Cloudflare account at dash.cloudflare.com |
| 2 | You | ✅ Approve the Cloudflare sign in when I run `npx wrangler login` (opens your browser, like the GitHub sign in) |
| 3 | Me | ✅ Create the production database and photo storage, apply the schema and load the seed data (all products, stories, prices) |
| 4 | Me | ✅ Deploy the site. It gets an address like `el-soody.<your-name>.workers.dev`. Cash on delivery works from here |
| 5 | You | ✅ Admin password set (`node scripts/set-admin-password.mjs`, then apply the hash file with wrangler). The owner can change it in admin Settings |
| 6 | Owner | Open `/admin`, fill in Settings: delivery fee, areas, shop phone, WhatsApp, address, hours. Check every price |
| 7 | Owner | Read and adjust the Policies page wording (it is a starting draft, not legal advice) |
| 8 | You | Optional but recommended: buy a domain (about $10 a year, e.g. elsoody.com) in Cloudflare, then I connect it |
| 9 | Me | When Paymob approves: add the Paymob keys as secrets, set the webhook URL in the Paymob dashboard, test with Paymob test cards, then switch to live and turn on online payment in admin settings |
| 10 | Me | ✅ Code is on GitHub (`main`); the old GitHub Pages site now redirects to the store (served from the `gh-pages` branch). Deploys are still manual (`npm run build` then `npx wrangler deploy`); automatic deploys on push can be added in Cloudflare (Workers, Settings, Builds, connect GitHub) |

## Paymob values needed at step 9
From the Paymob dashboard (Developers / Settings):
- Secret key
- Public key
- HMAC secret
- Integration IDs for card, wallet (and any others he wants)

These go in as Cloudflare secrets (`wrangler secret put ...`), never in the code.
Webhook URL to paste in Paymob: `https://<site address>/api/paymob/webhook`

## Running it locally
```
cd website
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
Then open http://127.0.0.1:4321. `.dev.vars` (local only) opens `/admin` without a login and uses a fake
payment page so orders can be tested without money.

## Deploying an update
```
cd website
npm run build
npx wrangler deploy
```
