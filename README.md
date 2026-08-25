# GoonScroll with Tag Blacklisting

A high-performance, 1:1 faithful recreation of **GoonScroll** (an infinite-scroll adult media application aggregating imageboards like Rule34, e621, Danbooru, Gelbooru, RealBooru, Xbooru, Reddit) featuring a **Tag Blacklisting & Filtering Engine**, a lightweight zero-compile Node.js backend optimized for **Android Termux** and desktop on port **8765**, and an installable iOS/Android **PWA**.

---

## ✨ Features

- **1:1 GoonScroll UI/UX**: Dark theme (`#101828`), full-screen vertical swipe/snap carousel, floating right-side action bar, bottom-left info overlays.
- **🚫 Full-Power Tag Blacklisting**:
  - **Global Blacklist**: Blocks exact tags across all sources.
  - **Per-Source Blacklist**: Blocks tags on specific boorus (e.g. e621-only vs Rule34-only).
  - **Upstream `-tag` Injection**: Translates blacklisted tags directly into upstream booru database queries (`-tag1 -tag2`) for instant responses with zero empty pages.
  - **Instant Live Purge & Position Retention**: Blacklisting a tag mid-scroll removes matching posts immediately from your screen and smoothly advances to the next post without resetting your feed.
  - **Touch-Safe UI & 5-Second Undo**: Dedicated touch targets with an instant Undo toast notification for accidental tag removals.
- **📱 Android Termux & iPhone PWA Ready**:
  - 100% pure JavaScript dependencies (zero native C++ build tools required).
  - Binds to `0.0.0.0:8765` so any device on your local Wi-Fi / network can connect.
  - Add to Home Screen on iPhone Safari for a fullscreen standalone app.
- **📦 Server-Side JSON Storage & Cloud Backup**:
  - Automatically saves settings, blacklists, and favorites to `data/settings.json`.
  - One-click **Download Backup (.json)** and **Restore from File** buttons.
- **🎬 Media Player & Audio**:
  - Autoplays HTML5 video and GIFs with smooth prefetching.
  - Volume memory across sessions.
  - Fit (`contain`) vs Fill (`cover`) aspect ratio toggle.
- **⚡ Supported Sources**:
  - Rule34 (`rule34.xxx`)
  - e621 / e6AI (`e621.net`) with optional API key support
  - Danbooru (`danbooru.donmai.us`) with optional API key support
  - Gelbooru (`gelbooru.com`)
  - RealBooru (`realbooru.com`)
  - Xbooru (`xbooru.com`)
  - Reddit adult feeds (`r/nsfw_gifs`, etc.)

---

## 🚀 Quick Start

### Running on Windows / Mac / Linux

```bash
# 1. Install dependencies
npm install

# 2. Build the frontend PWA
npm run build

# 3. Start the server (Port 8765)
npm start
```

Open your browser to: **`http://localhost:8765`**

---

### Running on Android via Termux

1. Install **Termux** from F-Droid.
2. Inside Termux, install Node.js and Git:
   ```bash
   pkg update && pkg install nodejs-lts git
   ```
3. Clone or copy your project folder:
   ```bash
   cd goonscroll
   npm install
   npm run build
   npm start
   ```
4. Find your phone's Wi-Fi IP address in Termux by running `ifconfig` or checking Wi-Fi settings (e.g. `192.168.1.50`).
5. Open Safari on your iPhone (connected to the same Wi-Fi) and navigate to:
   ```
   http://192.168.1.50:8765
   ```
6. Tap the **Share** button in Safari -> **"Add to Home Screen"** to use it as a fullscreen native app!

---

## ⚙️ Configuration

Create a `.env` file (optional):
```env
PORT=8765
HOST=0.0.0.0
```

---

## 🧪 Testing

Run the full automated test suite:
```bash
npm test
```
