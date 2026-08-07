/**
 * Application Configuration
 * Central configuration management
 * Supports both Node.js (server) and browser (Vite) environments
 */

// Browser-safe env access (Vite exposes VITE_ prefixed vars via import.meta.env)
const browserEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const nodeEnv = typeof process !== 'undefined' && process.env ? process.env : {};

export const config = {
  port: parseInt(nodeEnv.PORT || '5500'),
  host: nodeEnv.HOST || 'localhost',
  sunoApiKey: browserEnv.VITE_SUNO_CN_API_KEY || nodeEnv.SUNO_CN_API_KEY || '',
  sunoBaseUrl: browserEnv.VITE_SUNO_BASE_URL || nodeEnv.SUNO_BASE_URL || 'https://mcp.suno.cn',
  museApiKey: browserEnv.VITE_MUSE_AI_API_KEY || nodeEnv.MUSE_AI_API_KEY || '',
  museBaseUrl: browserEnv.VITE_MUSE_BASE_URL || nodeEnv.MUSE_BASE_URL || 'https://muse.ai/api',
  hfToken: browserEnv.VITE_HF_TOKEN || nodeEnv.HF_TOKEN || '',
  env: browserEnv.MODE || nodeEnv.NODE_ENV || 'development',
  corsOrigin: nodeEnv.CORS_ORIGIN || '*'
};

export default config;
