<div align="center">

<h1>💸 SplitKaro</h1>

<p><strong>Split trip & event expenses with friends — fairly, clearly, instantly.</strong></p>

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_BADGE_ID/deploy-status)](https://app.netlify.com)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏕️ **Groups** | Create groups for any trip or event, pick an emoji icon, add members |
| 💰 **Advance Payments** | Record money someone paid upfront before the trip starts |
| 🧾 **Expenses** | Log expenses with category, payer, and custom split |
| 📊 **Smart Balances** | Automatically calculates who owes whom |
| 🔁 **Minimum Settlements** | Greedy algorithm minimizes the number of transactions to settle up |
| 📋 **Receipt** | Full printable receipt with per-member breakdown |
| 📤 **Share via WhatsApp** | Send the receipt directly to your group chat |
| 📱 **Native Share** | Use your device's share sheet (SMS, Telegram, Email…) |
| 💾 **Offline-first** | All data saved to `localStorage` — works without internet after first load |

---

## 🚀 Live Demo

👉 **[splitkaro.netlify.app](https://splitkaro.netlify.app)** *(update this link after deploying)*

---

## 🖥️ Tech Stack

- **[React 18](https://react.dev/)** — UI library
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[Vite 8](https://vitejs.dev/)** — Lightning-fast build tool
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling
- **[Zustand](https://zustand-demo.pmnd.rs/)** + `persist` middleware — State management with localStorage
- **[React Router v6](https://reactrouter.com/)** — Client-side routing
- **[Lucide React](https://lucide.dev/)** — Icons
- **[date-fns](https://date-fns.org/)** — Date formatting

---

## 📁 Project Structure

```
SplitKaro/
├── public/
│   └── _redirects              # Netlify SPA routing fix
├── src/
│   ├── components/
│   │   ├── Avatar.tsx          # Member avatar with colour + initials
│   │   └── Navbar.tsx          # Top navigation bar
│   ├── pages/
│   │   ├── Home.tsx            # Groups list / landing page
│   │   ├── CreateGroup.tsx     # Create a new group
│   │   ├── GroupDashboard.tsx  # Group detail — expenses, advances, balances tabs
│   │   ├── AddExpense.tsx      # Log an expense
│   │   ├── AddAdvance.tsx      # Record an advance payment
│   │   └── Receipt.tsx         # Printable + shareable receipt
│   ├── App.tsx                 # Route definitions
│   ├── store.ts                # Zustand store (localStorage persistence)
│   ├── types.ts                # TypeScript data models
│   └── utils.ts                # Balance calc, settlement algo, text receipt generator
├── netlify.toml                # Netlify build & redirect config
└── vite.config.ts              # Vite + Tailwind plugin config
```

---

## 🧮 How the Settlement Algorithm Works

SplitKaro uses a **greedy minimum-transaction algorithm**:

1. Calculate each member's **net balance** = `total paid in` − `share of expenses`
   - Positive → they are **owed** money
   - Negative → they **owe** money
2. Sort creditors (positive) and debtors (negative) by amount
3. Greedily match the largest debtor → largest creditor, record a payment, repeat
4. This minimises the total number of individual transactions needed

**Example:**
```
Rahul paid ₹6,000  share ₹2,000  →  net +₹4,000  (gets back)
Priya paid ₹0      share ₹2,000  →  net −₹2,000  (owes)
Amit  paid ₹0      share ₹2,000  →  net −₹2,000  (owes)

Settlements (only 2 transactions needed):
  Priya → Rahul : ₹2,000
  Amit  → Rahul : ₹2,000
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/splitkaro.git
cd splitkaro

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
# Output is written to the dist/ folder
```

---

## ☁️ Deploy to Netlify

### Option 1 — Drag & Drop (fastest, no account setup)

1. Build the project: `npm run build`
2. Go to **[app.netlify.com](https://app.netlify.com)** → **Add new site** → **Deploy manually**
3. Drag and drop the `dist/` folder onto the page
4. 🎉 Your site is live instantly!

---

### Option 2 — Git Integration (recommended — auto-deploys on every push)

**Step 1 — Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit 🚀"
git remote add origin https://github.com/YOUR_USERNAME/splitkaro.git
git push -u origin main
```

**Step 2 — Connect to Netlify:**
1. Go to **[app.netlify.com](https://app.netlify.com)** → **Add new site** → **Import from Git**
2. Authorise GitHub and select your `splitkaro` repository
3. Netlify auto-reads `netlify.toml` — no manual config needed:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |

4. Click **Deploy site** ✅

> Every future `git push` to `main` will auto-redeploy your site.

---

### Option 3 — Netlify CLI

```bash
# Install the CLI globally
npm install -g netlify-cli

# Log in to your Netlify account
netlify login

# Build and deploy in one step
netlify deploy --prod --dir=dist
```

---

## 📤 Sharing Receipts

From the **Receipt** page you get three ways to send it to friends:

| Button | Action |
|--------|--------|
| 🟢 **WhatsApp** | Opens `wa.me` with the full receipt pre-filled — pick a contact or group |
| 🔵 **Share** | Opens your device's native share sheet (any app: SMS, Telegram, Email…) |
| 📋 **Copy** | Copies formatted plain text — paste it anywhere |

The shared message uses WhatsApp markdown (`*bold*`, `_italic_`) so it renders beautifully.

---

## 🗺️ Roadmap

- [ ] Cloud sync across devices (Firebase / Supabase)
- [ ] Per-member shareable links
- [ ] Multi-currency support
- [ ] Export receipt as PDF
- [ ] Dark mode

---

## 🤝 Contributing

Pull requests are welcome! For major changes please open an issue first.

---

## 📄 License

[MIT](LICENSE) © 2026 SplitKaro
