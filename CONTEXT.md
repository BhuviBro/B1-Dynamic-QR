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
