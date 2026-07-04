/**
 * ZMusic API Client
 * Centralized API communication
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  async request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    return await response.json();
  }

  // Health
  health() {
    return this.request('/health');
  }

  // Agent
  agentStatus() {
    return this.request('/agent/status');
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
