# ZMusic Deployment Guide

This guide provides multiple deployment options to share ZMusic with friends via a public link.

---

## Option 1: Vercel (Recommended - Easiest One-Click Deploy)

**Why Vercel?** Best GitHub integration, fastest builds, most reliable free tier, zero signup friction.

### Steps:
1. Code is already pushed to GitHub
2. **Click this one-click deploy link:**
   ```
   https://vercel.com/new/clone?repository-url=https://github.com/zwindhuang-opc/zmusic
   ```
3. Sign in with **GitHub** (one click, no form to fill)
4. Set the `SUNO_CN_API_KEY` environment variable in the Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add: `SUNO_CN_API_KEY` = your API key
5. Wait ~3 minutes for first build
6. Your shareable link will be: `https://zmusic-xxxx.vercel.app` (shown in dashboard)

**What gets deployed:**
- Frontend (React + Vite) → static CDN hosting
- Backend API (Express) → Vercel Serverless Functions at `/api/*`
- All configured automatically via `vercel.json`

**Vercel Free Tier:** Unlimited bandwidth, 100GB/month bandwidth, 10s max function execution, never sleeps.

---

## Option 2: Netlify (Alternative One-Click Deploy)

**Why Netlify?** Great if Vercel is slow in your region, excellent form handling and CDN.

### Steps:
1. **Click this one-click deploy link:**
   ```
   https://app.netlify.com/start/deploy?repository=https://github.com/zwindhuang-opc/zmusic
   ```
2. Sign in with **GitHub** (authorize Netlify to access your repo)
3. Set the `SUNO_CN_API_KEY` environment variable:
   - Site settings → Build & deploy → Environment → Add: `SUNO_CN_API_KEY`
4. Wait ~3 minutes for build
5. Your shareable link will be: `https://zmusic-xxxx.netlify.app`

**Netlify Free Tier:** 100GB bandwidth/month, 300 build minutes/month, unlimited serverless invocations, never sleeps.

---

## Option 3: Render (Full Node Server)

**Why Render?** Runs a proper Node.js server (not serverless), no cold starts, no execution time limits.

### Steps:
1. Click:
   ```
   https://render.com/deploy?repo=https://github.com/zwindhuang-opc/zmusic
   ```
2. Sign in with GitHub/Google
3. Set `SUNO_CN_API_KEY` in environment variables
4. Wait ~5 minutes

**Note:** Render free tier sleeps after 15min idle. First request takes ~30s to wake up.

---

## Option 4: Run Without Server Startup (Local Desktop App)

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

## Mobile App Sync

Versions are synced across all platforms:
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
npx cap open ios
```

---

## Quick Share Links

| Platform | Link |
|----------|------|
| **Vercel Deploy** | https://vercel.com/new/clone?repository-url=https://github.com/zwindhuang-opc/zmusic |
| **Netlify Deploy** | https://app.netlify.com/start/deploy?repository=https://github.com/zwindhuang-opc/zmusic |
| **Render Deploy** | https://render.com/deploy?repo=https://github.com/zwindhuang-opc/zmusic |
| **GitHub Repo** | https://github.com/zwindhuang-opc/zmusic |
| **Latest APK** | https://github.com/zwindhuang-opc/zmusic/releases/latest |

---

## Environment Variables

Required for production:
- `SUNO_CN_API_KEY` - Suno.cn API key (for real music generation)
- `NODE_ENV` - Set to `production` for deployed environments
- `VITE_API_BASE_URL` - Backend URL (not needed for Vercel/Netlify since API is on same domain)
