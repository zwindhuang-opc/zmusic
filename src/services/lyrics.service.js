/**
 * LyricsService - 歌词生成服务
 * 
 * 本服务使用模板库和有限状态机(FSM)生成歌词。
 * 支持多种音乐风格（流行、摇滚、中国风、电子、嘻哈、民谣、情歌）
 * 和多种主题（爱情、友谊、成功、梦想、自然、生活、回忆）。
 * 
 * @module services/lyrics.service
 * @version 1.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('LyricsService');

/**
 * 歌词模板数据库
 * 
 * 包含多种音乐风格的歌词结构模板：
 * - pop: 流行音乐，标准的主歌-副歌结构
 * - rock: 摇滚音乐，包含前奏和尾声
 * - chinese_traditional: 中国风，使用中文段落名称
 * - electronic: 电子音乐，包含build和drop段落
 * - hip_hop: 嘻哈音乐，使用hook代替副歌
 * - ballad: 民谣，钢琴前奏和最终副歌
 * - love_song: 情歌，专注爱情主题
 * 
 * 模板变量说明：
 * - {subject}: 主语（通常是"我"）
 * - {object}: 宾语（通常是"你"）
 * - {theme}: 主题关键词
 * - {feeling}: 情感描述
 * - {action}: 动作描述
 * 
 * @constant {Object}
 */
const LYRICS_TEMPLATES = {
  pop: {
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
    versePattern: '{subject}看着{object}\n想起那些{theme}的日子\n{feeling}在心中\n{feeling}在眼里',
    chorusPattern: '啊~ {theme}\n你是我心中最美的{object}\n{subject}愿意{action}\n直到永远'
  },
  rock: {
    structure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    versePattern: '燃烧吧 {theme}\n{subject}不再沉默\n{object}听见了吗\n这是{subject}的声音',
    chorusPattern: '吼~ {theme}\n让{object}看到{subject}的力量\n不再退缩\n不再迷茫'
  },
  chinese_traditional: {
    structure: ['引子', '主歌', '副歌', '主歌', '副歌', '尾声'],
    versePattern: '月下{subject}独立\n思念{object}如潮\n{theme}如梦\n此情可待成追忆',
    chorusPattern: '天涯何处无{theme}\n{subject}与{object}\n千里共婵娟\n此心永不移'
  },
  electronic: {
    structure: ['intro', 'build', 'drop', 'verse', 'drop', 'verse', 'drop', 'outro'],
    versePattern: '在电子节拍中\n{subject}遇见{object}\n{theme}的频率\n在空气中震荡',
    chorusPattern: 'DROP! {theme}\n让{object}感受这频率\n{subject}的心跳\n与电子同频'
  },
  hip_hop: {
    structure: ['intro', 'verse', 'hook', 'verse', 'hook', 'bridge', 'hook'],
    versePattern: 'Yo, {subject}从街头走来\n{object}看到了吗\n{theme}在血液里\n这是{subject}的real talk',
    chorusPattern: '{theme}! {theme}!\n{subject}和{object}\n从不后退\n这就是{subject}的故事'
  },
  ballad: {
    structure: ['piano intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'final chorus'],
    versePattern: '轻轻地{subject}想起{object}\n那些{theme}的片段\n在时光中流转\n永不褪色',
    chorusPattern: '我的{object}\n我的{theme}\n{subject}的心\n永远属于你'
  },
  love_song: {
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
    versePattern: '当我第一次见到{object}\n心跳漏了一拍\n{theme}的感觉\n在空气中弥漫',
    chorusPattern: '我爱你{object}\n这是我全部的{theme}\n{subject}的心\n永远为你跳动'
  }
};

/**
 * 主题数据库
 * 
 * 定义不同主题对应的情感和动作：
 * - love: 爱情主题，心动和守护
 * - friendship: 友谊主题，温暖和珍惜
 * - success: 成功主题，自信和追求
 * - dreams: 梦想主题，向往和坚持
 * - nature: 自然主题，宁静和感悟
 * - life: 生活主题，感恩和生活
 * - memory: 回忆主题，怀念和铭记
 * 
 * @constant {Object}
 */
const THEMES = {
  love: { feeling: '心动', action: '守护' },
  friendship: { feeling: '温暖', action: '珍惜' },
  success: { feeling: '自信', action: '追求' },
  dreams: { feeling: '向往', action: '坚持' },
  nature: { feeling: '宁静', action: '感悟' },
  life: { feeling: '感恩', action: '生活' },
  memory: { feeling: '怀念', action: '铭记' }
};

/**
 * 歌词生成服务类
 * 
 * 提供歌词生成功能，支持多种风格和主题。
 * 使用模板填充方式生成歌词，通过替换模板变量生成个性化内容。
 * 
 * @class LyricsService
 */
export class LyricsService {
  /**
   * 构造函数
   * 初始化歌词生成服务
   */
  constructor() {
    logger.info('Initialized');
  }

  /**
   * 获取所有支持的音乐风格
   * 
   * @returns {string[]} 音乐风格数组，如 ['pop', 'rock', 'chinese_traditional', ...]
   */
  getGenres() {
    return Object.keys(LYRICS_TEMPLATES);
  }

  /**
   * 获取所有支持的主题
   * 
   * @returns {string[]} 主题数组，如 ['love', 'friendship', 'success', ...]
   */
  getThemes() {
    return Object.keys(THEMES);
  }

  /**
   * 生成歌词
   * 
   * 根据指定的风格、主题和参数生成完整歌词。
   * 使用有限状态机(FSM)思想，按照歌曲结构（主歌、副歌、桥段等）组织歌词。
   * 
   * @param {string} genre - 音乐风格，默认 'pop'
   * @param {string} theme - 主题，默认 'love'
   * @param {Object} params - 生成参数
   * @param {string} [params.subject='我'] - 主语
   * @param {string} [params.object='你'] - 宾语
   * @param {string} [params.verse='verse_1'] - 段落标识
   * 
   * @returns {Object} 生成的歌词对象
   * @returns {string} returns.genre - 使用的音乐风格
   * @returns {string} returns.theme - 使用的主题
   * @returns {string} returns.subject - 主语
   * @returns {string} returns.object - 宾语
   * @returns {string} returns.verse - 段落标识
   * @returns {string[]} returns.structure - 歌曲结构数组
   * @returns {Object[]} returns.sections - 歌词段落数组，每个段落包含 type 和 content
   * @returns {string} returns.fullText - 完整歌词文本
   * @returns {string} returns.generatedAt - 生成时间（ISO格式）
   * 
   * @example
   * const lyrics = lyricsService.generate('pop', 'love', {
   *   subject: '我',
   *   object: '你',
   *   verse: 'verse_1'
   * });
   * console.log(lyrics.fullText);
   */
  generate(genre = 'pop', theme = 'love', params = {}) {
    const template = LYRICS_TEMPLATES[genre] || LYRICS_TEMPLATES.pop;
    const themeData = THEMES[theme] || THEMES.love;
    const subject = params.subject || '我';
    const object = params.object || '你';
    const verse = params.verse || 'verse_1';

    /**
     * 填充模板
     * 将模板中的变量替换为实际值
     * 
     * @param {string} pattern - 模板字符串
     * @returns {string} 填充后的字符串
     */
    const fillTemplate = (pattern) => {
      return pattern
        .replace(/{subject}/g, subject)
        .replace(/{object}/g, object)
        .replace(/{theme}/g, theme)
        .replace(/{feeling}/g, themeData.feeling)
        .replace(/{action}/g, themeData.action);
    };

    /**
     * 生成歌词段落
     * 根据歌曲结构，为每个段落生成内容
     */
    const verses = template.structure.map((section) => {
      if (section.includes('verse') || section === '主歌') {
        return { type: section, content: fillTemplate(template.versePattern) };
      }
      if (section.includes('chorus') || section === '副歌' || section === 'hook') {
        return { type: section, content: fillTemplate(template.chorusPattern) };
      }
      if (section === 'bridge' || section === 'bridge') {
        return { type: section, content: fillTemplate(template.versePattern) };
      }
      return { type: section, content: `[${section}]` };
    });

    return {
      genre,
      theme,
      subject,
      object,
      verse,
      structure: template.structure,
      sections: verses,
      fullText: verses.map(v => v.content).join('\n\n'),
      generatedAt: new Date().toISOString()
    };
  }
}

export default LyricsService;
