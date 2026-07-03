/**
 * Application Configuration
 * Central configuration management
 */

export const config = {
  port: parseInt(process.env.PORT || '5500'),
  host: process.env.HOST || 'localhost',
  sunoApiKey: process.env.SUNO_CN_API_KEY || '',
  sunoBaseUrl: process.env.SUNO_BASE_URL || 'https://mcp.suno.cn',
  museApiKey: process.env.MUSE_AI_API_KEY || '',
  museBaseUrl: process.env.MUSE_BASE_URL || 'https://muse.ai/api',
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

export default config;
