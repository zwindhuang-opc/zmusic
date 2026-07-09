/**
 * ZMusic API Client
 * Centralized API communication
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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
        return { success: false, error: `HTTP ${response.status}` };
      }
      const text = await response.text();
      if (!text) {
        return { success: false, error: 'Empty response' };
      }
      return JSON.parse(text);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
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
