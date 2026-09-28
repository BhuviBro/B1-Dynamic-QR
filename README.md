# B1 Cards — Smart NFC & QR Business Cards

A modern full-stack web application designed for manufacturing, managing, and dynamic routing of NFC and QR business cards.

---

## ⚡ Core Concept: Two-Step Card Lifecycle

1. **Generate (Manufacturing Step)**: 
   - Admin and approved sales reps generate unique 6-character alphanumeric codes (e.g. `K3F9X1`) in single taps or bulk batches.
   - The QR code is rendered immediately client-side pointing to permanent redirection URLs (`https://[domain]/c/{code}`).
   - High-resolution PNGs can be downloaded immediately with the card code caption for factory NFC encoding and physical card printing.

2. **Assign (Sales Step)**:
   - When a physical card is sold in the field, any approved rep scans the card with their phone camera (via `html5-qrcode`) or enters the 6-character code.
   - The rep inputs business details, customer name, contact phone, date sold, and destination URL (such as a Google Maps Review link).
   - Once activated, tapping the physical card's NFC chip or scanning the QR code immediately routes the customer through a high-speed HTTP 302 redirect.
   - **Protection Rule**: Once active, cards are locked from regular rep edits. Only Administrators can update an active card's destination URL or business details.
   - **Dual Attribution**: The card permanently retains who generated the code and who sold/assigned it.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Mobile-first Vanilla CSS design system (Dark Mode, Glassmorphism, Micro-interactions)
- **Backend & Database**: Firebase Authentication (Email/Password) + Cloud Firestore
- **PWA (Progressive Web App)**: Full offline-capable PWA manifest & service worker for native home screen installation on iOS and Android
- **Scanning & Generation**: `html5-qrcode` for camera QR scanning, `qrcode` for client-side vector/PNG export
- **Hosting & Serverless Functions**: Netlify (`netlify.toml` + `/c/:code` Netlify Serverless Function)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase Environment Variables
Create a `.env` file in the project root based on `.env.example`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional custom domain (defaults to current browser origin if omitted)
VITE_PUBLIC_DOMAIN=
```

### 3. Deploy Firestore Security Rules
Publish the rules defined in `firestore.rules` to your Firebase project:
```bash
firebase deploy --only firestore:rules
```

### 4. Run Development Server
```bash
npm run dev
```

Open `http://localhost:5173` to test the application.

---

## 📱 Mobile Installation (PWA)

- **iOS Safari**: Open website, tap the Share icon, and select **"Add to Home Screen"**.
- **Android Chrome**: Open website, tap the three dots (⋮), and select **"Install App"** / **"Add to Home screen"**.

---

## 🌐 Netlify Deployment

1. Connect this repository to **Netlify**.
2. Netlify will automatically detect `netlify.toml` (`npm run build`, publish directory `dist`, functions directory `netlify/functions`).
3. Set your environment variables in Netlify (**Site settings > Environment variables**):
   - Add frontend keys from `.env` (`VITE_FIREBASE_API_KEY`, etc.).
   - Add backend Admin SDK key `FIREBASE_SERVICE_ACCOUNT` (JSON string) for the `/c/:code` serverless redirect function.
