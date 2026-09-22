/**
 * Frontend Error Reporter (Sprint 14 — comprehensive error reporting)
 *
 * Ships client-side errors to the backend `POST /api/errors/report` endpoint,
 * where they are written to the log4j-style logger (console + logs/server.log
 * via FileAppender). Post-mortem debugging of browser / Capacitor sessions no
 * longer depends on having devtools open.
 *
 * Features:
 *   - Automatic dedupe: the same message+stack hash is reported at most once
 *     per session (repeat occurrences only increment a counter).
 *   - Rate limiting: max 20 unique reports per browser session.
 *   - Fire-and-forget: never throws, never blocks the caller; falls back to
 *     `navigator.sendBeacon` when available.
 *   - Global capture: `installGlobalErrorCapture()` registers
 *     window.onerror + unhandledrejection handlers.
 *
 * @module src/utils/errorReporter
 * @version 7.7.0
 */

import Logger from './logger.js';

const logger = new Logger('ErrorReporter');

/** Max unique reports per browser session. */
const MAX_REPORTS_PER_SESSION = 20;

/** In-memory dedupe set of already-reported error fingerprints. */
const reportedFingerprints = new Set();

/** Simple hash for dedupe (djb2). */
function fingerprint(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return String(hash);
}

/**
 * Report an error event to the backend.
 *
 * @param {Object} payload
 * @param {string} payload.level - One of: error | warn | fatal
 * @param {string} payload.source - Short origin tag, e.g. 'window.onerror',
 *        'unhandledrejection', 'PageErrorBoundary', 'api'
 * @param {string} payload.message - Human-readable error message
 * @param {string} [payload.stack] - Stack trace
 * @param {string} [payload.context] - Extra context (page, engine, task id...)
 * @returns {Promise<void>} Resolves when the report has been sent (or skipped)
 */
export async function reportError({ level = 'error', source = 'unknown', message = '', stack = '', context = '' } = {}) {
  try {
    if (!message) return;

    // Dedupe identical errors within the session.
    const fp = fingerprint(`${source}|${message}|${stack}`);
    if (reportedFingerprints.has(fp)) return;
    if (reportedFingerprints.size >= MAX_REPORTS_PER_SESSION) return;
    reportedFingerprints.add(fp);

    const body = JSON.stringify({
      level,
      source,
      message: String(message).slice(0, 2000),
      stack: String(stack || '').slice(0, 4000),
      context: String(context || '').slice(0, 1000),
      url: (typeof window !== 'undefined') ? window.location?.href : '',
      userAgent: (typeof navigator !== 'undefined') ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
    });

    // Fire-and-forget fetch; on failure fall back to sendBeacon.
    const base = (typeof window !== 'undefined' && window.location?.protocol?.startsWith('http'))
      ? '/api'
      : '';
    try {
      await fetch(`${base}/errors/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch (_) {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(`${base}/errors/report`, body);
      }
    }
  } catch (err) {
    // Never let error reporting itself break the app.
    logger.debug(`reportError failed silently: ${err?.message || err}`);
  }
}

/**
 * Install global window-level error capture handlers.
 * Registers window.onerror + unhandledrejection. Safe to call once at startup.
 *
 * @returns {void}
 */
export function installGlobalErrorCapture() {
  if (typeof window === 'undefined' || window.__zmusicErrorCaptureInstalled) return;
  window.__zmusicErrorCaptureInstalled = true;

  window.addEventListener('error', (event) => {
    reportError({
      level: 'error',
      source: 'window.onerror',
      message: event.message || 'Unknown script error',
      stack: event.error?.stack || `${event.filename || ''}:${event.lineno || 0}:${event.colno || 0}`,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    reportError({
      level: 'warn',
      source: 'unhandledrejection',
      message: (reason && (reason.message || String(reason))) || 'Unhandled promise rejection',
      stack: reason?.stack || '',
    });
  });

  logger.info('Global error capture installed (window.onerror + unhandledrejection)');
}
