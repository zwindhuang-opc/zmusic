/**
 * ContentController — Database-driven content API
 * 
 * Serves all configurable content from SQLite via REST endpoints.
 * Frontend fetches from these endpoints instead of using hardcoded arrays.
 */

import contentService from '../services/content.service.js';

export class ContentController {
  async getAll(req, res) {
    try {
      const data = contentService.getAll();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async getGenres(req, res) {
    try {
      const data = contentService.getGenres();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async getSceneTemplates(req, res) {
    try {
      const data = contentService.getSceneTemplates();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async getAIVideoTools(req, res) {
    try {
      const data = contentService.getAIVideoTools();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async getEffects(req, res) {
    try {
      const data = contentService.getEffects();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async getStylePalettes(req, res) {
    try {
      const data = contentService.getStylePalettes();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  async getMusicStyles(req, res) {
    try {
      const data = contentService.getMusicStyles();
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new ContentController();