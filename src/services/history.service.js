/**
 * ZMusic History Service
 * Persistent storage for generated content (lyrics, music, MV, commands)
 * Works offline using localStorage/Web Storage
 */

import Logger from '../utils/logger.js';

const logger = new Logger('HistoryService');

const STORAGE_KEY = 'zmusic_history';
const MAX_HISTORY_SIZE = 100;

export const HistoryType = {
  LYRICS: 'lyrics',
  MUSIC: 'music',
  MV: 'mv',
  COMMAND: 'command'
};

export class HistoryService {
  constructor() {
    this._history = this._load();
  }

  _load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load history:', error);
    }
    return [];
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._history));
    } catch (error) {
      logger.error('Failed to save history:', error);
    }
  }

  add(item) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      ...item
    };

    this._history.unshift(entry);

    if (this._history.length > MAX_HISTORY_SIZE) {
      this._history = this._history.slice(0, MAX_HISTORY_SIZE);
    }

    this._save();
    logger.info(`Added ${item.type} history entry: ${item.title || 'Untitled'}`);
    return entry;
  }

  addLyrics(result, params) {
    return this.add({
      type: HistoryType.LYRICS,
      title: `Lyrics - ${params.style || 'Unknown'} + ${params.theme || 'Unknown'}`,
      style: params.style,
      theme: params.theme,
      complexity: params.complexity,
      language: params.language,
      lyrics: result.lyrics,
      commands: result.commands,
      layers: result.layers,
      params: params,
      result: result
    });
  }

  addMusic(result, params) {
    return this.add({
      type: HistoryType.MUSIC,
      title: `Music - ${params.style || 'Unknown'} + ${params.theme || 'Unknown'}`,
      style: params.style,
      theme: params.theme,
      mood: params.mood,
      audioUrl: result.audioUrl || result.url,
      coverUrl: result.coverUrl || result.cover,
      commands: result.commands,
      params: params,
      result: result
    });
  }

  addMV(result, params) {
    return this.add({
      type: HistoryType.MV,
      title: `MV - ${params.style || 'Unknown'} + ${params.theme || 'Unknown'}`,
      style: params.style,
      theme: params.theme,
      videoUrl: result.videoUrl || result.url,
      thumbnailUrl: result.thumbnailUrl || result.thumbnail,
      commands: result.commands,
      params: params,
      result: result
    });
  }

  addCommand(command, type) {
    return this.add({
      type: HistoryType.COMMAND,
      title: `Command - ${type}`,
      commandType: type,
      command: command
    });
  }

  getAll() {
    return [...this._history];
  }

  getByType(type) {
    return this._history.filter(item => item.type === type);
  }

  getByStyle(style) {
    return this._history.filter(item => item.style === style);
  }

  getByTheme(theme) {
    return this._history.filter(item => item.theme === theme);
  }

  get(id) {
    return this._history.find(item => item.id === id);
  }

  remove(id) {
    const index = this._history.findIndex(item => item.id === id);
    if (index !== -1) {
      this._history.splice(index, 1);
      this._save();
      return true;
    }
    return false;
  }

  clear() {
    this._history = [];
    this._save();
    logger.info('History cleared');
  }

  getStats() {
    const stats = {
      total: this._history.length,
      lyrics: this.getByType(HistoryType.LYRICS).length,
      music: this.getByType(HistoryType.MUSIC).length,
      mv: this.getByType(HistoryType.MV).length,
      commands: this.getByType(HistoryType.COMMAND).length,
      lastUpdated: this._history[0]?.timestamp || null
    };
    return stats;
  }

  getRecent(count = 10) {
    return this._history.slice(0, count);
  }
}

export default new HistoryService();