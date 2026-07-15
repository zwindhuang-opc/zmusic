/**
 * History Controller
 * Handles generation history API endpoints
 */

import generationHistory from '../services/generation.history.js';
import Logger from '../utils/logger.js';

const logger = new Logger('HistoryController');

class HistoryController {
  getAll(req, res) {
    try {
      const type = req.query.type;
      const history = type ? generationHistory.getByType(type) : generationHistory.getAll();
      return res.json({ success: true, data: history });
    } catch (error) {
      logger.error('History get all error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  getStats(req, res) {
    try {
      const stats = generationHistory.getStats();
      return res.json({ success: true, data: stats });
    } catch (error) {
      logger.error('History stats error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  getById(req, res) {
    try {
      const id = req.params?.id || req.query.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID required' });
      }
      const item = generationHistory.get(id);
      if (!item) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      logger.error('History get by id error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  delete(req, res) {
    try {
      const id = req.params?.id || req.query.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID required' });
      }
      const success = generationHistory.remove(id);
      if (!success) {
        return res.status(404).json({ success: false, error: 'Item not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      logger.error('History delete error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  clear(req, res) {
    try {
      generationHistory.clear();
      return res.json({ success: true });
    } catch (error) {
      logger.error('History clear error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new HistoryController();