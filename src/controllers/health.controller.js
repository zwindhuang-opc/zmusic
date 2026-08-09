/**
 * HealthController - 系统健康检查与信息端点控制器
 * 
 * 本控制器提供系统健康状态检查和业务分析数据接口。
 * 作为MVC架构中的控制器层，负责处理系统级请求。
 * 
 * @module controllers/health.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import sunoService from '../services/suno.service.js';
import museService from '../services/muse.service.js';
import meloService from '../services/melo.service.js';
import { getServiceStatusSummary, clearCache as clearBrowserCache } from '../services/browserStatus.service.js';
import Logger from '../utils/logger.js';
import { config } from '../config/index.js';
import fs from 'fs';
import path from 'path';

const _currentDir = (() => {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
  } catch (e) { /* ignore */ }
  return process.cwd();
})();

function loadVersionFile() {
  const candidates = [
    path.join(_currentDir, '../../VERSION.json'),
    path.join(_currentDir, '../VERSION.json'),
    path.join(_currentDir, 'VERSION.json'),
    path.join(process.cwd(), 'VERSION.json'),
    path.join(process.cwd(), 'netlify/functions/api/VERSION.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch (e) {
      // try next
    }
  }
  return { version: '5.5.5', build: 22, date: new Date().toISOString().split('T')[0] };
}

const versionFile = loadVersionFile();

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('HealthController');

/**
 * 健康检查控制器类
 * 
 * 提供系统健康状态、配置信息和业务分析数据的API端点。
 * 
 * @class HealthController
 */
export class HealthController {
  /**
   * GET /api/health - 获取系统健康状态
   * 
   * 返回系统运行状态、版本信息、配置状态和可用端点列表。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 系统健康状态JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {string} returns.status - 系统状态 ('healthy')
   * @returns {string} returns.version - 系统版本号
   * @returns {number} returns.uptime - 系统运行时间（秒）
   * @returns {number} returns.port - 服务端口号
   * @returns {boolean} returns.apiConfigured - Suno API是否已配置
   * @returns {boolean} returns.museConfigured - Muse API是否已配置
   * @returns {string} returns.architecture - 架构模式名称
   * @returns {string[]} returns.layers - 架构层级列表
   * @returns {string[]} returns.endpoints - 可用API端点列表
   */
  async health(req, res) {
    // Try to get real-time service status from Edge browser (CDP)
    // This detects which music services the user is logged into in Edge
    let browserStatus = null;
    let edgeConnected = false;
    let browserMuse = false;
    let browserSuno = false;
    let browserMelo = false;

    try {
      const summary = await getServiceStatusSummary();
      edgeConnected = summary.edgeConnected;
      browserMuse = summary.museConfigured;
      browserSuno = summary.sunoConfigured;
      browserMelo = summary.meloConfigured;
      browserStatus = summary.browserStatus;
    } catch (e) {
      // Browser check failed - fall back to config-based status
      logger.warn(`[Health] Browser status check failed: ${e.message}`);
    }

    // Get config-based status (API keys)
    const configMuse = museService.isConfigured();
    const configSuno = sunoService.isConfigured();
    const configMelo = meloService.isConfigured();

    // Use browser-detected status if available, otherwise config-based
    // A service is "configured" if either the browser shows login OR we have an API key
    const museConfigured = browserMuse || configMuse;
    const sunoConfigured = browserSuno || configSuno;
    const meloConfigured = browserMelo || configMelo;

    return res.json({
      success: true,
      status: 'healthy',
      version: versionFile.version,
      uptime: Math.floor(process.uptime()),
      port: config.port,
      apiConfigured: sunoConfigured,
      museConfigured,
      meloConfigured,
      architecture: 'MVC Pattern',
      layers: ['Model', 'View', 'Controller', 'Service', 'Agent'],
      browser: {
        connected: edgeConnected,
        port: 9222,
        services: browserStatus ? {
          muse: browserStatus.services?.muse ? {
            tabFound: browserStatus.services.muse.tabFound,
            loginDetected: browserStatus.services.muse.loginDetected,
            loginSource: browserStatus.services.muse.loginSource,
          } : null,
          suno: browserStatus.services?.suno ? {
            tabFound: browserStatus.services.suno.tabFound,
            loginDetected: browserStatus.services.suno.loginDetected,
            loginSource: browserStatus.services.suno.loginSource,
          } : null,
          melo: browserStatus.services?.melo ? {
            tabFound: browserStatus.services.melo.tabFound,
            loginDetected: browserStatus.services.melo.loginDetected,
            loginSource: browserStatus.services.melo.loginSource,
          } : null,
        } : null,
      },
      endpoints: [
        'GET  /api/health',
        'GET  /api/agent/status',
        'POST /api/music/generate',
        'POST /api/music/generate-agent',
        'POST /api/lyrics/generate',
        'POST /api/lyrics/generate-agent',
        'POST /api/mv/generate',
        'POST /api/mv/generate-agent',
        'GET  /api/lyrics/genres',
        'GET  /api/mv/genres'
      ]
    });
  }

  /**
   * GET /api/business/analytics - 获取业务分析数据
   * 
   * 返回系统使用统计数据，包括活跃用户数、积分和生成内容计数。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 业务分析数据JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - 分析数据对象
   * @returns {number} returns.data.activeUsers - 活跃用户数
   * @returns {number} returns.data.totalCredits - 总积分
   * @returns {number} returns.data.songsGenerated - 已生成歌曲数
   * @returns {number} returns.data.lyricsGenerated - 已生成歌词数
   * @returns {number} returns.data.mvGenerated - 已生成MV数
   */
  async analytics(req, res) {
    return res.json({
      success: true,
      data: {
        activeUsers: 1,
        totalCredits: 50,
        songsGenerated: 0,
        lyricsGenerated: 0,
        mvGenerated: 0
      }
    });
  }
}

/**
 * 默认导出 - HealthController单例实例
 * @type {HealthController}
 */
export default new HealthController();
