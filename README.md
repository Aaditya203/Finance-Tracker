# 💸 Partner Finance Tracker

<p align="center">
  <strong>A modern, full-stack partner expense tracking and settlement management application built for seamless shared finance management.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa" alt="PWA Ready" />
</p>

---

## ✨ Key Features

- 📊 **Interactive Financial Dashboard**  
  Real-time tracking of total monthly spend, individual partner contributions, equal 3-way expense splits, and live balance counters.

- 💸 **Expense & Settlement Management**  
  Log shared expenses across categories (Hosting, Software, Marketing, Operations), attach receipts, and record direct partner payment settlements.

- 🤝 **Settlement Approvals Flow**  
  Dedicated approval workflow where payment recipients can review proof attachments and confirm or reject settlement records to maintain transparent balances.

- 🔐 **Secure Authentication & Account Security**  
  HTTP-only JWT session authentication, secure password hashing, interactive profile updates, and email-verified password recovery workflows.

- 🤖 **Telegram Bot Sync**  
  Link your Telegram account to record updates and log expenses directly via Telegram chat commands.

- ☁️ **Cloud Storage Integration**  
  Secure digital receipt and proof attachment storage backed by Google Drive with automated permission provisioning.

- 📱 **Progressive Web App (PWA)**  
  Mobile-optimized UI with standalone app install prompts for iOS and Android.

- 🎨 **Modern Aesthetics & Responsive UI**  
  Glassmorphism cards, micro-animations, curated warm color palettes, responsive sidebars, and interactive modals.

---

## 🛠️ Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Frontend Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [TailwindCSS 4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/) |
| **Analytics & Data Vis** | [Chart.js](https://www.chartjs.org/) & [React-ChartJS-2](https://react-chartjs-2.js.org/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Authentication** | [Jose](https://github.com/panva/jose) (JWT) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| **Integrations** | Google Drive API & Nodemailer |

---

## 📂 Project Structure

```text
finance-tracker/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, logout, session check, forgot/reset password
│   │   ├── dashboard/      # Financial summaries, partner balances, spending trends
│   │   ├── expenses/       # Expense creation and receipt attachment management
│   │   ├── settlements/    # Settlement creation, confirm, reject, proof upload
│   │   └── users/          # Partner profile updates & workspace partner listing
│   ├── dashboard/          # Main financial dashboard view
│   ├── expenses/           # Expenses table, category filtering & detailed views
│   ├── settlements/        # Settlement ledger & pending approval banners
│   ├── settings/           # Profile management, password change & Telegram sync
│   ├── sign-in/            # Authentication portal
│   └── privacy/            # Privacy Policy documentation
├── components/
│   ├── dashboard/          # Summary cards, charts, modals, sidebars & navigation
│   ├── layout/             # Brand identity components
│   ├── providers/          # React Context current user providers
│   └── ui/                 # Reusable UI primitives (Buttons, Cards, Inputs, Selects)
├── lib/
│   ├── api/                # Axios API request clients
│   ├── services/           # Backend data aggregation & financial calculations
│   └── google-drive.ts     # Cloud receipt storage integration
└── prisma/
    └── schema.prisma       # Database models (User, Expense, Settlement, Attachment)
```

---

## 🚀 Local Development

### 1. Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/Aaditya203/Finance-Tracker.git
cd Finance-Tracker
npm install
```

### 2. Database Migration

Generate Prisma client and run database migrations:

```bash
npx prisma generate
npx prisma db push
```

### 3. Run Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## ⚙️ Available Scripts

- `npm run dev` – Launch the local development server.
- `npm run build` – Generate Prisma client and create production build.
- `npm start` – Start production server.
- `npm run lint` – Run ESLint code quality checks.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
