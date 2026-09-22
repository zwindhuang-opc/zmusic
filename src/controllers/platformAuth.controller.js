/**
 * Platform Auth Controller
 *
 * REST API endpoints for browser-agnostic platform token management.
 * Users can store, validate, check, and clear JWT tokens for Muse/Melo
 * from ANY browser or device — no CDP or Edge browser required.
 *
 * Endpoints:
 *   GET    /api/platform                  — list all platforms + status
 *   GET    /api/platform/:platform        — get auth status for one platform
 *   POST   /api/platform/:platform/token  — store + validate a new token
 *   DELETE /api/platform/:platform/token  — clear stored token
 *
 * @module controllers/platformAuth.controller
 */

import platformAuth from '../services/platformAuth.service.js';
import Logger from '../utils/logger.js';

const logger = new Logger('PlatformAuthController');

/**
 * GET /api/platform
 * List all supported platforms and their auth status.
 */
export async function listPlatforms(req, res) {
    try {
        const platforms = platformAuth.listPlatforms();
        const results = await Promise.all(
            platforms.map(async (p) => {
                const status = await platformAuth.getStatus(p.id);
                return { ...p, status };
            })
        );
        res.json({ success: true, data: results });
    } catch (e) {
        logger.error(`listPlatforms: ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
}

/**
 * GET /api/platform/:platform
 * Get auth status for a specific platform.
 */
export async function getPlatformStatus(req, res) {
    const { platform } = req.params;
    try {
        const status = await platformAuth.getStatus(platform);
        res.json({ success: true, data: status });
    } catch (e) {
        logger.error(`getPlatformStatus(${platform}): ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
}

/**
 * POST /api/platform/:platform/token
 * Store and validate a new token for a platform.
 * Body: { token: "eyJ..." }
 */
export async function storeToken(req, res) {
    const { platform } = req.params;
    const { token } = req.body || {};

    if (!token) {
        return res.status(400).json({ success: false, error: 'Token is required' });
    }

    try {
        const result = await platformAuth.storeToken(platform, token);
        if (result.success) {
            res.json({ success: true, data: result });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (e) {
        logger.error(`storeToken(${platform}): ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
}

/**
 * DELETE /api/platform/:platform/token
 * Clear the stored token for a platform.
 */
export async function clearToken(req, res) {
    const { platform } = req.params;
    try {
        platformAuth.clearToken(platform);
        res.json({ success: true, message: `Token cleared for ${platform}` });
    } catch (e) {
        logger.error(`clearToken(${platform}): ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
}

export default { listPlatforms, getPlatformStatus, storeToken, clearToken };
