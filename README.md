# ResumePro Store

![Templates](https://img.shields.io/badge/templates-32-purple)
![Payments](https://img.shields.io/badge/payments-USDT%20BEP--20-blue)
![Pricing](https://img.shields.io/badge/starting%20at-%242-success)
![Hosting](https://img.shields.io/badge/hosting-Vercel%20%2B%20GitHub-free)

**Premium, print-ready resume templates — starting at $2. Pay with USDT (BEP-20), unlock instantly, customize in your browser, download clean PDFs.**

**Live store:** [`https://resumepro-store.vercel.app`](https://resumepro-store.vercel.app)

> **Note:** This store runs on Vercel's free tier. After 5 minutes of inactivity, the server may need a few seconds to wake up. Download links use self-verifying tokens and work instantly regardless — no server-side storage needed.

---

## Overview

ResumePro is a fully automated resume template storefront. Browse 32 professionally designed templates, pay with cryptocurrency (USDT on Binance Smart Chain), and receive your unlock code via email within seconds. Each template is a standalone HTML file with print-optimized CSS — no software, no subscriptions, no hidden fees.

---

## Features

| Feature | Details |
|---------|---------|
| **32 Premium Templates** | Classic, Modern, Minimal, Executive, Editorial, Creative, Technical, Academic, Bold, Elegant, Compact, Vibrant, McWell, AltaCV, Friggeri, TwentySeconds, Material, Orbit, Hipster, Rows, Sidebar Left, Infographic, Sharp, Simple, Thoughteer, Pseudomanifold, Bobok, Cies, GBoeing, RoyCoding, Agonist, SC932 |
| **Browser-Based Customizer** | Click any text to edit, upload a photo, live preview — no software installation needed |
| **Template Quiz** | Answer one question about your role — get matched to the best template for your industry |
| **Dark Mode** | Toggle between light and dark storefront themes |
| **Print-Ready CSS** | Every template is optimized for A4 PDF export with `@media print` and `@page size: A4` |
| **ATS-Friendly** | Standard heading structures pass Applicant Tracking Systems |
| **Instant Crypto Checkout** | Pay with USDT (BEP-20) — automated on-chain verification via BscScan |
| **Automated Email Delivery** | Unlock code + download link sent via Resend within seconds of payment verification |
| **QR Code Payments** | Scan the QR code from any wallet app for instant address copying |
| **Unlock Code System** | After purchase, receive a unique code to unlock clean, watermark-free downloads in the customizer |
| **3-Pack & Bundle Discounts** | Mix and match any 3 templates for $5, or get all 32 for $10 |
| **Glassmorphism UI** | Modern frosted-glass design with animated orbs, particles, and scroll-triggered reveal animations |
| **Live Preview** | Click "Preview" on any template to see the full design before buying |

---

## How It Works

### For Buyers

```
1. BROWSE ──► Browse 32 templates on the storefront
               Use the quiz if you're not sure which one fits

2. BUY    ──► Click "Buy" on any template, 3-Pack, or Bundle
               → Modal shows wallet address + QR code + exact USDT amount
               → Send USDT (BEP-20) from Binance, Trust Wallet, or any wallet

3. VERIFY ──► Click "I've Sent the Payment — Verify"
               → Enter your email address
               → Paste the transaction hash (TX hash) from your wallet
               → System verifies on-chain via BscScan API

4. RECEIVE ──► Unlock code + download link sent to your email instantly
                → Enter the unlock code in the customizer to unlock clean downloads
                → Or download the template ZIP directly from the storefront

5. CUSTOMIZE ──► Open the template in the browser customizer
                  → Click any text to edit in place
                  → Upload your photo
                  → Download as clean, watermark-free PDF
```

### For Developers / Operators

```
API call flow:
  Buyer clicks "Buy"
    → Modal shows wallet + QR code + amount
  Buyer sends USDT + clicks "Verify"
    → POST /api/verify-payment { txHash, email, product, templateIds }
    → Server calls BscScan API to verify on-chain
    → If valid: generates unlock code (e.g. RESUME-AB12-CD34) + download token
    → Emails buyer via Resend with unlock code + download link
    → Buyer uses unlock code in POST /api/verify-code
    → Server validates code → unlocks specified templates
```

---

## Pricing

| Product | Price | Savings |
|---------|-------|---------|
| Single Template | **$2** | — |
| 3-Template Pack (any 3) | **$5** | Save 17% vs single |
| Complete Bundle (all 32) | **$10** | Save 84% vs single |

Payment: **USDT (BEP-20 / BSC Network)** — send from any wallet (Binance, Trust Wallet, MetaMask, etc.).

---

## All 32 Templates

| # | Template | Style | Best For |
|---|----------|-------|----------|
| 1 | Classic | Editorial Serif | Product / General |
| 2 | Executive | Dark Luxury | C-Suite / Board |
| 3 | Modern | Technical Dark | Engineers / Devs |
| 4 | Editorial | Magazine | Directors |
| 5 | Minimal | Understated | Design / Creative |
| 6 | Creative | Artistic | Design / Marketing |
| 7 | Technical | Structured | Engineers / Devs |
| 8 | Academic | Scholarly | Academia |
| 9 | Bold | Confident | Sales / Leadership |
| 10 | Elegant | Refined | Finance / Legal |
| 11 | Compact | Dense | Career Changers |
| 12 | Vibrant | Bold Creative | Designers |
| 13 | McWell | Clean Corporate | Corporate / Finance |
| 14 | AltaCV | Two-Column Teal | Creative / Design |
| 15 | Friggeri | Dark Navy | Technical |
| 16 | TwentySeconds | Bold Modern | Modern Professional |
| 17 | Material | Material Design | Tech / Product |
| 18 | Orbit | Warm Amber | Marketing |
| 19 | Hipster | Dark Green | Design / Creative |
| 20 | Rows | Clean Grid | Consulting |
| 21 | Sidebar Left | Charcoal Dark | Executives |
| 22 | Infographic | Data Visual | Analytics / Data |
| 23 | Sharp | Geometric | Engineers |
| 24 | Simple | Ultra Minimal | Design |
| 25 | Thoughteer | Warm Academia | Academia |
| 26 | Pseudomanifold | Scientific | Science / Math |
| 27 | Bobok | Consulting Pro | Consulting |
| 28 | Cies | Warm European | European Professional |
| 29 | GBoeing | Academic Research | Research |
| 30 | RoyCoding | Fun Creative | Creative Tech |
| 31 | Agonist | Blue Professional | Professional / General |
| 32 | SC932 | Formal Gold | Formal / Law |

Every template includes:
- Print-optimized CSS (`@media print`) with exact A4 sizing (`@page size: A4`)
- Google Fonts integration (Inter, Playfair Display, JetBrains Mono, etc.)
- Sections: Contact, Summary, Experience, Education, Skills
- Fully customizable — edit any text or style directly in the browser

---

## How to Use Your Templates

After purchase, you'll receive a `.zip` containing:
- **`.html` file** — Open in browser, click any text to edit, print to PDF
- **`.pdf` file** — Ready-to-print, no editing needed

### Editing in Browser
1. Extract the `.zip`
2. Open the `.html` file in Chrome/Firefox/Edge
3. Click any text to edit inline
4. `Ctrl+P` (Windows) or `Cmd+P` (Mac) → "Save as PDF"
5. Enable "Background graphics" for best print results

### Using the Online Customizer
1. Go to [`customize.html?template=name`](https://resumepro-store.vercel.app/customize.html)
2. Click any text to edit it in place
3. Upload your photo (click the avatar area)
4. Enter your unlock code to remove watermarks
5. Click "Download My Resume" to save as clean PDF

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Hosting** | Vercel (static site + serverless functions) |
| **Source Control** | GitHub |
| **Storefront** | Vanilla HTML + Tailwind CSS (CDN) + Custom CSS variables |
| **Typography** | Google Fonts (Inter, Playfair Display, Space Grotesk, JetBrains Mono) |
| **QR Codes** | QRCode.js |
| **Crypto Verification** | BscScan API (on-chain USDT BEP-20) |
| **Email Delivery** | Resend API |
| **Preview Capture** | Puppeteer |
| **UI/UX** | Glassmorphism, CSS animations, IntersectionObserver scroll-reveal, floating particles |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/create-order` | POST | Returns wallet address + amount for the selected product |
| `/api/verify-payment` | POST | Verifies TX hash via BscScan, generates unlock code + download token, sends email |
| `/api/verify-code` | POST | Validates an unlock code, returns which templates it unlocks |
| `/api/download?token=...` | GET | Serves template ZIP files by download token |

---

## Payment Flow (Technical)

```
Buyer clicks "Buy" on template / 3-Pack / Bundle
  → openBuyModal() shows wallet address + USDT amount + QR code
  → Buyer sends USDT (BEP-20) to wallet address from Binance/Trust Wallet
  → Buyer clicks "I've Sent the Payment — Verify"
  → Buyer enters email + TX hash
  → POST /api/verify-payment { txHash, email, product, templateIds }
  → Server validates TX via BscScan API (checks amount, confirmations, recipient)
  → If valid:
      → Generates unlock code (format: RESUME-XXXX-XXXX)
      → Generates download token (UUID)
      → Saves to /tmp/downloads.json
      → Sends email via Resend with unlock code + download link
      → Returns success + unlock code to frontend
  → If invalid:
      → Returns error → frontend shows failure step
  → Buyer can also enter unlock code in POST /api/verify-code
  → Server validates code → returns list of unlocked template IDs
  → Customizer unlocks clean watermark-free download
```

---

## Development

### Local Setup
```bash
# Serve the static site locally
npm run serve
# or
python3 -m http.server 8000
```

### Capture Preview Screenshots
```bash
npm run preview:capture
```

### Generate Clean Templates + ZIPs
```bash
npm run deliver
```

### Validate
```bash
npm test
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BSCSCAN_API_KEY` | Yes | BscScan API key for on-chain TX verification |
| `RESEND_API_KEY` | Yes | Resend API key for email delivery |
| `WALLET_ADDRESS` | No | USDT wallet address (default: 0x56da...) |
| `FROM_EMAIL` | No | Sender email for Resend (default: thinkedover@gmail.com) |
| `SITE_URL` | No | Override site URL (auto-detected on Vercel) |

---

## License

Single-user, non-transferable license for personal resume creation.
- ✅ Edit and use for your own job applications
- ✅ Print and share your completed resume
- ❌ Resell, redistribute, or share the template files
- ❌ Use templates to build resumes for clients
- ❌ Publish the template source code publicly

Full terms: [LICENSE](LICENSE)

---

## Contact

**Questions, support, or custom requests:** [thinkedover@gmail.com](mailto:thinkedover@gmail.com)

---

&copy; 2026 ResumePro. All rights reserved.