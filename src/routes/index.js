/**
 * Routes Index - Central route registry
 * Part of MVC architecture
 */

import healthController from '../controllers/health.controller.js';
import musicController from '../controllers/music.controller.js';
import lyricsController from '../controllers/lyrics.controller.js';
import mvController from '../controllers/mv.controller.js';
import agentController from '../controllers/agent.controller.js';
import historyController from '../controllers/history.controller.js';
import sunoController from '../controllers/suno.controller.js';
import freemusicController from '../controllers/freemusic.controller.js';
import visionController from '../controllers/vision.controller.js';
import museController from '../controllers/muse.controller.js';
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

  // Vision endpoints
  if (path === '/api/vision/analyze' && method === 'POST') {
    req.body = body;
    return visionController.analyze(req, res);
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

  // History endpoints
  if (path === '/api/history' && method === 'GET') {
    return historyController.getAll(req, res);
  }

  if (path === '/api/history/stats' && method === 'GET') {
    return historyController.getStats(req, res);
  }

  const historyIdMatch = path.match(/^\/api\/history\/(.+)$/);
  if (historyIdMatch && method === 'GET') {
    req.params = { id: historyIdMatch[1] };
    return historyController.getById(req, res);
  }

  if (historyIdMatch && method === 'DELETE') {
    req.params = { id: historyIdMatch[1] };
    return historyController.delete(req, res);
  }

  if (path === '/api/history/clear' && method === 'POST') {
    req.body = body;
    return historyController.clear(req, res);
  }

  // Suno proxy endpoints (must be before 404)
  const sunoMatch = path.match(/^\/api\/suno\/(.+)$/);
  if (sunoMatch) {
    const subPath = sunoMatch[1];

    if (subPath === 'user' && method === 'GET') {
      return sunoController.getUser(req, res);
    }

    if (subPath === 'generate' && method === 'POST') {
      req.body = body;
      return sunoController.generate(req, res);
    }

    const taskMatch = subPath.match(/^task\/(.+)$/);
    if (taskMatch && method === 'GET') {
      req.params = { serialNo: taskMatch[1] };
      req.query = url.searchParams;
      return sunoController.queryTask(req, res);
    }

    if (subPath === 'gen-lyrics' && method === 'POST') {
      req.body = body;
      return sunoController.generateLyrics(req, res);
    }

    if (subPath === 'music' && method === 'GET') {
      req.query = url.searchParams;
      return sunoController.getMusicList(req, res);
    }
  }

  // Free music endpoints (100% free, no paid APIs)
  const freemusicMatch = path.match(/^\/api\/freemusic\/(.+)$/);
  if (freemusicMatch) {
    const subPath = freemusicMatch[1];

    if (subPath === 'generate' && method === 'POST') {
      req.body = body;
      return freemusicController.generate(req, res);
    }

    if (subPath === 'voices' && method === 'GET') {
      return freemusicController.listVoices(req, res);
    }

    if (subPath === 'status' && method === 'GET') {
      return freemusicController.status(req, res);
    }
  }

  // Muse (muse.top) endpoints - real song generation with vocals
  const museMatch = path.match(/^\/api\/muse\/(.+)$/);
  if (museMatch) {
    const subPath = museMatch[1];

    if (subPath === 'status' && method === 'GET') {
      return museController.status(req, res);
    }

    if (subPath === 'user' && method === 'GET') {
      return museController.getUser(req, res);
    }

    if (subPath === 'styles' && method === 'GET') {
      return museController.getStyles(req, res);
    }

    if (subPath === 'fast-config' && method === 'GET') {
      return museController.getFastConfig(req, res);
    }

    if (subPath === 'master-config' && method === 'GET') {
      return museController.getMasterConfig(req, res);
    }

    if (subPath === 'templates' && method === 'GET') {
      return museController.getTemplates(req, res);
    }

    if (subPath === 'explore' && method === 'GET') {
      // Express 5 makes req.query a read-only getter, so pass the URLSearchParams
      // via a plain object on a custom property.
      const params = {};
      url.searchParams.forEach((v, k) => { params[k] = v; });
      req.museQuery = params;
      return museController.getExplore(req, res);
    }

    if (subPath === 'generate' && method === 'POST') {
      req.body = body;
      return museController.generate(req, res);
    }

    const taskMatch = subPath.match(/^task\/(.+)$/);
    if (taskMatch && method === 'GET') {
      req.params = { id: taskMatch[1] };
      return museController.queryTask(req, res);
    }
  }

  // 404
  return res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path
  });
}

export default handleRoute;
