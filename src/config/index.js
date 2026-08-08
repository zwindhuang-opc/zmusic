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
  museApiKey: browserEnv.VITE_MUSE_API_KEY || nodeEnv.MUSE_API_KEY || nodeEnv.MUSE_AI_API_KEY || '',
  museAppKey: nodeEnv.MUSE_APP_KEY || nodeEnv.MUSE_APP_KEY_PUBLIC || '8e33a5e60ef347df808d14026f27d227',
  museBaseUrl: browserEnv.VITE_MUSE_BASE_URL || nodeEnv.MUSE_BASE_URL || 'https://project-api.atmob.com',
  museMock: nodeEnv.MUSE_MOCK === '1' || nodeEnv.MUSE_MOCK === 'true',
  meloApiKey: browserEnv.VITE_MELO_API_KEY || nodeEnv.MELO_API_KEY || '',
  meloBaseUrl: browserEnv.VITE_MELO_BASE_URL || nodeEnv.MELO_BASE_URL || 'https://melo.bytedance.com',
  meloMock: nodeEnv.MELO_MOCK !== '0' && nodeEnv.MELO_MOCK !== 'false',
  hfToken: browserEnv.VITE_HF_TOKEN || nodeEnv.HF_TOKEN || '',
  env: browserEnv.MODE || nodeEnv.NODE_ENV || 'development',
  corsOrigin: nodeEnv.CORS_ORIGIN || '*'
};

export default config;
