# 🌐 GigWork Frontend — High-Performance Job Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**GigWork Frontend** is a modern, responsive user interface designed for a professional gig economy. Built with Next.js 16, it supports complex recruitment workflows, escrow-based financial management, and interactive AI features.

---

## ✨ Key UX Features

### 🏢 Bifurcated Recruitment Workflows
- **GIG & PART-TIME:** Optimized for local, physical jobs with check-in systems and status tracking.
- **ONLINE & FREELANCE:** Professional **Upwork-style** interface for remote tasks, featuring Milestone management and Escrow funding.

### 🤖 Intelligent AI UI
- **AI Matcher Dashboard:** A dedicated interface for employers to discover and rank the best-fit workers using GraphRAG results.
- **Integrated RAG Chatbot:** A smart widget providing instant answers and job/worker recommendations via natural language.
- **Scam Protection UI:** Visual warnings and trust scores based on real-time AI analysis.

### 💳 Financial Dashboard (Escrow & Wallet)
- **Interactive Milestone Tracker:** Real-time monitoring of task progress (Funded -> Submitted -> Approved -> Released).
- **Internal Wallet Management:** Secure UI for tracking balances, depositing via QR, and reviewing transaction history.

### 🆔 Identity Verification (eKYC)
- **In-browser eKYC:** Integrated VNPT SDK for seamless Face Matching and ID Card OCR verification.

---

## 🛠️ Technical Implementation

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS with premium dark/glassmorphism aesthetics.
- **State Management:** Custom Context providers for Auth, Notifications, and Escrow states.
- **Performance:** Dynamic imports for heavy SDKs (eKYC, Maps) and optimized image handling.
- **SEO:** Dynamic metadata generation for job listings and public profiles.

---

## 🚀 Getting Started

1. **Install:** `npm install`
2. **Environment:** Setup `.env.local` with your backend API URL and VNPT SDK script links.
3. **Run:** `npm run dev`

---
## 📝 License
Licensed under MIT.
