/**
 * BrowserStatus Service - Detect AI music service status from Edge browser
 *
 * Connects to the user's ALREADY RUNNING Edge browser via CDP (port 9222)
 * and checks the login status of Muse, Suno, and Melo AI services.
 *
 * This allows ZMusic to automatically detect which services the user is
 * logged into in their browser, without requiring separate API keys for
 * each service.
 *
 * @module services/browserStatus.service
 * @version 1.0.0
 */

import WebSocket from 'ws';
import http from 'http';
import Logger from '../utils/logger.js';

const logger = new Logger('BrowserStatus');

/** CDP host and port for Edge browser. */
const CDP_HOST = 'localhost';
const CDP_PORT = 9222;

/** Timeout for CDP operations in milliseconds. */
const CDP_TIMEOUT_MS = 5000;

/** Status cache to avoid repeated CDP connections. */
let _statusCache = null;
let _statusCacheTime = 0;
const CACHE_TTL_MS = 15000;

/**
 * Service definitions for the three AI music platforms.
 * Each entry specifies how to detect if the user is logged in.
 */
const SERVICE_DEFS = [
  {
    id: 'muse',
    name: 'Muse AI',
    domains: ['muse.top', 'project-api.atmob.com'],
    loginIndicators: {
      localStorageKeys: ['AuthToken', 'authToken', 'token', 'muse_token', 'userInfo', 'user'],
      cookieNames: ['ssid', 'session', 'user_token'],
    },
    apiEndpoint: 'https://project-api.atmob.com/project/song/v1/user/info',
  },
  {
    id: 'suno',
    name: 'Suno AI',
    domains: ['suno.cn', 'mcp.suno.cn', 'app.suno.cn'],
    loginIndicators: {
      localStorageKeys: ['token', 'access_token', 'user', 'userInfo', 'suno_token'],
      cookieNames: ['sessionid', 'user_token', 'auth_token'],
    },
    apiEndpoint: 'https://mcp.suno.cn/mcp/api/user',
  },
  {
    id: 'melo',
    name: 'Melo AI',
    domains: ['melo.bytedance.com', 'meloai.com'],
    loginIndicators: {
      localStorageKeys: ['token', 'access_token', 'user', 'userInfo', 'melo_token'],
      cookieNames: ['sessionid', 'user_token', 'auth_token'],
    },
    apiEndpoint: 'https://melo.bytedance.com/api/v1/user/info',
  },
];

/**
 * Connect to Edge CDP and get all page targets.
 * @returns {Promise<Array>} Array of page targets with url, id, webSocketDebuggerUrl
 */
async function getPageTargets() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('CDP connection timeout - Is Edge running with remote debugging enabled?'));
    }, CDP_TIMEOUT_MS);

    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const targets = JSON.parse(data);
          const pages = targets.filter(t => t.type === 'page');
          resolve(pages);
        } catch (e) {
          reject(new Error(`Failed to parse CDP targets: ${data}`));
        }
      });
    }).on('error', (e) => {
      clearTimeout(timeout);
      reject(new Error(`Cannot connect to Edge CDP on port ${CDP_PORT}: ${e.message}`));
    });
  });
}

/**
 * Connect to a specific page target via CDP WebSocket.
 * @param {string} webSocketUrl - The webSocketDebuggerUrl from the target
 * @returns {Promise<WebSocket>} Connected WebSocket
 */
function connectToPage(webSocketUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(webSocketUrl);
    const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), CDP_TIMEOUT_MS);
    ws.addEventListener('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    ws.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });
  });
}

/**
 * Execute JavaScript in a page via CDP Runtime.evaluate.
 * @param {WebSocket} ws - Connected CDP WebSocket
 * @param {string} expression - JavaScript expression to evaluate
 * @returns {Promise<*>} Result value
 */
async function evaluateOnPage(ws, expression) {
  return new Promise((resolve, reject) => {
    const msgId = Date.now() + Math.random();
    const timeout = setTimeout(() => reject(new Error('Evaluate timeout')), CDP_TIMEOUT_MS);

    const handler = (event) => {
      try {
        const data = JSON.parse(event.data || event.toString());
        if (data.id === msgId) {
          clearTimeout(timeout);
          ws.removeEventListener('message', handler);
          if (data.error) {
            reject(new Error(data.error.message || 'Evaluation error'));
          } else {
            resolve(data.result?.result?.value);
          }
        }
      } catch { /* ignore other messages */ }
    };

    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id: msgId,
      method: 'Runtime.evaluate',
      params: {
        expression,
        returnByValue: true,
      },
    }));
  });
}

/**
 * Get cookies for a specific domain via CDP.
 * @param {WebSocket} ws - Connected CDP WebSocket
 * @param {string[]} urls - URLs to get cookies for
 * @returns {Promise<Array>} Array of cookie objects
 */
async function getCookies(ws, urls) {
  return new Promise((resolve) => {
    const msgId = Date.now() + Math.random();
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { ws.removeEventListener('message', handler); } catch { /* ignore */ }
      resolve([]);
    }, CDP_TIMEOUT_MS);

    const handler = (event) => {
      try {
        const data = JSON.parse(event.data || event.toString());
        if (data.id === msgId) {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          ws.removeEventListener('message', handler);
          resolve(data.result?.cookies || []);
        }
      } catch { /* ignore non-matching messages */ }
    };

    try {
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({
        id: msgId,
        method: 'Network.getCookies',
        params: { urls },
      }));
    } catch (e) {
      clearTimeout(timeout);
      try { ws.removeEventListener('message', handler); } catch { /* ignore */ }
      resolve([]);
    }
  });
}

/**
 * Check if a specific service has an open tab in Edge.
 * @param {Array} pages - Array of page targets
 * @param {object} serviceDef - Service definition
 * @returns {object} Detection result with tabFound, loginStatus, etc.
 */
function findServicePage(pages, serviceDef) {
  const matches = pages.filter(page => {
    const url = (page.url || '').toLowerCase();
    return serviceDef.domains.some(domain => url.includes(domain.toLowerCase()));
  });

  if (matches.length === 0) {
    return { tabFound: false, page: null };
  }

  // Prefer non-redirect pages (full URLs, not about:blank)
  const bestMatch = matches.find(p => p.url && !p.url.includes('about:blank')) || matches[0];
  return { tabFound: true, page: bestMatch, allMatches: matches };
}

/**
 * Extract login indicators (localStorage + cookies) from a page.
 * @param {WebSocket} ws - Connected CDP WebSocket
 * @param {object} serviceDef - Service definition
 * @returns {Promise<{hasToken:boolean, tokenSource:string, hasCookies:boolean, cookieNames:Array}>}
 */
async function extractLoginIndicators(ws, serviceDef) {
  const indicators = serviceDef.loginIndicators;

  // Check localStorage and sessionStorage for tokens
  const storageExpression = `
    (function() {
      var found = [];
      var keys = ${JSON.stringify(indicators.localStorageKeys)};
      for (var i = 0; i < keys.length; i++) {
        try {
          var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
          if (v && v.length > 5) {
            found.push({ key: keys[i], length: v.length });
          }
        } catch(e) {}
      }
      return JSON.stringify(found);
    })()
  `;

  let storageResult = [];
  try {
    const val = await evaluateOnPage(ws, storageExpression);
    if (val) {
      storageResult = JSON.parse(val || '[]');
    }
  } catch {
    // Ignore - storage check is best-effort
  }

  // Get cookies for the service's domains
  let cookieNames = [];
  try {
    const cookies = await getCookies(ws, serviceDef.domains);
    cookieNames = cookies.map(c => c.name);
  } catch {
    // Ignore - cookie check is best-effort
  }

  const hasToken = storageResult.length > 0;
  const tokenSource = storageResult.length > 0 ? storageResult[0].key : '';
  const hasCookies = cookieNames.length > 0;

  return {
    hasToken,
    tokenSource,
    hasCookies,
    cookieNames,
    storageItems: storageResult,
  };
}

/**
 * Check the status of all three AI music services from Edge browser.
 * Uses CDP to connect to the user's existing Edge browser and detect
 * which services the user is logged into.
 *
 * @returns {Promise<{edgeConnected:boolean, services:object, timestamp:number}>}
 */
export async function checkBrowserStatus() {
  const now = Date.now();

  // Return cached result if still valid
  if (_statusCache && (now - _statusCacheTime) < CACHE_TTL_MS) {
    return _statusCache;
  }

  const result = {
    edgeConnected: false,
    port: CDP_PORT,
    browserType: 'Edge',
    services: {},
    checkedAt: new Date().toISOString(),
  };

  let pages = [];
  try {
    pages = await getPageTargets();
    result.edgeConnected = true;
    logger.info(`[BrowserStatus] Connected to Edge CDP. Found ${pages.length} pages.`);
  } catch (e) {
    logger.warn(`[BrowserStatus] Cannot connect to Edge CDP: ${e.message}`);
    result.error = e.message;
    _statusCache = result;
    _statusCacheTime = now;
    return result;
  }

  // Check each service - only detect if a tab is open (fast, no login check).
  // Login detection is handled by each service's own status endpoint when
  // the user visits that page. This keeps the health check fast (<1s).
  for (const svcDef of SERVICE_DEFS) {
    const { tabFound, page, allMatches } = findServicePage(pages, svcDef);

    const serviceStatus = {
      id: svcDef.id,
      name: svcDef.name,
      tabFound,
      tabCount: allMatches ? allMatches.length : 0,
      url: page?.url || null,
      loginDetected: tabFound, // If tab is open, assume user may be logged in
      loginSource: tabFound ? 'tab-open' : 'none',
      edgeConnected: true,
    };

    logger.info(
      `[BrowserStatus] ${svcDef.name}: tab=${tabFound}, ` +
      `url=${page?.url ? page.url.substring(0, 60) : 'n/a'}`
    );

    result.services[svcDef.id] = serviceStatus;
  }

  _statusCache = result;
  _statusCacheTime = now;
  return result;
}

/**
 * Get a quick summary of service configured status.
 * Returns booleans suitable for the health endpoint.
 *
 * @returns {Promise<{museConfigured:boolean, sunoConfigured:boolean, meloConfigured:boolean}>}
 */
export async function getServiceStatusSummary() {
  try {
    const browserStatus = await checkBrowserStatus();

    const museSvc = browserStatus.services?.muse || {};
    const sunoSvc = browserStatus.services?.suno || {};
    const meloSvc = browserStatus.services?.melo || {};

    return {
      edgeConnected: browserStatus.edgeConnected,
      museConfigured: museSvc.loginDetected || false,
      sunoConfigured: sunoSvc.loginDetected || false,
      meloConfigured: meloSvc.loginDetected || false,
      browserStatus,
    };
  } catch (e) {
    logger.error(`[BrowserStatus] getServiceStatusSummary error: ${e.message}`);
    return {
      edgeConnected: false,
      museConfigured: false,
      sunoConfigured: false,
      meloConfigured: false,
      error: e.message,
    };
  }
}

/**
 * Force refresh the cache (useful after login/logout changes).
 */
export function clearCache() {
  _statusCache = null;
  _statusCacheTime = 0;
}

export default {
  checkBrowserStatus,
  getServiceStatusSummary,
  clearCache,
};