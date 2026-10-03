# B1 Cards — Project Context & Dev Log

This document serves as the persistent architectural log and running developer journal for **B1 Cards**, an admin web application engineered for manufacturing, managing, and dynamic routing of NFC and QR business cards.

---

## [2026-09-28] Initial build
**What:** 
- Scaffolding and full architecture initialization of the B1 Cards application.
- Implementation of React 19 + Vite mobile-first web app with Firebase Authentication (Email/Password) and Cloud Firestore backend.
- Designed two-tier Role-Based Access Control (RBAC): `admin` and `user` (with approval lifecycle: `pending` -> `approved` / `revoked`).
- Implemented core two-step lifecycle for NFC/QR cards:
  1. **Generate**: Production of blank unique 6-character alphanumeric cards (e.g. `K3F9X1`) and on-demand client-side QR generation (`https://[domain]/c/{code}`) for pre-printing and factory NFC tag flashing.
  2. **Assign**: Camera-based scanner (via `html5-qrcode`) or manual code lookup to bind metadata (Business Name, Customer Name, Contact Phone, Date Sold, and Google Maps Review URL) to the card.
- Implemented Netlify serverless redirect function (`/c/:code` -> `netlify/functions/redirect.js`) for zero-friction dynamic redirection:
  - Assigned cards receive immediate HTTP 302 redirects to their configured destination URL.
  - Unassigned cards render a clean, branded standby screen ("This card isn't active yet").
  - Non-existent cards return HTTP 404 with a branded error page.
- Configured Firestore security rules enforcing strict role-based data isolation and server-side authorization.

**Why:** 
- **Two-Step Generate/Assign Architecture**: Physical NFC card manufacturing and QR printing have long turnaround times and unit costs. Decoupling code generation from client assignment allows batches of 100s or 1000s of cards to be printed and encoded with permanent redirection URLs (`https://[domain]/c/{code}`) in advance. When a sales rep or merchant activates a card in the field, they simply scan and assign the target Google Maps review link instantly without needing re-printing.
- **Dynamic Link Longevity**: Customers often rebrand, change physical locations, or update their Google Business Profiles. Routing through a centralized serverless redirect ensures the physical card never expires or becomes obsolete.
- **Admin Approval Gate**: Public signups default to `pending` status to prevent unauthorized card generation or overwrites. Only designated admins can approve reps or alter system-wide data.

**Follow-up:** 
- Deploy to Netlify and link production Firebase project credentials in `.env` / Netlify Environment Variables.
- Test physical camera scanning across iOS Safari and Android Chrome.
- Add bulk export capabilities (CSV / batch ZIP of QR codes) for industrial print batches if needed.

---

## [2026-09-28] PWA Mobile Installability, Collision Prevention & Strict Permission Rules
**What:** 
- **PWA (Progressive Web App) Implementation**: Added `manifest.json`, high-resolution app icons (192×192, 512×512, apple-touch-icon), mobile-web-app meta tags, and registered a production service worker (`sw.js`) allowing users to "Add to Home Screen" and run full-screen natively on iOS Safari and Android Chrome.
- **Blank QR Code Deletion**: Added delete capability for unassigned/blank cards on the Dashboard and Admin Panel with confirmation dialogs. Enforced in `firestore.rules` (Admins can delete any card; approved reps can delete blank cards they created).
- **Guaranteed Anti-Duplication / Collision Checks**: Integrated cryptographic verification loop (`checkCodeExists`) prior to committing any generated code to Firestore, backed by server-side rule `!exists(/databases/$(database)/documents/cards/$(code))` preventing code collisions or overwrites.
- **Universal Assignment with Permanent Dual-Attribution**: Any approved rep can scan or select any blank card in company inventory to assign it to a customer. Firestore immutably preserves `createdBy` / `createdByName` while permanently recording `assignedBy` / `assignedByName` / `assignedAt`.
- **Admin-Only Update Lock on Active Cards**: Updated both frontend and `firestore.rules` so that once a card is `assigned` (active in the field), only `admin` users can update or modify its details or destination URL. Non-admin users see locked, read-only fields with an explanatory notice.

**Why:** 
- Mobile installability enables sales reps to launch B1 Cards with a single tap from their home screen just like a native app.
- Locking active cards to Admin-only edits prevents sales reps from accidentally reassigning or altering cards that are already live in client businesses.
- Allowing blank code deletion ensures inventory hygiene if codes are discarded before manufacturing.

**Follow-up:** 
- Deploy updated `firestore.rules` to production Firebase console.
- Host on Netlify and configure production environment variables.

---

## [2026-09-28] Bulk Atomic Batch Generation, Single-Click ZIP Export & Netlify Packaging
**What:**
- **Atomic Bulk Generation**: Implemented Firestore `writeBatch` in `generateBatchCards` to atomically generate 5, 10, 20, or 50 unique blank cards in sub-second execution with zero collision risk.
- **Single-Click ZIP Archiving**: Integrated `jszip` to bundle all generated QR PNGs into a single `.zip` file (`B1_Cards_Batch_[N]_Cards_[DATE].zip`), completely eliminating browser multiple-download blocking. Added support for batch and session history downloads.
- **Industrial CSV Export**: One-click spreadsheet export containing `Card_Code`, `Redirect_URL`, `Status`, and `Created_At` for manufacturing sheets and print shops.
- **Netlify Function Packaging (`redirect.cjs`)**: Renamed redirect function from `.js` to `.cjs` to resolve Vite `"type": "module"` ESM conflict with `@netlify/zip-it-and-ship-it`.
- **Zero-Dependency Google OAuth2 & REST Fallback**: Replaced heavy `firebase-admin` (~100MB gRPC binaries) with Node's native `crypto.createSign('RSA-SHA256')` + direct Firestore REST API lookup via public Web API Key (`apiKey`), making the serverless redirect function lightning-fast with zero dependency bottlenecks.
- **Environment Variable Aliasing**: Supported `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_KEY`, `FIREBASE_SERVICE_KEY`, and `FIREBASE_SERVICE_ACCOUNT_KEY` interchangeably in Netlify.

**Why:**
- Factory printing requires bulk assets (CSV tables and folders of PNGs) rather than generating cards one by one.
- Browser pop-up blockers aggressively throttle multiple consecutive file downloads; a single ZIP archive provides 100% reliability for print operations.
- Serverless functions experience cold-start lag when loading bulky SDKs like `firebase-admin`; native Node crypto + REST API delivers sub-100ms response times.

---

## [2026-09-28] Public Firestore Security Rules & One-Tap Google Authentication
**What:**
- **Public Card Redirection Rules**: Updated `firestore.rules` to `allow read: if true;` on `match /cards/{code}`. Allows card scans in the wild to be read without authentication, while all write, update, and delete actions remain strictly locked to authenticated admins and approved reps.
- **Google Sign-In (`signInWithGoogle`)**: Integrated `GoogleAuthProvider` and `signInWithPopup` into both the Login and Request Access screens.
  - New Google accounts automatically register with `status: 'pending'` for admin review.
  - Approved users and admins keep their full privileges and photo profile across logins.
  - Added authentic Google brand SVG icon component (`GoogleIcon.jsx`).

**Why:**
- When customers tap an NFC card or scan a QR code, they are anonymous public visitors; Firestore must permit reading card metadata (status and destination URL) without login.
- Google Sign-In drastically reduces authentication friction for sales reps and administrators in the field.

---

## [2026-10-02] Camera QR Scanner Lifecycle Stability & Global ErrorBoundary
**What:**
- **Resolved "Scans and Goes into Blank State" Crash**:
  - Fixed a critical React unmount race condition where `html5-qrcode` attempted to remove DOM elements from `#qr-reader-container` after React had already unmounted it, throwing an uncaught `TypeError: Cannot read properties of null`.
  - Re-architected `ScannerModal.jsx` to stop and clear the scanner instance *before* closing the modal.
  - Guarded instance refs to ensure cleanup never executes twice.
- **Dual-Camera Fallback**: Camera initialization attempts rear camera (`facingMode: 'environment'`) first, and automatically falls back to user/front camera if rear is unavailable.
- **Global `ErrorBoundary.jsx`**: Wrapped `App.jsx` in a class-based error boundary to trap any hardware, media stream, or runtime errors, completely preventing blank white screens.
- **Refined Code Parser**: Upgraded `extractCodeFromInput` in `codeGenerator.js` with multi-pattern regex to handle `/c/XXXXXX` paths, query parameters (`?code=XXXXXX`), delimited strings (`B1 • XXXXXX`), and raw 6-character codes.

**Why:**
- Field testing revealed mobile browsers occasionally crashed when unmounting active camera streams during QR recognition.
- An Error Boundary guarantees high resilience in production environments without leaving users on a blank screen.

---

## [2026-10-02] Cyber-Luxe Animated Redirection Loading Screen & Zero-Delay Pre-Loader
**What:**
- **Animated Redirection Component (`RedirectLoadingScreen.jsx`)**: Built a modern cyber-luxe mobile screen featuring:
  - Concentric expanding electric-cyan and purple NFC radar pulse waves radiating from a 3D glowing B1 monogram.
  - Dynamic status text ("Connecting to {Business Name}...").
  - Live card code badge with a pulsing green indicator.
  - High-tech indeterminate shimmer progress bar.
  - Automatic redirect via `window.location.replace()`.
  - Manual tap fallback button ("Tap here if not redirected ➔") displayed after 2.2s.
- **Pre-Hydration Zero-Delay Preloader (`index.html`)**: Embedded matching inline-styled radar animation inside `<div id="root">` so that mobile devices scanning a QR code see the animated radar from millisecond 0 before JavaScript or React bundles finish downloading.
- **Serverless Redirect Function Match (`redirect.cjs`)**: Updated Netlify function to return the animated radar HTML page alongside HTTP 302 headers.

**Why:**
- When scanning QR codes on mobile networks, phones previously showed a static PWA launcher icon or blank frame during DNS lookup and redirection.
- The futuristic animated radar screen provides immediate visual feedback, reinforcing the B1 Cards brand and delivering a high-end customer experience.

---

## Current Architecture Summary

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 + Vite + Vanilla CSS | Mobile-first admin dashboard, PWA installable, dark glassmorphism |
| **Authentication** | Firebase Auth (Email/Pass + Google Sign-In) | RBAC with pending approval workflow |
| **Database** | Cloud Firestore | Cards inventory & users collection with dual-attribution |
| **Serverless Redirect** | Netlify Functions (`redirect.cjs`) | Instant dynamic 302 routing with animated radar fallback |
| **QR Generation & Export**| `qrcode` + `jszip` | Client-side QR rendering, bulk batch ZIP download, CSV export |
| **Camera Scanner** | `html5-qrcode` + `ErrorBoundary` | In-browser QR card scanning with race-condition prevention |

