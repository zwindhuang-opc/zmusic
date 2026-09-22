/**
 * Error Report Controller — receives frontend error reports (Sprint 14)
 *
 * POST /api/errors/report
 *   Body: { level, source, message, stack, context, url, userAgent, timestamp }
 *
 * Each report is written to the log4j-style logger so it lands in both the
 * console and logs/server.log (FileAppender, 5MB rolling). A simple in-memory
 * rate limiter (max 100 reports per minute across all clients) protects the
 * server from log-flooding loops.
 *
 * @module src/controllers/errorReport.controller
 * @version 7.7.0
 */

import Logger from '../utils/logger.js';

const logger = new Logger('FrontendError');

/** Rate limit: max reports per rolling 60s window. */
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

/** Ring buffer of recent report timestamps for rate limiting. */
const recentReports = [];

/**
 * Check and record the rate-limit window.
 * @returns {boolean} true if the request is allowed
 */
function allowRequest() {
  const now = Date.now();
  while (recentReports.length && now - recentReports[0] > RATE_WINDOW_MS) {
    recentReports.shift();
  }
  if (recentReports.length >= RATE_LIMIT) return false;
  recentReports.push(now);
  return true;
}

/**
 * Normalize a log level string to a logger method name.
 * @param {string} level
 * @returns {string}
 */
function normalizeLevel(level) {
  const l = String(level || '').toLowerCase();
  if (l === 'fatal') return 'fatal';
  if (l === 'warn' || l === 'warning') return 'warn';
  return 'error';
}

/**
 * Handle POST /api/errors/report.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
export function report(req, res) {
  try {
    const body = req.body || {};
    const { level, source, message, stack, context, url, userAgent } = body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing message field' });
    }

    if (!allowRequest()) {
      // Silently accept but drop — never let error reporting 5xx the client.
      return res.status(200).json({ success: true, dropped: true, reason: 'rate_limited' });
    }

    const lvl = normalizeLevel(level);
    const ctx = context ? ` | ctx=${context}` : '';
    const stackStr = stack ? `\n  stack=${stack.split('\n').slice(0, 6).join(' | ')}` : '';
    const urlStr = url ? ` | url=${url}` : '';
    const uaStr = userAgent ? ` | ua=${String(userAgent).slice(0, 120)}` : '';

    logger[lvl](`[${source || 'unknown'}] ${message}${ctx}${urlStr}${uaStr}${stackStr}`);

    return res.status(200).json({ success: true, logged: true });
  } catch (e) {
    logger.error(`Failed to process error report: ${e.message}`);
    return res.status(200).json({ success: false, error: 'Report processing failed' });
  }
}

export default { report };
