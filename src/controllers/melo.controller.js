/**
 * MeloController - Backend proxy for Melo AI (字节旋律) music generation.
 *
 * ARCHITECTURE:
 *   - PRIMARY: Mock mode (MELO_MOCK=1 env var) since no Melo API key or CDP
 *     bridge is configured yet. Returns pre-built songs with simulated polling.
 *   - FUTURE: Will support direct API calls to Melo AI platform once API
 *     credentials are available.
 *
 * API CONTRACT (planned):
 *   Host:           https://melo.bytedance.com (TBD)
 *   Auth:           HTTP header with API key
 *   Response shape:  { code, msg, data, traceId }
 *
 * @module controllers/melo.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import { config } from '../config/index.js';
import Logger from '../utils/logger.js';

const logger = new Logger('MeloController');

/** Whether mock mode is active (env MELO_MOCK=1). Default: true until API is configured. */
const MELO_MOCK = config.meloMock !== false;

/** Whether Melo AI is configured (API key present). */
const MELO_CONFIGURED = Boolean(config.meloApiKey);

/** Melo API host (placeholder until confirmed). */
const MELO_HOST = (config.meloBaseUrl || 'https://melo.bytedance.com').replace(/\/+$/, '');

/** In-memory state for each mock task: how many times it has been polled. */
const mockTaskState = new Map();

/** Fake "completed" songs used by the mock. */
const MOCK_SONGS = [
  {
    title: '夜雨探戈',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    imageUrl: 'https://picsum.photos/seed/melo1/400/400',
    duration: 372,
    userName: 'ZMusic Melo',
    bpm: 120,
    key: 'C',
    timeSignature: '3/4',
  },
  {
    title: '孤月重影',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    imageUrl: 'https://picsum.photos/seed/melo2/400/400',
    duration: 425,
    userName: 'ZMusic Melo',
    bpm: 128,
    key: 'Am',
    timeSignature: '4/4',
  },
  {
    title: '流光序曲',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    imageUrl: 'https://picsum.photos/seed/melo3/400/400',
    duration: 346,
    userName: 'ZMusic Melo',
    bpm: 100,
    key: 'G',
    timeSignature: '4/4',
  },
  {
    title: '霓虹街角',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    imageUrl: 'https://picsum.photos/seed/melo4/400/400',
    duration: 298,
    userName: 'ZMusic Melo',
    bpm: 140,
    key: 'Dm',
    timeSignature: '4/4',
  },
  {
    title: '晨光低语',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    imageUrl: 'https://picsum.photos/seed/melo5/400/400',
    duration: 412,
    userName: 'ZMusic Melo',
    bpm: 85,
    key: 'F',
    timeSignature: '6/8',
  },
];

const MOCK_POLL_THRESHOLD = 3;

// ===========================================================================
// MOCK MODE — simulate Melo AI generation
// ===========================================================================

function mockGenerate(params) {
  const taskId = `melo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const songIdx = Math.floor(Math.random() * MOCK_SONGS.length);
  mockTaskState.set(taskId, { polls: 0, createdAt: Date.now(), songIdx, params });
  logger.info(`[MOCK] melo generate → taskId=${taskId}`);
  return { taskId, status: 'pending', mock: true };
}

function mockQueryTask(taskId) {
  let state = mockTaskState.get(taskId);
  if (!state) {
    const song = MOCK_SONGS[0];
    return {
      status: 'success',
      title: song.title,
      audioUrl: song.audioUrl,
      imageUrl: song.imageUrl,
      duration: song.duration,
      taskId,
      mock: true,
    };
  }
  state.polls += 1;
  const song = MOCK_SONGS[state.songIdx] || MOCK_SONGS[0];
  if (state.polls < MOCK_POLL_THRESHOLD) {
    return {
      status: 'processing',
      progress: Math.round((state.polls / MOCK_POLL_THRESHOLD) * 100),
      taskId,
      mock: true,
    };
  }
  mockTaskState.delete(taskId);
  return {
    status: 'success',
    title: state.params?.title || song.title,
    audioUrl: song.audioUrl,
    imageUrl: song.imageUrl,
    duration: song.duration,
    bpm: state.params?.bpm || song.bpm,
    key: state.params?.key || song.key,
    timeSignature: state.params?.timeSignature || song.timeSignature,
    taskId,
    mock: true,
  };
}

// ===========================================================================
// MeloController class
// ===========================================================================

export class MeloController {
  /**
   * GET /api/melo/status
   * Reports configuration status.
   */
  async status(req, res) {
    const isAvailable = MELO_CONFIGURED || MELO_MOCK;
    return res.json({
      success: true,
      data: {
        configured: isAvailable,
        apiConfigured: MELO_CONFIGURED,
        mock: MELO_MOCK,
        available: isAvailable,
        host: MELO_HOST,
        engine: 'Melo AI',
        features: {
          lyricsGeneration: true,
          styleTags: true,
          multiLayer: true,
          referenceAudio: false,
          advancedControls: true,
        },
      },
    });
  }

  /**
   * GET /api/melo/user
   * Fetch user profile + credit balance.
   */
  async getUser(req, res) {
    if (MELO_MOCK) {
      return res.json({
        success: true,
        data: {
          userId: 'mock-melo-user',
          nickname: 'ZMusic Melo',
          credits: 50,
          totalGenerations: 0,
          memberLevel: 'free',
          subscription: {
            dailyCredit: 50,
            dailyCreditMax: 200,
            expired: false,
          },
        },
        mock: true,
      });
    }

    if (!MELO_CONFIGURED) {
      return res.status(503).json({
        success: false,
        error: 'Melo AI API not configured. Set MELO_API_KEY in environment.',
      });
    }

    try {
      const response = await fetch(`${MELO_HOST}/api/v1/user/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.meloApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return res.json({ success: true, data: data?.data || data });
    } catch (e) {
      logger.error(`[getUser] Error: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /api/melo/generate
   * Generate a song via Melo AI.
   *
   * Body: {
   *   lyrics, title, styleTags, bpm, key, timeSignature,
   *   structure, referenceAudio, audioWeight, layers
   * }
   */
  async generate(req, res) {
    const {
      lyrics = '',
      title = '',
      styleTags = [],
      bpm = 120,
      key = 'C',
      timeSignature = '4/4',
      structure = '',
      audioWeight = 0.5,
      layers = {},
    } = req.body || {};

    if (!lyrics || lyrics.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: '歌词不能为空，至少需要5个字符',
      });
    }

    if (MELO_MOCK) {
      const mockResult = mockGenerate({
        lyrics,
        title,
        styleTags,
        bpm,
        key,
        timeSignature,
        structure,
        audioWeight,
        layers,
      });
      return res.json({ success: true, data: mockResult, mock: true });
    }

    if (!MELO_CONFIGURED) {
      return res.status(503).json({
        success: false,
        error: 'Melo AI API not configured. Set MELO_API_KEY in environment.',
      });
    }

    try {
      const response = await fetch(`${MELO_HOST}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.meloApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics,
          title,
          style_tags: styleTags,
          bpm,
          key,
          time_signature: timeSignature,
          structure,
          audio_weight: audioWeight,
          layers,
        }),
      });
      const data = await response.json();

      if (data?.code !== 0 && data?.code !== undefined) {
        return res.status(502).json({
          success: false,
          error: data.msg || `Melo code ${data.code}`,
          code: data.code,
          traceId: data.traceId,
        });
      }

      return res.json({ success: true, data: data?.data, traceId: data?.traceId });
    } catch (e) {
      logger.error(`[generate] Error: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/melo/task/:id
   * Poll generation task status.
   */
  async queryTask(req, res) {
    const taskId = req.params?.id || req.params?.taskId;
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task id required',
      });
    }

    if (MELO_MOCK) {
      return res.json({ success: true, data: mockQueryTask(taskId), mock: true });
    }

    if (!MELO_CONFIGURED) {
      return res.status(503).json({
        success: false,
        error: 'Melo AI API not configured.',
      });
    }

    try {
      const response = await fetch(`${MELO_HOST}/api/v1/task/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.meloApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data?.code !== 0 && data?.code !== undefined) {
        return res.status(502).json({
          success: false,
          error: data.msg || `Melo code ${data.code}`,
          code: data.code,
        });
      }

      return res.json({ success: true, data: data?.data });
    } catch (e) {
      logger.error(`[queryTask] Error: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }
}

export default new MeloController();