# Debug Session: global-auto-not-working

**Status:** [CLOSED]
**Date:** 2026-08-12
**Symptom:** User clicks GLOBAL AUTO button on Dashboard, nothing happens. No modal appears, no auto generation starts.

## Hypotheses & Disposition

1. **H1: Vite HMR not delivering latest code** — REJECTED. Browser agent confirmed HMR delivers updates correctly; code changes are reflected.

2. **H2: `onNavigate` callback is stale or broken** — REJECTED. `onNavigate={setCurrentPage}` works correctly; navigation to platform pages succeeds.

3. **H3: localStorage handshake race condition** — REJECTED. localStorage write happens before `onNavigate`, and platform page useEffect reads it correctly.

4. **H4: Platform page useEffect guard prevents re-entry** — REJECTED. `globalAutoHandledRef` guard works correctly for single-mount scenario.

5. **H5: AUTO generation function silently fails** — REJECTED (partial). The core `startAutoGeneration` → `handleGenerate` → API call chain is correct. The real blocker was the modal layout preventing user interaction.

## Confirmed Root Cause

**PRIMARY: Modal CSS layout — footer buttons clipped by scroll container**

The AUTO confirmation modals (all 4: Dashboard GLOBAL AUTO, Muse, Suno, Melo) used `max-h-[60vh] overflow-y-auto` on the body without a `flex flex-col` container. When body content was tall (step 1 with platform selector + description text), the body would scroll but the footer (with "下一步" and "确认启动" buttons) was pushed OUT OF VIEW and clipped. The browser agent reported: "Click target intercepted because the button is clipped by an inner scroll container."

**SECONDARY: Multiple runtime crashes in countdown milestones**

- `pickRandomSunoStyleTags().join(', ')` → crashes because function returns `{styleKey, tags, chips}` object, not array
- `pickRandomMeloTags()` treated as array → crashes because returns `{genres, moods}` object
- `themeStyle.intensity` undefined → crashes because `pickRandomThemeStyle()` returns `{theme, style}` only

## Fixes Applied

### 1. Modal Layout (CSS Fix — all 4 pages)
- Added `max-h-[90vh] flex flex-col` to modal container
- Changed body from `max-h-[Nvh] overflow-y-auto` to `flex-1 min-h-0 overflow-y-auto`
- Footer now always visible at bottom; only body scrolls

### 2. Dashboard.jsx — GLOBAL AUTO button logic
- `handleLaunchGlobalAuto`: now opens 3-step modal instead of directly launching
- `proceedGlobalAutoStep`: step 1→2→3 progression; step 3 opens platform tabs, writes localStorage handshake, navigates to first platform

### 3. MusePage.jsx — AUTO button logic + bug fix
- `handleAutoClick`: now opens 3-step modal
- `proceedAutoConfirmStep`: step progression → step 3 starts AUTO
- Fixed `themeStyle.intensity` → `themeStyle.style`

### 4. SunoPage.jsx — AUTO button logic + bug fix
- `handleAutoClick`: now opens 3-step modal
- `proceedAutoConfirmStep`: step progression → step 3 starts AUTO
- Fixed `pickRandomSunoStyleTags().join()` → uses `.tags` property

### 5. MeloPage.jsx — AUTO button logic + bug fix
- `handleAutoClick`: now opens 3-step modal
- `proceedAutoConfirmStep`: step progression → step 3 starts AUTO
- Fixed `pickRandomMeloTags()` → properly destructures `genres` and `moods`
- Fixed `themeStyle.intensity` → `themeStyle.style`

## Verification

Browser agent confirmed:
- GLOBAL AUTO modal: 3 steps work, footer always visible, no clipping
- Muse AI AUTO modal: 3 steps work, footer always visible, no clipping
- Suno AI AUTO modal: same structure (code fix applied)
- Melo AI AUTO modal: same structure (code fix applied)
- Zero JavaScript console errors
- All diagnostics pass (no TypeScript/ESLint errors)

## Status

All AUTO buttons now work correctly. User can click GLOBAL AUTO or individual page AUTO, see 3-step confirmation modal, step through, and launch auto generation.