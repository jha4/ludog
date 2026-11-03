# Ludo Rage

> **Roll. Rule. Rage.**

A competitive multiplayer Ludo game where every roll matters, every move counts, and every match can turn into a rage-filled battle between friends.

---

## 🎲 Overview

**Ludo Rage** brings the classic four-player cross-and-circle board game into modern high-energy digital play. Designed for intense competition, playful banter, and mischievous sabotage, Ludo Rage features full online multiplayer with real-time Server-Sent Events (SSE), challenging AI bot personalities, pass-and-play local multiplayer, and animated reaction stickers.

## 🔥 Key Features

- **True Multiplayer Rooms:** Instant room creation with shareable 6-character alphanumeric room codes and real-time SSE turn synchronisation.
- **Smart AI Bot Gameplay:** Play solo against 1–3 configurable bot opponents across Easy, Medium, and Hard difficulty levels.
- **Pass & Play Mode:** Pure couch multiplayer on a single device with 2–4 players and zero bots.
- **3D Physics-Accurate Dice:** Realistic CSS 3D dice rolling with authentic roll angles, landing physics, and roll sound synthesis.
- **Animated Token Traversal:** Square-by-square hop animations along calibrated track coordinates with authentic captures, safe spots, and home column progression.
- **Social Taunts & Animated Emojis:** Send animated floating emojis and quick-fire shoutouts to tease opponents during crucial turns.
- **100% Web Audio Synthesizer:** Built-in procedural sound engine for clicks, rolling dice, token steps, captures, and victory fanfares without external audio asset downloads.
- **PWA & Mobile-First:** Responsive mobile layout, installable web manifest, and touch-optimized controls.

## 🕹️ Game Rules

1. **Deploy on 6:** A token can only leave your corner base and enter the active track when rolling a **6**.
2. **Extra Turns:** Rolling a 6 or capturing an opponent's token awards an immediate bonus roll.
3. **Consecutive Sixes Rule:** Rolling three consecutive 6s triggers a penalty, ending your turn immediately.
4. **Safe Spots:** Globe and star tiles protect tokens from being captured.
5. **Captures:** Landing directly on an opponent's token sends it straight back to their home base!
6. **Victory:** Guide all 4 of your tokens around the board and up your colored home column into the central finish triangle to claim the championship.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Motion
- **Backend:** Node.js, Express, Server-Sent Events (SSE)
- **Audio:** Procedural Web Audio API sound synthesizer
- **Testing:** Node.js native test runner (`tsx --test`)

## 🚀 Getting Started

### Development
```bash
npm install
npm run dev
```
The application will be running at `http://localhost:3000`.

### Running Tests
```bash
npm test
```

### Production Build
```bash
npm run build
npm start
```

---

*Ludo Rage – Roll. Rule. Rage.*
