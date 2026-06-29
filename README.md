# Mindi's Cleaning App

A fun, easy-to-use cleaning checklist app for keeping track of household chores — installable on iPhone and iPad with automatic sync between devices.

## Features

- **Weekly Task Suggestions**: Get 3–5 random tasks each week from different rooms
- **Dual Progress Tracking**: Overall progress + weekly progress bars
- **Complete Checklists**: Full checklists for every room in your house
- **Bait Management**: Dedicated tab for changing cockroach baits by room
- **Editable Lists**: Add, edit, or remove tasks as your home changes
- **Device Sync**: iPhone and iPad stay in sync via a shared household code
- **Offline Support**: Works without internet after first load (PWA + service worker)
- **Celebration System**: Confetti, stars, and sparkle effects for achievements

## Quick Start (iPhone + iPad)

### Step 1: Host the app on GitHub Pages

1. Push this repo to GitHub (or use your existing `mindi-cleaning` repo)
2. Go to **Settings → Pages**
3. Set **Source** to `main` branch, folder `/ (root)`
4. Your app will be live at: `https://YOUR-USERNAME.github.io/mindi-cleaning/`

### Step 2: Deploy the sync backend (Cloudflare Worker)

The sync API runs on Cloudflare's free tier — no credit card needed for basic use.

1. Create a free account at [cloudflare.com](https://cloudflare.com)
2. Install Wrangler: `npm install -g wrangler`
3. Log in: `wrangler login`
4. Create a KV namespace:
   ```bash
   cd worker
   wrangler kv namespace create MINDI_SYNC
   ```
5. Copy the namespace `id` from the output and paste it into `worker/wrangler.toml` (replace `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`)
6. Deploy:
   ```bash
   wrangler deploy
   ```
7. Note the Worker URL (e.g. `https://mindi-cleaning-sync.your-name.workers.dev`)

### Step 3: Connect the app to sync

1. Open `index.html` and update the line near the top of the script:
   ```javascript
   const SYNC_API_URL = 'https://mindi-cleaning-sync.your-name.workers.dev';
   ```
2. Commit and push — GitHub Pages will redeploy automatically

### Step 4: Install on iPhone

1. Open the GitHub Pages URL in **Safari** on the iPhone
2. Tap **Share** (square with arrow)
3. Tap **Add to Home Screen**
4. Open the app from the home screen icon
5. Go to **Settings → Device Sync → Create Household**
6. Note the 6-character code shown

### Step 5: Install on iPad

1. Open the same GitHub Pages URL in Safari on the iPad
2. **Share → Add to Home Screen**
3. Open the app → **Settings → Device Sync**
4. Enter the household code from the iPhone and tap **Join Household**

Both devices now sync automatically every 30 seconds and whenever you open the app.

## Room Areas Included

- Bedroom (including Walk-in Robe & Ensuite)
- Lounge Room
- Laundry
- Entries/Treadmill Area
- Dining/Family Room
- Kitchen
- Sewing Room
- Toilet
- Bathroom
- Kiddies Room
- Guestroom
- Outside - Entry (Courtyard & Deck)

## How It Works

1. **Check off tasks** as you complete them
2. **Weekly tasks rotate** automatically to cover all areas over time
3. **Track progress** with both overall and weekly progress bars
4. **Sync across devices** — changes on iPhone appear on iPad within seconds
5. **Edit lists** anytime — add new tasks or remove old ones
6. **Export/Import JSON** in Settings for manual backups

## Local Development

Serve the folder over HTTP (required for service worker and IndexedDB on some browsers):

```bash
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080`

## Regenerate Icons

```bash
node scripts/generate-icons.mjs
```

## Customization

- **Add new rooms**: Settings → Add New Room/Area
- **Edit tasks**: Click the pencil button next to any task
- **Add tasks**: Click Add Task in any room
- **Delete tasks**: Click the trash button next to any task
- **Leave sync**: Settings → Device Sync → Leave Household

## File Overview

| File | Purpose |
|------|---------|
| `index.html` | Main app (PWA entry point) |
| `sw.js` | Service worker for offline caching |
| `manifest.json` | PWA install manifest |
| `worker/sync.js` | Cloudflare Worker sync API |
| `worker/wrangler.toml` | Worker deployment config |

Enjoy keeping your home sparkling!
