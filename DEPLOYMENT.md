# ZMusic Deployment Guide

This guide provides multiple deployment options to share ZMusic with friends via a public link.

## Option 1: Render Free Tier (Recommended - One-Click Deploy)

**Why Render?** Free tier supports both Node.js backend + static frontend, with 24/7 uptime (spins down after 15min idle, wakes on request).

### Steps:
1. Push latest code to GitHub (already done via `npm run backup`)
2. Click this one-click deploy link:
   ```
   https://render.com/deploy?repo=https://github.com/zwindhuang-opc/zmusic
   ```
3. Sign in with GitHub account
4. Render will detect `render.yaml` blueprint and create 2 services:
   - `zmusic-api` - Backend Node.js service (free)
   - `zmusic-web` - Frontend static site (free)
5. Set the `SUNO_CN_API_KEY` secret in the `zmusic-api` service dashboard
6. Wait ~5 minutes for first build to complete
7. Your shareable link will be: `https://zmusic-web.onrender.com`

**Note:** Render free tier sleeps after 15min of inactivity. First request after sleep takes ~30s to wake up.

---

## Option 2: Run Without Server Startup (Local Desktop App)

If you just want to use ZMusic locally without starting the dev server each time, build the Electron desktop app:

```bash
npm run electron:build
```

This produces a Windows installer at `release/ZMusic Setup 5.5.0.exe` that:
- Runs as a standalone desktop app (no server startup needed)
- Bundles the Express backend inside the Electron process
- Creates desktop/start menu shortcuts
- Auto-launches with double-click

---

## Option 3: Vercel + Railway (Alternative)

If Render is slow from your region:
1. Frontend: Deploy `dist/` to Vercel via GitHub integration
2. Backend: Deploy `src/server.js` to Railway (free $5/month credit)
3. Update `VITE_API_BASE_URL` in Vercel env vars to Railway backend URL

---

## Mobile App Sync

Versions are now synced across all platforms:
- Web: 5.5.0 (package.json + VERSION.json)
- Android: versionCode 7, versionName 5.5.0 (android/app/build.gradle)
- iOS: MARKETING_VERSION 5.5.0, CURRENT_PROJECT_VERSION 5 (ios/App/App.xcodeproj)

### Build Android APK:
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

### Build iOS (requires macOS):
```bash
npm run build
npx cap sync ios
npx cap open ios  # then Archive in Xcode
```

---

## Quick Share Links

After deployment, share these links with friends:
- **Web App:** `https://zmusic-web.onrender.com` (after Render deployment)
- **GitHub Repo:** `https://github.com/zwindhuang-opc/zmusic`
- **Latest Release APK:** `https://github.com/zwindhuang-opc/zmusic/releases/latest`

---

## Environment Variables

Required for production:
- `SUNO_CN_API_KEY` - Suno.cn API key (for real music generation)
- `PORT` - Backend port (default 5501)
- `NODE_ENV` - Set to `production` for deployed environments
- `VITE_API_BASE_URL` - Backend URL for frontend to call (e.g. `https://zmusic-api.onrender.com/api`)
