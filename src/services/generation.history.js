/**
 * ZMusic Generation History Storage
 * Server-side file-based persistence for all generated content
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = path.join(__dirname, '../../.history');
const MAX_HISTORY_SIZE = 200;

if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

export class GenerationHistory {
  constructor() {
    this._history = this._load();
  }

  _load() {
    try {
      const files = fs.readdirSync(HISTORY_DIR);
      const entries = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          try {
            const content = fs.readFileSync(path.join(HISTORY_DIR, file), 'utf-8');
            return JSON.parse(content);
          } catch {
            return null;
          }
        })
        .filter(entry => entry)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return entries;
    } catch {
      return [];
    }
  }

  add(type, data) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      type,
      timestamp: new Date().toISOString(),
      ...data
    };

    const filePath = path.join(HISTORY_DIR, `${entry.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));

    this._history.unshift(entry);
    if (this._history.length > MAX_HISTORY_SIZE) {
      const oldEntries = this._history.slice(MAX_HISTORY_SIZE);
      oldEntries.forEach(old => {
        try {
          fs.unlinkSync(path.join(HISTORY_DIR, `${old.id}.json`));
        } catch {}
      });
      this._history = this._history.slice(0, MAX_HISTORY_SIZE);
    }

    return entry;
  }

  getAll() {
    return [...this._history];
  }

  getByType(type) {
    return this._history.filter(item => item.type === type);
  }

  get(id) {
    return this._history.find(item => item.id === id);
  }

  remove(id) {
    const index = this._history.findIndex(item => item.id === id);
    if (index !== -1) {
      const item = this._history[index];
      try {
        fs.unlinkSync(path.join(HISTORY_DIR, `${item.id}.json`));
      } catch {}
      this._history.splice(index, 1);
      return true;
    }
    return false;
  }

  clear() {
    const files = fs.readdirSync(HISTORY_DIR);
    files.filter(f => f.endsWith('.json')).forEach(f => {
      try {
        fs.unlinkSync(path.join(HISTORY_DIR, f));
      } catch {}
    });
    this._history = [];
  }

  getStats() {
    const stats = {
      total: this._history.length,
      lyrics: this.getByType('lyrics').length,
      music: this.getByType('music').length,
      mv: this.getByType('mv').length,
      commands: this.getByType('command').length,
      lastUpdated: this._history[0]?.timestamp || null
    };
    return stats;
  }
}

export default new GenerationHistory();