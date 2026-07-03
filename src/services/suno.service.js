/**
 * SunoService - Real Suno.cn API Integration
 * 
 * This service handles all communication with the Suno.cn AI music generation API.
 * It provides methods for generating music, querying task status, generating lyrics,
 * and retrieving music lists.
 * 
 * API Documentation: https://mcp.suno.cn
 * 
 * @module services/suno.service
 * @version 1.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Logger instance for this service
 * @type {Logger}
 */
const logger = new Logger('SunoService');

/**
 * Base URL for Suno.cn API
 * @constant {string}
 */
const SUNO_BASE_URL = 'https://mcp.suno.cn';

/**
 * SunoService class - Handles all Suno.cn API interactions
 * 
 * @class SunoService
 * @description Provides methods to interact with Suno.cn AI music generation service
 */
export class SunoService {
  /**
   * Creates an instance of SunoService
   * 
   * @constructor
   * @description Initializes the service with API key and base URL from configuration
   */
  constructor() {
    /**
     * API key for authentication
     * @type {string}
     * @private
     */
    this.apiKey = config.sunoApiKey;

    /**
     * Base URL for API endpoints
     * @type {string}
     * @private
     */
    this.baseUrl = SUNO_BASE_URL;

    logger.info('SunoService initialized successfully');
  }

  /**
   * Check if the service is properly configured
   * 
   * @method isConfigured
   * @description Validates that API key is present and has correct format
   * @returns {boolean} True if API key is configured and valid, false otherwise
   * 
   * @example
   * if (sunoService.isConfigured()) {
   *   // Proceed with API calls
   * } else {
   *   // Show configuration error
   * }
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.length > 0 && this.apiKey.startsWith('sk-'));
  }

  /**
   * Get user account information from Suno.cn
   * 
   * @method getUserInfo
   * @async
   * @description Retrieves the current user's account information including credits and membership status
   * @returns {Promise<Object>} User account information object
   * @throws {Error} If API key is not configured or API request fails
   * 
   * @example
   * try {
   *   const userInfo = await sunoService.getUserInfo();
   *   console.log('User credits:', userInfo.credits);
   * } catch (error) {
   *   console.error('Failed to get user info:', error.message);
   * }
   */
  async getUserInfo() {
    if (!this.isConfigured()) {
      throw new Error('Suno API key not configured. Set SUNO_CN_API_KEY in .env file.');
    }

    const response = await fetch(`${this.baseUrl}/mcp/api/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API Error: ${response.status} - ${errorText}`);
      throw new Error(`Suno API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Generate music using Suno.cn API
   * 
   * @method generateMusic
   * @async
   * @description Submits a music generation request to Suno.cn API
   * @param {string} prompt - Music description or lyrics (max 3000 characters)
   * @param {string} [style=''] - Music style tags (e.g., 'pop,electronic')
   * @param {number} [duration=60] - Target duration in seconds
   * @param {boolean} [customMode=false] - Whether to use custom lyrics mode
   * @param {boolean} [instrumental=false] - Whether to generate instrumental only
   * @returns {Promise<Object>} Generation result with taskId and status
   * @throws {Error} If API key is not configured or API request fails
   * 
   * @example
   * const result = await sunoService.generateMusic(
   *   'A happy pop song about summer',
   *   'pop,upbeat',
   *   120,
   *   false,
   *   false
   * );
   * console.log('Task ID:', result.taskId);
   */
  async generateMusic(prompt, style = '', duration = 60, customMode = false, instrumental = false) {
    if (!this.isConfigured()) {
      throw new Error('Suno API key not configured. Set SUNO_CN_API_KEY in .env file.');
    }

    logger.info(`Generating music: ${prompt.substring(0, 50)}...`);

    const requestBody = {
      prompt: prompt,
      mv: 'chirp-fenix', // v5.5 model
      tags: style || undefined,
      custom_mode: customMode,
      instrumental: instrumental,
      wait_audio: false
    };

    const response = await fetch(`${this.baseUrl}/mcp/api/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Generate Error: ${response.status} - ${errorText}`);

      if (response.status === 401 || response.status === 403) {
        throw new Error('API Key invalid or expired');
      }
      throw new Error(`Suno API error: ${response.status}`);
    }

    const data = await response.json();
    logger.info(`Task submitted: ${data.serial_nos?.join(',')}`);

    return {
      success: true,
      taskId: data.serial_nos?.[0] || `task_${Date.now()}`,
      serialNos: data.serial_nos || [],
      message: data.message || 'Submitted',
      status: 'submitted',
      estimatedTime: 60
    };
  }

  /**
   * Query the status of a music generation task
   * 
   * @method queryTaskStatus
   * @async
   * @description Retrieves the current status and results of a previously submitted generation task
   * @param {string} serialNo - Task serial number returned from generateMusic
   * @param {boolean} [wait=false] - Whether to wait for task completion (adds wait=45 parameter)
   * @returns {Promise<Object>} Task status object with success, taskId, status, and results
   * @throws {Error} If API key is not configured or API request fails
   * 
   * @example
   * const status = await sunoService.queryTaskStatus('task_123456', true);
   * if (status.success && status.status === 'completed') {
   *   console.log('Audio URL:', status.audioUrl);
   * }
   */
  async queryTaskStatus(serialNo, wait = false) {
    if (!this.isConfigured()) {
      throw new Error('Suno API key not configured');
    }

    const waitParam = wait ? '?wait=45' : '';
    const response = await fetch(`${this.baseUrl}/mcp/api/task/${serialNo}${waitParam}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Query Error: ${response.status} - ${errorText}`);
      throw new Error(`Query error: ${response.status}`);
    }

    const data = await response.json();
    const tasks = data.tasks || [];

    if (tasks.length > 0) {
      const task = tasks[0];
      return {
        success: true,
        taskId: task.serial_no,
        status: task.status,
        title: task.title,
        duration: task.duration,
        audioUrl: task.play_url,
        failReason: task.fail_msg_show
      };
    }

    return {
      success: false,
      status: 'unknown',
      taskId: serialNo
    };
  }

  /**
   * Generate lyrics using Suno AI
   * @param {string} inspiration - Theme/inspiration
   * @param {string} style - Style hint
   */
  async generateLyrics(inspiration, style = '') {
    if (!this.isConfigured()) {
      throw new Error('Suno API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/mcp/api/gen-lyrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        inspiration: inspiration,
        style: style || undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Lyrics Error: ${response.status} - ${errorText}`);
      throw new Error(`Lyrics generation error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      lyrics: data.lyrics
    };
  }

  /**
   * Get music list
   */
  async getMusicList(page = 1, pageSize = 10) {
    if (!this.isConfigured()) {
      return { list: [], page: 1 };
    }

    const response = await fetch(`${this.baseUrl}/mcp/api/music?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`List error: ${response.status}`);
    }

    return await response.json();
  }
}

export default new SunoService();