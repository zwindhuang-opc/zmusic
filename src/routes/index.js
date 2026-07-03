/**
 * Routes Index - Central route registry
 * Part of MVC architecture
 */

import healthController from '../controllers/health.controller.js';
import musicController from '../controllers/music.controller.js';
import lyricsController from '../controllers/lyrics.controller.js';
import mvController from '../controllers/mv.controller.js';
import agentController from '../controllers/agent.controller.js';
import Logger from '../utils/logger.js';

const logger = new Logger('Routes');

/**
 * Route registration function
 * @param {http.ServerResponse} res - HTTP response object
 * @param {URL} url - Parsed URL
 * @param {string} method - HTTP method
 * @param {object} body - Request body (parsed)
 */
export async function handleRoute(req, res, url, method, body) {
  const path = url.pathname;

  // Health endpoints
  if (path === '/api/health' && method === 'GET') {
    return healthController.health(req, res);
  }

  if (path === '/api/business/analytics' && method === 'GET') {
    return healthController.analytics(req, res);
  }

  // Agent endpoints
  if (path === '/api/agent/status' && method === 'GET') {
    return agentController.getStatus(req, res);
  }

  if (path === '/api/agent/lyrics' && method === 'POST') {
    req.body = body;
    return agentController.generateLyrics(req, res);
  }

  if (path === '/api/agent/mv' && method === 'POST') {
    req.body = body;
    return agentController.generateMV(req, res);
  }

  // Music endpoints
  if (path === '/api/music/generate' && method === 'POST') {
    req.body = body;
    return musicController.generate(req, res);
  }

  if (path === '/api/music/generate-agent' && method === 'POST') {
    req.body = body;
    return musicController.generateAgent(req, res);
  }

  // Lyrics endpoints
  if (path === '/api/lyrics/genres' && method === 'GET') {
    return lyricsController.getGenres(req, res);
  }

  if (path === '/api/lyrics/generate' && method === 'POST') {
    req.body = body;
    return lyricsController.generate(req, res);
  }

  if (path === '/api/lyrics/generate-agent' && method === 'POST') {
    req.body = body;
    return agentController.generateLyrics(req, res);
  }

  // MV endpoints
  if (path === '/api/mv/genres' && method === 'GET') {
    return mvController.getGenres(req, res);
  }

  if (path === '/api/mv/generate' && method === 'POST') {
    req.body = body;
    return mvController.generate(req, res);
  }

  if (path === '/api/mv/generate-agent' && method === 'POST') {
    req.body = body;
    return agentController.generateMV(req, res);
  }

  // 404
  return res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path
  });
}

export default handleRoute;
