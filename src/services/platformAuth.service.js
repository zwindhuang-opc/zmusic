/**
 * Platform Authentication Service
 *
 * Browser-agnostic credential management for Muse, Melo, and other platforms.
 *
 * WHY THIS EXISTS:
 *   The old approach used CDP (Chrome DevTools Protocol) to connect to the
 *   user's Edge browser and extract JWT tokens from localStorage. This was:
 *     - Browser-specific (only Edge/Chrome with --remote-debugging-port)
 *     - Fragile (Edge process exits, port conflicts, IPv6 issues)
 *     - Not scalable (can't support Firefox, Safari, mobile browsers)
 *
 *   This service replaces CDP with a simple server-side token store:
 *     1. User pastes their platform token (JWT) into Settings → Platform Auth
 *     2. Backend validates it by calling the platform's user-info endpoint
 *     3. Backend stores it in a JSON file (persists across restarts)
 *     4. All API calls use this token instead of CDP extraction
 *     5. When token expires, backend detects it and prompts re-authentication
 *
 *   This works on ANY browser, ANY device (mobile, desktop, tablet), because
 *   authentication is 100% server-side. The user only needs a browser to
 *   paste the token once — then the backend handles everything.
 *
 * TOKEN PRIORITY (used by muse.controller.js / melo.controller.js):
 *   1. User-provided token (this store)  — HIGHEST priority
 *   2. CDP-extracted token (optional)    — fallback if available
 *   3. .env MUSE_API_KEY / MELO_API_KEY  — last resort
 *
 * @module services/platformAuth.service
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Logger from '../utils/logger.js';

const logger = new Logger('PlatformAuth');

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = join(__dirname, '..', '..', 'data', 'platform-tokens.json');

/**
 * Platform-specific configuration.
 * Each platform defines:
 *   - name: Display name
 *   - baseUrl: API base URL for validation
 *   - headerName: HTTP header to send the token in
 *   - headerFormat: How to format the header value ('raw' or 'Bearer <token>')
 *   - validatePath: API path to call for token validation
 *   - validateMethod: HTTP method for validation
 *   - validateBody: Request body template for validation (Muse needs extra fields)
 *   - validateHeaders: Extra headers needed (e.g. App-Key for Muse)
 *   - extractCredits: Function to extract credits from validation response
 *   - extractExpiry: Function to extract token expiry from JWT
 *   - instructions: How user can get their token
 */
const PLATFORM_CONFIGS = {
    muse: {
        name: 'Muse AI',
        baseUrl: 'https://project-api.atmob.com',
        headerName: 'AuthToken',
        headerFormat: 'raw', // header value is the raw JWT
        validatePath: '/project/song/v1/user/info',
        validateMethod: 'POST',
        validateBody: (token) => ({
            packageName: 'com.xingchat.web.muse',
            appPlatform: 4,
            channelName: 'web',
            machineId: 'zmusic-auth',
            timestamp: Math.floor(Date.now() / 1000),
            nonce: 'zmusic' + Math.random().toString(36).substring(2, 10),
            authToken: token,
        }),
        validateHeaders: {
            'App-Key': '8e33a5e60ef347df808d14026f27d227',
            'Content-Type': 'application/json',
        },
        extractCredits: (data) => {
            const d = data?.data || data;
            const mi = d?.memberInfo || d?.member_info || {};
            const live = mi.liveCredit ?? mi.live_credit ?? 0;
            const paid = mi.evaluationCreditPaid ?? mi.evaluation_credit_paid ?? 0;
            const free = mi.evaluationCreditNoPaid ?? mi.evaluation_credit_no_paid ?? 0;
            const generic = mi.credit ?? d?.credit ?? 0;
            if (generic > 0 && live === 0 && paid === 0 && free === 0) return generic;
            return live + paid + free;
        },
        extractLoginStatus: (data) => {
            const d = data?.data || data;
            return d?.loginStatus ?? 1;
        },
        instructions: {
            zh: '1. 打开 https://muse.top 并登录\n2. 按 F12 打开开发者工具\n3. 切换到 Network(网络) 标签\n4. 在页面上任意点击一下\n5. 找到任意 API 请求，查看 Request Headers\n6. 复制 AuthToken 的值（以 eyJ 开头的长字符串）',
            en: '1. Open https://muse.top and log in\n2. Press F12 to open DevTools\n3. Go to Network tab\n4. Click anywhere on the page\n5. Find any API request, check Request Headers\n6. Copy the AuthToken value (starts with eyJ)',
        },
    },
    melo: {
        name: 'Melo AI',
        baseUrl: 'https://api.51melo.com',
        headerName: 'Authorization',
        headerFormat: 'Bearer', // header value is "Bearer <token>"
        validatePath: '/serv/api/v1/auth/me',
        validateMethod: 'GET',
        validateBody: null,
        validateHeaders: {},
        extractCredits: (data) => {
            const d = data?.data || data;
            return d?.credit ?? d?.credits ?? 0;
        },
        extractLoginStatus: (data) => {
            const d = data?.data || data;
            return d?.id ? 1 : 0;
        },
        instructions: {
            zh: '1. 打开 https://h.51melo.com 并登录\n2. 按 F12 打开开发者工具\n3. 切换到 Network(网络) 标签\n4. 在页面上任意点击一下\n5. 找到任意 API 请求，查看 Request Headers\n6. 复制 Authorization 的值（去掉 Bearer 前缀）',
            en: '1. Open https://h.51melo.com and log in\n2. Press F12 to open DevTools\n3. Go to Network tab\n4. Click anywhere on the page\n5. Find any API request, check Request Headers\n6. Copy the Authorization value (remove Bearer prefix)',
        },
    },
};

/**
 * Load the token store from disk.
 * @returns {object} { muse: { token, storedAt, validatedAt, ... }, melo: { ... } }
 */
function loadStore() {
    try {
        if (!existsSync(STORE_PATH)) return {};
        const raw = readFileSync(STORE_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        logger.warn(`Failed to load token store: ${e.message}`);
        return {};
    }
}

/**
 * Save the token store to disk.
 * @param {object} store
 */
function saveStore(store) {
    try {
        const dir = dirname(STORE_PATH);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
        logger.info('Token store saved');
    } catch (e) {
        logger.error(`Failed to save token store: ${e.message}`);
    }
}

/**
 * Decode a JWT payload (without verification) to extract expiry.
 * @param {string} token - JWT string
 * @returns {{ exp?: number, iat?: number, sub?: string } | null}
 */
function decodeJwt(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

/**
 * Check if a JWT token is expired based on its `exp` claim.
 * @param {string} token
 * @returns {{ expired: boolean, expiresAt?: number, daysLeft?: number }}
 */
function checkTokenExpiry(token) {
    const decoded = decodeJwt(token);
    if (!decoded?.exp) return { expired: false }; // no exp claim, assume valid
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = decoded.exp;
    const daysLeft = Math.floor((expiresAt - now) / 86400);
    return { expired: now >= expiresAt, expiresAt, daysLeft };
}

/**
 * Validate a token by calling the platform's user-info endpoint.
 * @param {string} platform - 'muse' or 'melo'
 * @param {string} token - JWT token
 * @returns {Promise<{ valid: boolean, credits?: number, loginStatus?: number, error?: string }>}
 */
async function validateToken(platform, token) {
    const cfg = PLATFORM_CONFIGS[platform];
    if (!cfg) return { valid: false, error: `Unknown platform: ${platform}` };
    if (!token || token.length < 20) return { valid: false, error: 'Token too short' };

    const url = `${cfg.baseUrl}${cfg.validatePath}`;
    const headers = {
        ...cfg.validateHeaders,
        [cfg.headerName]: cfg.headerFormat === 'Bearer' ? `Bearer ${token}` : token,
    };

    const fetchOptions = {
        method: cfg.validateMethod,
        headers,
        signal: AbortSignal.timeout(15000),
    };

    if (cfg.validateBody) {
        fetchOptions.body = JSON.stringify(cfg.validateBody(token));
    }

    try {
        const res = await fetch(url, fetchOptions);
        const raw = await res.text();

        // Check for HTML response (login page redirect)
        if (raw.trim().startsWith('<')) {
            return { valid: false, error: 'Platform returned HTML (token expired or invalid)' };
        }

        const data = JSON.parse(raw);

        // Muse: code === 0 means success, code === 1006 means login expired
        if (platform === 'muse') {
            if (data.code === 1006) return { valid: false, error: 'Login expired (code=1006)' };
            if (data.code !== 0 && data.code !== undefined) {
                return { valid: false, error: `API error: code=${data.code} msg=${data.msg || ''}` };
            }
        }

        // Melo: check for valid user data
        if (platform === 'melo') {
            if (!data.data && !data.id) return { valid: false, error: 'No user data returned' };
        }

        const credits = cfg.extractCredits(data);
        const loginStatus = cfg.extractLoginStatus(data);

        return { valid: true, credits, loginStatus, raw: data };
    } catch (e) {
        return { valid: false, error: e.message };
    }
}

// ===========================================================================
// Public API
// ===========================================================================

/**
 * Store a token for a platform.
 * @param {string} platform - 'muse' or 'melo'
 * @param {string} token - JWT token
 * @returns {Promise<{ success: boolean, credits?: number, error?: string }>}
 */
export async function storeToken(platform, token) {
    const cfg = PLATFORM_CONFIGS[platform];
    if (!cfg) return { success: false, error: `Unknown platform: ${platform}` };

    token = token.trim();

    // Validate the token before storing
    const validation = await validateToken(platform, token);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    const expiry = checkTokenExpiry(token);
    const store = loadStore();

    store[platform] = {
        token,
        storedAt: new Date().toISOString(),
        validatedAt: new Date().toISOString(),
        credits: validation.credits,
        loginStatus: validation.loginStatus,
        expired: expiry.expired,
        expiresAt: expiry.expiresAt || null,
        daysLeft: expiry.daysLeft ?? null,
    };

    saveStore(store);

    logger.info(
        `[${platform}] Token stored: credits=${validation.credits}` +
        ` loginStatus=${validation.loginStatus}` +
        ` expiresAt=${expiry.expiresAt || 'unknown'}` +
        ` daysLeft=${expiry.daysLeft ?? 'unknown'}`
    );

    return {
        success: true,
        credits: validation.credits,
        loginStatus: validation.loginStatus,
        expired: expiry.expired,
        expiresAt: expiry.expiresAt || null,
        daysLeft: expiry.daysLeft ?? null,
    };
}

/**
 * Get the stored token for a platform.
 * @param {string} platform - 'muse' or 'melo'
 * @returns {string|null}
 */
export function getToken(platform) {
    const store = loadStore();
    const entry = store[platform];
    if (!entry?.token) return null;

    // Check expiry
    const expiry = checkTokenExpiry(entry.token);
    if (expiry.expired) {
        logger.warn(`[${platform}] Stored token is expired`);
        return null;
    }

    return entry.token;
}

/**
 * Get the auth status for a platform.
 * @param {string} platform - 'muse' or 'melo'
 * @returns {Promise<object>}
 */
export async function getStatus(platform) {
    const cfg = PLATFORM_CONFIGS[platform];
    if (!cfg) return { configured: false, error: `Unknown platform: ${platform}` };

    const store = loadStore();
    const entry = store[platform];

    if (!entry?.token) {
        return {
            configured: false,
            hasToken: false,
            instructions: cfg.instructions,
        };
    }

    const expiry = checkTokenExpiry(entry.token);

    // Re-validate if last validation was > 5 minutes ago
    const lastValidated = entry.validatedAt ? new Date(entry.validatedAt).getTime() : 0;
    const needsRevalidation = Date.now() - lastValidated > 5 * 60 * 1000;

    if (needsRevalidation && !expiry.expired) {
        const validation = await validateToken(platform, entry.token);
        if (validation.valid) {
            // Update store with fresh validation results
            entry.credits = validation.credits;
            entry.loginStatus = validation.loginStatus;
            entry.validatedAt = new Date().toISOString();
            entry.expired = false;
            store[platform] = entry;
            saveStore(store);
        } else {
            entry.expired = true;
            entry.error = validation.error;
            store[platform] = entry;
            saveStore(store);
        }
    }

    return {
        configured: true,
        hasToken: true,
        tokenLength: entry.token.length,
        storedAt: entry.storedAt,
        validatedAt: entry.validatedAt,
        credits: entry.credits,
        loginStatus: entry.loginStatus,
        expired: entry.expired || expiry.expired,
        expiresAt: entry.expiresAt,
        daysLeft: entry.daysLeft,
        error: entry.error,
        instructions: cfg.instructions,
    };
}

/**
 * Get the HTTP header for a platform token.
 * @param {string} platform - 'muse' or 'melo'
 * @returns {{ headerName: string, headerValue: string } | null}
 */
export function getAuthHeader(platform) {
    const cfg = PLATFORM_CONFIGS[platform];
    if (!cfg) return null;

    const token = getToken(platform);
    if (!token) return null;

    return {
        headerName: cfg.headerName,
        headerValue: cfg.headerFormat === 'Bearer' ? `Bearer ${token}` : token,
    };
}

/**
 * Clear the stored token for a platform.
 * @param {string} platform
 */
export function clearToken(platform) {
    const store = loadStore();
    delete store[platform];
    saveStore(store);
    logger.info(`[${platform}] Token cleared`);
}

/**
 * List all supported platforms and their configs.
 * @returns {object}
 */
export function listPlatforms() {
    return Object.entries(PLATFORM_CONFIGS).map(([id, cfg]) => ({
        id,
        name: cfg.name,
        baseUrl: cfg.baseUrl,
        instructions: cfg.instructions,
    }));
}

export default {
    storeToken,
    getToken,
    getAuthHeader,
    getStatus,
    clearToken,
    listPlatforms,
    validateToken,
};
