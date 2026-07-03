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
      bpm = 120
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
      content: this._generateStateContent(state, { genre, theme, style, mood, bpm })
    }));

    return {
      success: true,
      method: 'fsm',
      command: this._buildFSMCommand({ genre, theme, style, mood, bpm, path }),
      execution: {
        data: stateContents.map(s => `[${s.state.toUpperCase()}]\n${s.content}`).join('\n\n')
      },
      stats: {
        states: path.length,
        transitions: path.length - 1,
        bpm
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
    const { theme, mood, style, bpm } = params;
    const contents = {
      [FSM_STATES.INTRO]: `轻柔的${style}前奏, 营造${mood}氛围, ${bpm}bpm`,
      [FSM_STATES.VERSE_1]: `主歌开始, 讲述${theme}的故事, 情绪${mood}`,
      [FSM_STATES.CHORUS_1]: `副歌爆发, ${theme}的高潮, 能量提升`,
      [FSM_STATES.VERSE_2]: `主歌延续, 深化${theme}的内涵`,
      [FSM_STATES.CHORUS_2]: `副歌再现, 加强${theme}的记忆点`,
      [FSM_STATES.BRIDGE]: `桥段转折, 引入新的音乐元素`,
      [FSM_STATES.FINAL_CHORUS]: `最终副歌, ${theme}达到情感顶点`,
      [FSM_STATES.OUTRO]: `尾声淡出, ${mood}的情绪延续`
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
    const { genre, theme, style, mood, bpm, path } = params;
    return `[FSM-COMMAND] Genre=${genre} | Theme=${theme} | Style=${style} | Mood=${mood} | BPM=${bpm} | States=${path.join('->')}`;
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
      subStyle = 'house'
    } = params;

    /**
     * Generate content for each network layer
     */
    const layers = NETWORK_LAYERS.map((layer) => ({
      layer,
      content: this._generateLayerContent(layer, { genre, theme, style, mood, bpm, elements, subStyle })
    }));

    return {
      success: true,
      method: 'network_layer',
      command: this._buildNetworkLayerCommand({ genre, theme, style, mood, bpm, elements, subStyle }),
      execution: {
        data: layers.map(l => `[LAYER: ${l.layer.toUpperCase()}]\n${l.content}`).join('\n\n')
      },
      stats: {
        layers: layers.length,
        bpm,
        totalElements: elements.split(' ').length
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
    const { theme, mood, bpm, elements, subStyle } = params;
    const contents = {
      foundation: `底层节拍: ${bpm}bpm基础律动, 围绕${theme}主题构建稳定的${subStyle}基础节拍`,
      melody: `旋律层: 流畅的主旋律线条, 表达${theme}的${mood}情绪, 配合${elements}`,
      expression: `表现层: 人声与和声, 深度诠释${theme}的${mood}情感, 体现${subStyle}特色`,
      effects: `效果层: 混响、延迟、调制效果, 营造${mood}氛围, 整合${elements}的声音设计`
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
    const { genre, theme, style, mood, bpm, elements, subStyle } = params;
    return `[NETWORK-LAYER] Genre=${genre} | Theme=${theme} | Style=${style} | Mood=${mood} | BPM=${bpm} | Elements=${elements} | SubStyle=${subStyle} | Layers=${NETWORK_LAYERS.join('+')}`;
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
      object = '你'
    } = params;

    /**
     * Build natural language command for Muse AI
     */
    const command = `创作一首${genre}风格的歌曲, BPM ${bpm}, 主题为${theme}, 情绪为${mood}, 包含${elements}, 子风格为${subStyle}, 讲述${subject}对${object}的${theme}故事, 融合${style}编曲手法, 营造${mood}氛围。`;

    return {
      success: true,
      method: 'muse',
      command: `[MUSE-COMMAND] ${command}`,
      execution: {
        data: command
      },
      stats: {
        commandLength: command.length,
        parameters: 8
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
      bpm = 120
    } = params;

    /**
     * Build JSON command for Suno AI
     */
    const command = JSON.stringify({
      prompt: `A ${mood} ${genre} song about ${theme}`,
      tags: [genre, style, mood, `${bpm}bpm`],
      make_instrumental: false,
      wait_audio: true
    }, null, 2);

    return {
      success: true,
      method: 'suno',
      command: `[SUNO-COMMAND] ${command}`,
      execution: {
        data: command
      },
      stats: {
        parameters: 5
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
