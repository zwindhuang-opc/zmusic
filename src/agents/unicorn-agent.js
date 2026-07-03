/**
 * UnicornAgent - AI Agent with FSM and Network Layer capabilities
 * 
 * This is the core AI agent that generates human-like-music-speech-commands for Suno AI and Muse AI.
 * It implements two advanced generation methods:
 * 1. FSM (Finite State Machine) - for structured music composition with state transitions
 * 2. Network Layer - for layered music composition with multiple audio layers
 * 
 * The agent also supports Muse-style and Suno-style command generation for compatibility
 * with different AI music generation services.
 * 
 * @module agents/unicorn-agent
 * @version 1.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

/**
 * Logger instance for this agent
 * @type {Logger}
 */
const logger = new Logger('UnicornAgent');

/**
 * FSM (Finite State Machine) States for music structure generation
 * 
 * These states represent the typical structure of a song:
 * - INTRO: Opening section that sets the mood
 * - VERSE_1: First verse that introduces the theme
 * - CHORUS_1: First chorus with the main hook
 * - VERSE_2: Second verse that develops the story
 * - CHORUS_2: Second chorus that reinforces the hook
 * - BRIDGE: Transitional section that provides contrast
 * - FINAL_CHORUS: Final chorus with maximum energy
 * - OUTRO: Closing section that wraps up the song
 * 
 * @constant {Object}
 */
const FSM_STATES = {
  INTRO: 'intro',
  VERSE_1: 'verse_1',
  CHORUS_1: 'chorus_1',
  VERSE_2: 'verse_2',
  CHORUS_2: 'chorus_2',
  BRIDGE: 'bridge',
  FINAL_CHORUS: 'final_chorus',
  OUTRO: 'outro'
};

/**
 * FSM State Transitions
 * 
 * Defines valid transitions between states in the finite state machine.
 * Each state maps to an array of possible next states.
 * This ensures musically logical song structures.
 * 
 * @constant {Object}
 */
const FSM_TRANSITIONS = {
  [FSM_STATES.INTRO]: [FSM_STATES.VERSE_1],
  [FSM_STATES.VERSE_1]: [FSM_STATES.CHORUS_1, FSM_STATES.VERSE_2],
  [FSM_STATES.CHORUS_1]: [FSM_STATES.VERSE_2, FSM_STATES.BRIDGE],
  [FSM_STATES.VERSE_2]: [FSM_STATES.CHORUS_2, FSM_STATES.BRIDGE],
  [FSM_STATES.CHORUS_2]: [FSM_STATES.BRIDGE, FSM_STATES.FINAL_CHORUS],
  [FSM_STATES.BRIDGE]: [FSM_STATES.FINAL_CHORUS],
  [FSM_STATES.FINAL_CHORUS]: [FSM_STATES.OUTRO],
  [FSM_STATES.OUTRO]: []
};

/**
 * Network Layers for layered music composition
 * 
 * These layers represent different aspects of a music track:
 * - foundation: Base rhythm and beat structure
 * - melody: Main melodic elements and hooks
 * - expression: Emotional and dynamic elements
 * - effects: Sound effects and atmospheric elements
 * 
 * @constant {string[]}
 */
const NETWORK_LAYERS = ['foundation', 'melody', 'expression', 'effects'];

/**
 * UnicornAgent Class
 * 
 * Main AI agent that orchestrates music generation using multiple methods.
 * Integrates Hermes and OpenClaw sub-agents for enhanced capabilities.
 * 
 * @class UnicornAgent
 */
export class UnicornAgent {
  /**
   * Constructor - Initialize the UnicornAgent
   * 
   * Sets up the agent with Hermes and OpenClaw sub-agents enabled.
   */
  constructor() {
    /** @type {string} Agent name */
    this.name = 'Unicorn Agent';
    /** @type {boolean} Whether Hermes sub-agent is enabled */
    this.hermesEnabled = true;
    /** @type {boolean} Whether OpenClaw sub-agent is enabled */
    this.openclawEnabled = true;
    logger.info(`${this.name} initialized (Hermes + OpenClaw enabled)`);
  }

  /**
   * Get the current status of the agent
   * 
   * @returns {Object} Status object containing agent configuration
   * @returns {string} returns.name - Agent name
   * @returns {boolean} returns.hermes - Whether Hermes is enabled
   * @returns {boolean} returns.openclaw - Whether OpenClaw is enabled
   * @returns {number} returns.fsmStates - Number of FSM states
   * @returns {number} returns.networkLayers - Number of network layers
   */
  getStatus() {
    return {
      name: this.name,
      hermes: this.hermesEnabled,
      openclaw: this.openclawEnabled,
      fsmStates: Object.keys(FSM_STATES).length,
      networkLayers: NETWORK_LAYERS.length
    };
  }

  /**
   * Generate lyrics using FSM (Finite State Machine) Programming
   * 
   * This method uses a state machine approach to generate structured lyrics.
   * It follows a predefined path through song states (intro, verse, chorus, etc.)
   * and generates content for each state based on the provided parameters.
   * 
   * @param {Object} params - Generation parameters
   * @param {string} [params.genre='pop'] - Music genre
   * @param {string} [params.theme='love'] - Song theme
   * @param {string} [params.style='modern'] - Music style
   * @param {string} [params.mood='happy'] - Song mood
   * @param {number} [params.bpm=120] - Beats per minute
   * 
   * @returns {Object} Generated lyrics with FSM structure
   * @returns {boolean} returns.success - Whether generation succeeded
   * @returns {string} returns.method - Generation method used ('fsm')
   * @returns {string} returns.command - FSM command string
   * @returns {Object} returns.execution - Execution details with generated content
   * @returns {Object} returns.stats - Statistics about the generation
   */
  generateFSMLyrics(params) {
    const {
      genre = 'pop',
      theme = 'love',
      style = 'modern',
      mood = 'happy',
      bpm = 120,
      complexity = 5
    } = params;

    /**
     * Define the state path for song structure
     * This follows a typical pop song structure
     */
    const path = [
      FSM_STATES.INTRO,
      FSM_STATES.VERSE_1,
      FSM_STATES.CHORUS_1,
      FSM_STATES.VERSE_2,
      FSM_STATES.CHORUS_2,
      FSM_STATES.BRIDGE,
      FSM_STATES.FINAL_CHORUS,
      FSM_STATES.OUTRO
    ];

    /**
     * Generate content for each state in the path
     */
    const stateContents = path.map((state) => ({
      state,
      content: this._generateStateContent(state, { genre, theme, style, mood, bpm, complexity })
    }));

    return {
      success: true,
      method: 'fsm',
      command: this._buildFSMCommand({ genre, theme, style, mood, bpm, path, complexity }),
      execution: {
        data: stateContents.map(s => `[${s.state.toUpperCase()}]\n${s.content}`).join('\n\n')
      },
      stats: {
        states: path.length,
        transitions: path.length - 1,
        bpm,
        complexity
      }
    };
  }

  /**
   * Generate content for a specific FSM state
   * 
   * @private
   * @param {string} state - FSM state identifier
   * @param {Object} params - Content generation parameters
   * @returns {string} Generated content for the state
   */
  _generateStateContent(state, params) {
    const { theme, mood, style, bpm, complexity = 5 } = params;

    const complexityModifiers = {
      low: { detail: '', depth: '', vivid: '' },
      medium: { detail: '细腻地', depth: '深刻地', vivid: '生动的' },
      high: { detail: '极其细腻地', depth: '深邃地', vivid: '栩栩如生的' },
      extreme: { detail: '极致细腻地', depth: '无限深邃地', vivid: '令人身临其境的' }
    };

    const getModifier = (level) => {
      if (level <= 3) return complexityModifiers.low;
      if (level <= 6) return complexityModifiers.medium;
      if (level <= 8) return complexityModifiers.high;
      return complexityModifiers.extreme;
    };

    const mod = getModifier(complexity);

    const introContents = {
      1: `轻柔的${style}前奏, 营造${mood}氛围`,
      3: `轻柔的${style}前奏, ${mod.detail}营造${mood}氛围, ${bpm}bpm`,
      5: `${mod.vivid}${style}前奏缓缓展开, ${mod.detail}营造${mood}氛围, ${bpm}bpm, 配合轻柔的${style}乐器`,
      7: `${mod.vivid}${style}前奏缓缓展开, ${mod.detail}营造${mood}氛围, ${bpm}bpm, 配合轻柔的${style}乐器, 融入微妙的和声变化`,
      10: `${mod.vivid}${style}前奏缓缓展开, ${mod.detail}营造${mood}氛围, ${bpm}bpm, 配合轻柔的${style}乐器, 融入微妙的和声变化, 使用精致的音色设计和空间感处理, 为整首歌奠定${mood}而富有层次的基调`
    };

    const verse1Contents = {
      1: `主歌开始, 讲述${theme}的故事`,
      3: `主歌开始, ${mod.detail}讲述${theme}的故事, 情绪${mood}`,
      5: `主歌开始, ${mod.detail}讲述${theme}的故事, ${mod.depth}表达${mood}情绪, 旋律线条流畅优美`,
      7: `主歌开始, ${mod.detail}讲述${theme}的故事, ${mod.depth}表达${mood}情绪, 旋律线条流畅优美, 歌词富有诗意和画面感, 节奏感细腻`,
      10: `主歌开始, ${mod.detail}讲述${theme}的故事, ${mod.depth}表达${mood}情绪, 旋律线条流畅优美, 歌词富有诗意和画面感, 节奏感细腻, 使用复杂的和弦进行, 配合精心设计的节奏型, 展现${theme}主题的多层次内涵`
    };

    const chorus1Contents = {
      1: `副歌爆发, ${theme}的高潮`,
      3: `副歌爆发, ${theme}的高潮, 能量提升`,
      5: `副歌爆发, ${theme}的高潮, 能量大幅提升, 旋律朗朗上口, 和声丰富饱满`,
      7: `副歌爆发, ${theme}的高潮, 能量大幅提升, 旋律朗朗上口, 和声丰富饱满, 编曲层次分明, 使用强有力的节奏驱动`,
      10: `副歌爆发, ${theme}的高潮, 能量大幅提升至顶点, 旋律极其朗朗上口且富有记忆点, 和声丰富饱满且变化多样, 编曲层次分明且动态十足, 使用强有力的节奏驱动, 配合华丽的乐器编排和震撼的音效处理`
    };

    const verse2Contents = {
      1: `主歌延续, 深化${theme}的内涵`,
      3: `主歌延续, ${mod.depth}深化${theme}的内涵`,
      5: `主歌延续, ${mod.depth}深化${theme}的内涵, 引入新的音乐元素, 情绪进一步发展`,
      7: `主歌延续, ${mod.depth}深化${theme}的内涵, 引入新的音乐元素, 情绪进一步发展, 编曲更加丰富, 加入新的乐器层次`,
      10: `主歌延续, ${mod.depth}深化${theme}的内涵, 引入新的音乐元素和旋律动机, 情绪进一步发展和升华, 编曲更加丰富和细腻, 加入新的乐器层次和和声变化, 展现${theme}主题的深度和广度`
    };

    const chorus2Contents = {
      1: `副歌再现, 加强${theme}的记忆点`,
      3: `副歌再现, ${mod.detail}加强${theme}的记忆点`,
      5: `副歌再现, ${mod.detail}加强${theme}的记忆点, 编曲更加宏大, 能量更上一层楼`,
      7: `副歌再现, ${mod.detail}加强${theme}的记忆点, 编曲更加宏大和华丽, 能量更上一层楼, 加入和声伴唱和乐器独奏`,
      10: `副歌再现, ${mod.detail}加强${theme}的记忆点, 编曲更加宏大和华丽, 能量更上一层楼达到新高度, 加入精致的和声伴唱和华丽的乐器独奏, 使用复杂的编曲技巧和动态处理, 使${theme}主题深入人心`
    };

    const bridgeContents = {
      1: `桥段转折, 引入新的音乐元素`,
      3: `桥段转折, ${mod.detail}引入新的音乐元素`,
      5: `桥段转折, ${mod.detail}引入新的音乐元素, 调性变化, 为最终高潮做铺垫`,
      7: `桥段转折, ${mod.detail}引入新的音乐元素和和声色彩, 调性变化, 为最终高潮做铺垫, 使用对比强烈的编曲手法`,
      10: `桥段转折, ${mod.detail}引入新的音乐元素和和声色彩, 调性变化带来新鲜感, 为最终高潮做完美铺垫, 使用对比强烈的编曲手法和精心设计的过渡段落, 展现音乐的深度和艺术性`
    };

    const finalChorusContents = {
      1: `最终副歌, ${theme}达到情感顶点`,
      3: `最终副歌, ${theme}达到情感顶点, 全曲高潮`,
      5: `最终副歌, ${theme}达到情感顶点, 全曲最高潮, 编曲达到最宏大的状态`,
      7: `最终副歌, ${theme}达到情感顶点, 全曲最高潮, 编曲达到最宏大的状态, 所有乐器齐奏, 和声达到最丰富`,
      10: `最终副歌, ${theme}达到情感顶点, 全曲最高潮, 编曲达到最宏大和华丽的状态, 所有乐器齐奏形成震撼的音效墙, 和声达到最丰富和复杂的层次, 使用极致的动态范围和声音设计, 将${theme}主题推向永恒的巅峰`
    };

    const outroContents = {
      1: `尾声淡出, ${mood}的情绪延续`,
      3: `尾声淡出, ${mod.detail}延续${mood}的情绪`,
      5: `尾声淡出, ${mod.detail}延续${mood}的情绪, 逐渐减弱, 留下回味`,
      7: `尾声淡出, ${mod.detail}延续${mood}的情绪, 逐渐减弱, 使用渐弱的编曲手法, 留下悠长的回味`,
      10: `尾声淡出, ${mod.detail}延续${mood}的情绪, 逐渐减弱, 使用精致的渐弱编曲手法和声音淡出效果, 留下悠长而深刻的回味, 以${style}特色的乐器收尾, 使整首歌完美落幕`
    };

    const getContent = (level, contents) => {
      if (level >= 10) return contents[10];
      if (level >= 7) return contents[7];
      if (level >= 5) return contents[5];
      if (level >= 3) return contents[3];
      return contents[1];
    };

    const contents = {
      [FSM_STATES.INTRO]: getContent(complexity, introContents),
      [FSM_STATES.VERSE_1]: getContent(complexity, verse1Contents),
      [FSM_STATES.CHORUS_1]: getContent(complexity, chorus1Contents),
      [FSM_STATES.VERSE_2]: getContent(complexity, verse2Contents),
      [FSM_STATES.CHORUS_2]: getContent(complexity, chorus2Contents),
      [FSM_STATES.BRIDGE]: getContent(complexity, bridgeContents),
      [FSM_STATES.FINAL_CHORUS]: getContent(complexity, finalChorusContents),
      [FSM_STATES.OUTRO]: getContent(complexity, outroContents)
    };
    return contents[state] || '';
  }

  /**
   * Build FSM command string
   * 
   * @private
   * @param {Object} params - Command parameters
   * @returns {string} Formatted FSM command string
   */
  _buildFSMCommand(params) {
    const { genre, theme, style, mood, bpm, path, complexity } = params;
    return `[FSM-COMMAND] Genre=${genre} | Theme=${theme} | Style=${style} | Mood=${mood} | BPM=${bpm} | Complexity=${complexity} | States=${path.join('->')}`;
  }

  /**
   * Generate lyrics using Network Layer composition
   * 
   * This method uses a layered approach to generate music, where each layer
   * represents a different aspect of the composition (foundation, melody, expression, effects).
   * This allows for more complex and nuanced music generation.
   * 
   * @param {Object} params - Generation parameters
   * @param {string} [params.genre='pop'] - Music genre
   * @param {string} [params.theme='love'] - Song theme
   * @param {string} [params.style='modern'] - Music style
   * @param {string} [params.mood='happy'] - Song mood
   * @param {number} [params.bpm=120] - Beats per minute
   * @param {string} [params.elements='electronic elements'] - Musical elements
   * @param {string} [params.subStyle='house'] - Sub-genre style
   * 
   * @returns {Object} Generated lyrics with network layer structure
   * @returns {boolean} returns.success - Whether generation succeeded
   * @returns {string} returns.method - Generation method used ('network_layer')
   * @returns {string} returns.command - Network layer command string
   * @returns {Object} returns.execution - Execution details with layer content
   * @returns {Object} returns.stats - Statistics about the generation
   */
  generateNetworkLayerLyrics(params) {
    const {
      genre = 'pop',
      theme = 'love',
      style = 'modern',
      mood = 'happy',
      bpm = 120,
      elements = 'electronic elements',
      subStyle = 'house',
      complexity = 5
    } = params;

    /**
     * Generate content for each network layer
     */
    const layers = NETWORK_LAYERS.map((layer) => ({
      layer,
      content: this._generateLayerContent(layer, { genre, theme, style, mood, bpm, elements, subStyle, complexity })
    }));

    return {
      success: true,
      method: 'network_layer',
      command: this._buildNetworkLayerCommand({ genre, theme, style, mood, bpm, elements, subStyle, complexity }),
      execution: {
        data: layers.map(l => `[LAYER: ${l.layer.toUpperCase()}]\n${l.content}`).join('\n\n')
      },
      stats: {
        layers: layers.length,
        bpm,
        totalElements: elements.split(' ').length,
        complexity
      }
    };
  }

  /**
   * Generate content for a specific network layer
   * 
   * @private
   * @param {string} layer - Network layer identifier
   * @param {Object} params - Content generation parameters
   * @returns {string} Generated content for the layer
   */
  _generateLayerContent(layer, params) {
    const { theme, mood, bpm, elements, subStyle, complexity = 5 } = params;

    const complexityModifiers = {
      low: { detail: '', depth: '', elaborate: '' },
      medium: { detail: '精心地', depth: '深刻地', elaborate: '细致的' },
      high: { detail: '极其精心地', depth: '深邃地', elaborate: '精致复杂的' },
      extreme: { detail: '极致精心地', depth: '无限深邃地', elaborate: '极其精致复杂的' }
    };

    const getModifier = (level) => {
      if (level <= 3) return complexityModifiers.low;
      if (level <= 6) return complexityModifiers.medium;
      if (level <= 8) return complexityModifiers.high;
      return complexityModifiers.extreme;
    };

    const mod = getModifier(complexity);

    const foundationContents = {
      1: `底层节拍: ${bpm}bpm基础律动`,
      3: `底层节拍: ${bpm}bpm基础律动, 围绕${theme}主题构建稳定的${subStyle}基础节拍`,
      5: `底层节拍: ${bpm}bpm基础律动, ${mod.detail}围绕${theme}主题构建稳定的${subStyle}基础节拍, 使用${mod.elaborate}节奏型`,
      7: `底层节拍: ${bpm}bpm基础律动, ${mod.detail}围绕${theme}主题构建稳定的${subStyle}基础节拍, 使用${mod.elaborate}节奏型和复合节拍, 融入微妙的节奏变化`,
      10: `底层节拍: ${bpm}bpm基础律动, ${mod.detail}围绕${theme}主题构建稳定而富有层次的${subStyle}基础节拍, 使用${mod.elaborate}节奏型和复合节拍, 融入微妙的节奏变化和复杂的切分, 配合精致的打击乐编排`
    };

    const melodyContents = {
      1: `旋律层: 流畅的主旋律线条, 表达${theme}的${mood}情绪`,
      3: `旋律层: 流畅的主旋律线条, 表达${theme}的${mood}情绪, 配合${elements}`,
      5: `旋律层: 流畅优美的主旋律线条, ${mod.depth}表达${theme}的${mood}情绪, 配合${elements}, 使用${mod.elaborate}旋律发展手法`,
      7: `旋律层: 流畅优美的主旋律线条, ${mod.depth}表达${theme}的${mood}情绪, 配合${elements}, 使用${mod.elaborate}旋律发展手法和转调技巧, 加入复调元素`,
      10: `旋律层: 流畅优美且富有张力的主旋律线条, ${mod.depth}表达${theme}的${mood}情绪, 配合${elements}, 使用${mod.elaborate}旋律发展手法和转调技巧, 加入复调元素和对位线条, 配合精致的和声进行, 展现${theme}主题的多层次内涵`
    };

    const expressionContents = {
      1: `表现层: 人声与和声, 诠释${theme}的${mood}情感`,
      3: `表现层: 人声与和声, ${mod.depth}诠释${theme}的${mood}情感, 体现${subStyle}特色`,
      5: `表现层: 人声与和声, ${mod.depth}诠释${theme}的${mood}情感, 体现${subStyle}特色, 使用${mod.elaborate}和声配置`,
      7: `表现层: 人声与和声, ${mod.depth}诠释${theme}的${mood}情感, 体现${subStyle}特色, 使用${mod.elaborate}和声配置和多声部编排, 加入和声伴唱和合唱段落`,
      10: `表现层: 人声与和声, ${mod.depth}诠释${theme}的${mood}情感, 体现${subStyle}特色, 使用${mod.elaborate}和声配置和多声部编排, 加入精致的和声伴唱和宏大的合唱段落, 配合细腻的人声效果处理和动态变化`
    };

    const effectsContents = {
      1: `效果层: 混响、延迟、调制效果, 营造${mood}氛围`,
      3: `效果层: 混响、延迟、调制效果, 营造${mood}氛围, 整合${elements}的声音设计`,
      5: `效果层: 混响、延迟、调制效果, ${mod.detail}营造${mood}氛围, 整合${elements}的声音设计, 使用${mod.elaborate}音效处理`,
      7: `效果层: 混响、延迟、调制效果, ${mod.detail}营造${mood}氛围, 整合${elements}的声音设计, 使用${mod.elaborate}音效处理和空间感设计, 加入自动化效果控制`,
      10: `效果层: 混响、延迟、调制效果, ${mod.detail}营造${mood}氛围, 整合${elements}的声音设计, 使用${mod.elaborate}音效处理和空间感设计, 加入自动化效果控制和动态效果调制, 配合精致的音色设计和声音塑形, 打造沉浸式的听觉体验`
    };

    const getContent = (level, contents) => {
      if (level >= 10) return contents[10];
      if (level >= 7) return contents[7];
      if (level >= 5) return contents[5];
      if (level >= 3) return contents[3];
      return contents[1];
    };

    const contents = {
      foundation: getContent(complexity, foundationContents),
      melody: getContent(complexity, melodyContents),
      expression: getContent(complexity, expressionContents),
      effects: getContent(complexity, effectsContents)
    };
    return contents[layer] || '';
  }

  /**
   * Build network layer command string
   * 
   * @private
   * @param {Object} params - Command parameters
   * @returns {string} Formatted network layer command string
   */
  _buildNetworkLayerCommand(params) {
    const { genre, theme, style, mood, bpm, elements, subStyle, complexity } = params;
    return `[NETWORK-LAYER] Genre=${genre} | Theme=${theme} | Style=${style} | Mood=${mood} | BPM=${bpm} | Elements=${elements} | SubStyle=${subStyle} | Complexity=${complexity} | Layers=${NETWORK_LAYERS.join('+')}`;
  }

  /**
   * Generate Muse-style descriptive command
   * 
   * This method generates a natural language command suitable for Muse AI,
   * which uses descriptive text to guide music generation.
   * 
   * @param {Object} params - Generation parameters
   * @param {string} [params.genre='流行'] - Music genre (Chinese)
   * @param {string} [params.style='现代'] - Music style (Chinese)
   * @param {number} [params.bpm=122] - Beats per minute
   * @param {string} [params.theme='爱情'] - Song theme (Chinese)
   * @param {string} [params.mood='温暖'] - Song mood (Chinese)
   * @param {string} [params.elements='热带打击乐'] - Musical elements (Chinese)
   * @param {string} [params.subStyle='浩室'] - Sub-genre style (Chinese)
   * @param {string} [params.subject='我'] - Song subject (Chinese)
   * @param {string} [params.object='你'] - Song object (Chinese)
   * 
   * @returns {Object} Generated Muse-style command
   * @returns {boolean} returns.success - Whether generation succeeded
   * @returns {string} returns.method - Generation method used ('muse')
   * @returns {string} returns.command - Muse command string
   * @returns {Object} returns.execution - Execution details with command data
   * @returns {Object} returns.stats - Statistics about the generation
   */
  generateMuseStyleCommand(params) {
    const {
      genre = '流行',
      style = '现代',
      bpm = 122,
      theme = '爱情',
      mood = '温暖',
      elements = '热带打击乐',
      subStyle = '浩室',
      subject = '我',
      object = '你',
      complexity = 5
    } = params;

    const complexityDesc = {
      1: '',
      3: '简单的',
      5: '中等复杂度的',
      7: '复杂的',
      10: '极其复杂的、富有深度和艺术性的'
    };

    const getComplexityDesc = (level) => {
      if (level >= 10) return complexityDesc[10];
      if (level >= 7) return complexityDesc[7];
      if (level >= 5) return complexityDesc[5];
      if (level >= 3) return complexityDesc[3];
      return complexityDesc[1];
    };

    const detailDesc = {
      1: '',
      3: '较为简单地',
      5: '精心地',
      7: '极其精心地',
      10: '极致精心地、艺术化地'
    };

    const getDetailDesc = (level) => {
      if (level >= 10) return detailDesc[10];
      if (level >= 7) return detailDesc[7];
      if (level >= 5) return detailDesc[5];
      if (level >= 3) return detailDesc[3];
      return detailDesc[1];
    };

    /**
     * Build natural language command for Muse AI
     */
    const command = `创作一首${getComplexityDesc(complexity)}${genre}风格的歌曲, BPM ${bpm}, 主题为${theme}, 情绪为${mood}, 包含${elements}, 子风格为${subStyle}, ${getDetailDesc(complexity)}讲述${subject}对${object}的${theme}故事, 融合${style}编曲手法, ${getDetailDesc(complexity)}营造${mood}氛围, 使用${getComplexityDesc(complexity)}编曲技巧和声音设计。`;

    return {
      success: true,
      method: 'muse',
      command: `[MUSE-COMMAND] ${command}`,
      execution: {
        data: command
      },
      stats: {
        commandLength: command.length,
        parameters: 8,
        complexity
      }
    };
  }

  /**
   * Generate Suno-style structured command
   * 
   * This method generates a JSON-formatted command suitable for Suno AI,
   * which uses structured parameters to guide music generation.
   * 
   * @param {Object} params - Generation parameters
   * @param {string} [params.genre='pop'] - Music genre
   * @param {string} [params.style='modern'] - Music style
   * @param {string} [params.theme='love'] - Song theme
   * @param {string} [params.mood='happy'] - Song mood
   * @param {number} [params.bpm=120] - Beats per minute
   * 
   * @returns {Object} Generated Suno-style command
   * @returns {boolean} returns.success - Whether generation succeeded
   * @returns {string} returns.method - Generation method used ('suno')
   * @returns {string} returns.command - Suno command string (JSON)
   * @returns {Object} returns.execution - Execution details with command data
   * @returns {Object} returns.stats - Statistics about the generation
   */
  generateSunoStyleCommand(params) {
    const {
      genre = 'pop',
      style = 'modern',
      theme = 'love',
      mood = 'happy',
      bpm = 120,
      complexity = 5
    } = params;

    const complexityTags = {
      1: '',
      3: 'simple',
      5: 'medium complexity',
      7: 'complex',
      10: 'highly complex, intricate, artistic'
    };

    const getComplexityTag = (level) => {
      if (level >= 10) return complexityTags[10];
      if (level >= 7) return complexityTags[7];
      if (level >= 5) return complexityTags[5];
      if (level >= 3) return complexityTags[3];
      return complexityTags[1];
    };

    /**
     * Build JSON command for Suno AI
     */
    const command = JSON.stringify({
      prompt: `A ${mood} ${genre} song about ${theme}, ${getComplexityTag(complexity)} arrangement`,
      tags: [genre, style, mood, `${bpm}bpm`, getComplexityTag(complexity)],
      make_instrumental: false,
      wait_audio: true,
      complexity: complexity
    }, null, 2);

    return {
      success: true,
      method: 'suno',
      command: `[SUNO-COMMAND] ${command}`,
      execution: {
        data: command
      },
      stats: {
        parameters: 5,
        complexity
      }
    };
  }

  /**
   * Main entry point: generate lyrics based on specified method
   * 
   * This is the primary method for generating lyrics. It routes to the appropriate
   * generation method based on the 'method' parameter.
   * 
   * @async
   * @param {Object} params - Generation parameters
   * @param {string} [params.method='muse'] - Generation method ('fsm', 'network_layer', 'muse', 'suno')
   * @param {...Object} params - Additional parameters passed to the specific generation method
   * 
   * @returns {Promise<Object>} Generated lyrics with task ID
   * @returns {string} returns.taskId - Unique task identifier
   * @returns {...Object} returns - Additional properties from the specific generation method
   */
  async generateLyrics(params) {
    const method = params.method || 'muse';
    logger.info(`Generating lyrics with method: ${method}`);

    let result;
    switch (method) {
      case 'fsm':
        result = this.generateFSMLyrics(params);
        break;
      case 'network_layer':
        result = this.generateNetworkLayerLyrics(params);
        break;
      case 'muse':
        result = this.generateMuseStyleCommand(params);
        break;
      case 'suno':
        result = this.generateSunoStyleCommand(params);
        break;
      default:
        result = this.generateMuseStyleCommand(params);
    }

    return {
      taskId: `lyrics_${Date.now()}`,
      ...result
    };
  }

  /**
   * Generate MV timeline using agent
   * 
   * This method generates a music video timeline with multiple scenes,
   * each with specific timing and effects.
   * 
   * @async
   * @param {Object} params - Generation parameters
   * @param {number} [params.duration=180] - MV duration in seconds
   * @param {string} [params.style='modern'] - MV style
   * @param {string} [params.colorPalette='purple_gradient'] - Color palette
   * 
   * @returns {Promise<Object>} Generated MV timeline
   * @returns {boolean} returns.success - Whether generation succeeded
   * @returns {string} returns.taskId - Unique task identifier
   * @returns {Object[]} returns.timeline - Array of scene objects
   * @returns {Object} returns.stats - Statistics about the generation
   */
  async generateMV(params) {
    const { duration = 180, style = 'modern', colorPalette = 'purple_gradient' } = params;
    logger.info(`Generating MV: duration=${duration}s, style=${style}`);

    /**
     * Define scene structure for the MV
     */
    const scenes = ['intro', 'verse_scene', 'chorus_scene', 'bridge_scene', 'outro'];
    const sceneDuration = Math.floor(duration / scenes.length);

    /**
     * Generate timeline with timing for each scene
     */
    const timeline = scenes.map((scene, index) => ({
      sceneId: index + 1,
      scene,
      startTime: index * sceneDuration,
      endTime: (index + 1) * sceneDuration,
      duration: sceneDuration,
      effects: ['fade', 'cut', 'transition'],
      colorPalette
    }));

    return {
      success: true,
      taskId: `mv_${Date.now()}`,
      timeline,
      stats: {
        scenes: scenes.length,
        duration,
        style
      }
    };
  }
}

/**
 * HermesAgent Class
 * 
 * Sub-agent that provides additional capabilities for the UnicornAgent.
 * Currently a placeholder for future expansion.
 * 
 * @class HermesAgent
 */
export class HermesAgent {
  /**
   * Constructor - Initialize the HermesAgent
   */
  constructor() {
    this.name = 'Hermes Agent';
    logger.info(`${this.name} initialized`);
  }

  /**
   * Get the current status of the agent
   * 
   * @returns {Object} Status object containing agent name and status
   */
  getStatus() {
    return { name: this.name, status: 'active' };
  }
}

/**
 * OpenClawAgent Class
 * 
 * Sub-agent that provides additional capabilities for the UnicornAgent.
 * Currently a placeholder for future expansion.
 * 
 * @class OpenClawAgent
 */
export class OpenClawAgent {
  /**
   * Constructor - Initialize the OpenClawAgent
   */
  constructor() {
    this.name = 'OpenClaw Agent';
    logger.info(`${this.name} initialized`);
  }

  /**
   * Get the current status of the agent
   * 
   * @returns {Object} Status object containing agent name and status
   */
  getStatus() {
    return { name: this.name, status: 'active' };
  }
}

/**
 * Default export - UnicornAgent class
 */
export default UnicornAgent;
