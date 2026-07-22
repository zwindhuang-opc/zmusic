/**
 * ZMusic API Client
 * Centralized API communication
 */

import { Capacitor } from '@capacitor/core';
import Logger from '../utils/logger.js';

const logger = new Logger('ApiClient');

let _isNativeMobile = null;

function checkNativePlatform() {
  if (_isNativeMobile !== null) return _isNativeMobile;

  if (typeof window === 'undefined') {
    _isNativeMobile = false;
    return _isNativeMobile;
  }

  if (Capacitor?.isNativePlatform?.()) {
    _isNativeMobile = true;
    return _isNativeMobile;
  }

  if (window.Capacitor?.isNativePlatform?.()) {
    _isNativeMobile = true;
    return _isNativeMobile;
  }

  const protocol = window.location.protocol;
  if (protocol === 'file:' || protocol === 'capacitor:') {
    _isNativeMobile = true;
    return _isNativeMobile;
  }

  if (protocol === 'http:' || protocol === 'https:') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      const userAgent = navigator.userAgent || '';
      if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) {
        _isNativeMobile = true;
        return _isNativeMobile;
      }
    }
  }

  _isNativeMobile = false;
  return _isNativeMobile;
}

export function isMobileEnvironment() {
  return checkNativePlatform();
}

function getApiBase() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  if (isMobileEnvironment()) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://10.0.2.2:5501/api';
    }
    return `http://${host}:5501/api`;
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('github.io')) {
      return 'https://z-music-z.netlify.app/api';
    }
    if (host.includes('vercel.app')) {
      return 'https://' + host + '/api';
    }
    if (host.includes('onrender.com')) {
      return 'https://' + host + '/api';
    }
    if (host.includes('netlify.app') || host === 'localhost' || host === '127.0.0.1') {
      return '/api';
    }
    if (host === '') {
      return '/api';
    }
    return '/api';
  }

  return '/api';
}

const API_BASE = getApiBase();

class ApiClient {
  async request(path, options = {}, signal) {
    const url = `${API_BASE}${path}`;

    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        logger.warn(`HTTP ${response.status}: ${errorText || 'Unknown error'} for ${url}`);
        return { success: false, error: `HTTP ${response.status}`, status: response.status };
      }

      const text = await response.text();
      if (!text) {
        logger.warn(`Empty response for ${url}`);
        return { success: false, error: 'Empty response' };
      }

      const result = JSON.parse(text);
      return result;

    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }

      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        logger.debug(`Backend unreachable: ${url}`);
      } else {
        logger.error(`Request failed: ${url} - ${error.message}`);
      }

      return { success: false, error: error.message };
    }
  }

  // Health
  health(signal) {
    return this.request('/health', {}, signal);
  }

  // Agent
  agentStatus(signal) {
    return this.request('/agent/status', {}, signal);
  }

  agentLyrics(params) {
    return this.request('/agent/lyrics', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  agentMV(params) {
    return this.request('/agent/mv', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Music
  generateMusic(params) {
    return this.request('/music/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  generateMusicAgent(params) {
    return this.request('/music/generate-agent', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Lyrics
  lyricsGenres() {
    return this.request('/lyrics/genres');
  }

  generateLyrics(params) {
    return this.request('/lyrics/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // MV
  mvGenres() {
    return this.request('/mv/genres');
  }

  generateMV(params) {
    return this.request('/mv/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Analytics
  analytics() {
    return this.request('/business/analytics');
  }
}

export default new ApiClient();
