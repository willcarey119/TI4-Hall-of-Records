# TI4 Hall of Records

A web app that parses, stores, and visualizes Twilight Imperium 4 game logs exported from [TI Assistant](https://ti-assistant.com). Built for a private playgroup.

**Live:** [ti4-hall-of-records.web.app](https://ti4-hall-of-records.web.app) — read-only public view of our league archive.

---

## What it does

- Drag-and-drop upload of TI Assistant JSON exports
- **Game detail pages** — VP race chart, event timeline, per-faction dashboard, tech tree, planet control, agenda votes
- **League stats** — faction win rates, strategy card patterns, tech research trends, scoring pace across all sessions
- **Senate Almanac** — cross-game agenda vote history and VP impact

Visual direction: newspaper / editorial broadsheet — ruled dividers, masthead typography, dense data viz. Not a gamer UI.

---

## Self-hosting

The app uses [Firebase](https://firebase.google.com) (Firestore + Google Auth) as its backend. Firebase has a free tier that comfortably handles a small playgroup. **Setup takes about 15 minutes.**

You do **not** need access to anyone else's Firebase project — each deployment uses its own, isolated database.

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**
2. In the project, go to **Build → Firestore Database** → Create database → Start in **production mode**
3. Go to **Build → Authentication** → Get started → Sign-in method → enable **Google**

### 2. Get your web app config

1. In the Firebase Console: **Project settings** (gear icon) → **Your apps** → **Add app** → choose Web
2. Copy the `firebaseConfig` object values — you'll need them in the next step

### 3. Configure the app

```bash
git clone https://github.com/willcarey119/TI4-Hall-of-Records.git
cd TI4-Hall-of-Records/app
cp .env.example .env
```

Edit `.env` and fill in your Firebase values:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Your Google account email — this controls who can upload and delete games
VITE_ARCHIVIST_EMAILS=you@gmail.com
```

### 4. Update Firestore security rules

Edit `app/firestore.rules` and replace the email with yours:

```
allow write: if request.auth != null
  && request.auth.token.email in [
    'you@gmail.com'
  ];
```

Then deploy the rules:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 5. Run locally or deploy

```bash
cd app
npm install
npm run dev          # local dev server
npm run build        # production build → dist/
```

To deploy, push `dist/` to [Vercel](https://vercel.com) (recommended) or run `firebase deploy` for Firebase Hosting. Set the env vars in your host's dashboard — do **not** commit `.env`.

---

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase Firestore + Firebase Auth
- Vitest + React Testing Library
- Deployed on Firebase Hosting / Vercel

## Dev

```bash
cd app
npm install
npm run dev          # dev server
npm run typecheck    # TypeScript check
npm test             # Vitest
npm run build        # production build
```

All parser logic under `src/lib/` is test-first (TDD). Coverage gate: ≥ 90%.

See [`app/README.md`](app/README.md) for more detail on the app structure.
