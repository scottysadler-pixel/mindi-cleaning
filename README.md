# Mindi's Cleaning App

A fun, installable cleaning checklist app for iPhone — works offline, with badges, sounds, animations, and a focus timer.

**Live app:** https://scottysadler-pixel.github.io/mindi-cleaning/

## Features

- **Weekly task suggestions** — 3–5 random tasks from different rooms each week
- **Today's Mission** — one smart pick for what to clean next
- **Achievement badges** — unlock rewards as you progress
- **Sound effects** — satisfying chimes on task completion (toggle in Settings)
- **Focus timer** — 25-minute Pomodoro cleaning sessions with optional ambient sound
- **Animated SVG mascot** — reacts to your progress
- **Circular progress rings** — overall and weekly progress with count-up animations
- **Themed celebrations** — bubbles, leaves, and sparkles per room
- **Color themes** — Auto (time of day), Sunset, Ocean, or Forest
- **Streak counter** — consecutive weeks of completing all weekly tasks
- **Monthly recap** — summary notification at the start of each month
- **Fully offline** — install to home screen, works without internet after first load

## Install on iPhone

1. Open https://scottysadler-pixel.github.io/mindi-cleaning/ in **Safari**
2. Tap **Share** → **Add to Home Screen**
3. Open from the home screen icon — it runs like a native app

## Room areas included

Bedroom, Lounge Room, Laundry, Entries/Treadmill Area, Dining/Family Room, Kitchen, Sewing Room, Toilet, Bathroom, Kiddies Room, Guestroom, Outside - Entry

## Settings

- **Theme** — pick Auto, Sunset, Ocean, or Forest
- **Achievements** — view unlocked badges
- **Sounds** — toggle sound effects on/off
- **Notifications** — enable for monthly recaps
- **Backup** — export/import JSON backup
- **Focus timer** — tap the ⏱️ button bottom-right anytime

## Local development

```bash
npx serve .
# Open http://localhost:8080
```

## Regenerate icons

```bash
node scripts/generate-icons.mjs
```

## File overview

| File | Purpose |
|------|---------|
| `index.html` | Complete app (PWA entry point) |
| `sw.js` | Service worker for offline caching |
| `manifest.json` | PWA install manifest |
| `scripts/generate-icons.mjs` | Generate PWA icon PNGs |

Enjoy keeping your home sparkling!
