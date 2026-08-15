/**
 * Log4j-style Logger for ZMusic
 * 
 * Features:
 * - Multiple log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
 * - Console appender (browser)
 * - Pattern-based layout formatting
 * - Module-based logging
 * - File appender support
 * - Global log level configuration
 * 
 * @module utils/logger
 * @version 1.0.0
 */

/**
 * Log levels enumeration
 * @enum {number}
 */
export const LogLevel = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
};

let globalLevel = LogLevel.INFO;
try {
  if (typeof process !== 'undefined' && process.env) {
    globalLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }
} catch {
  globalLevel = LogLevel.INFO;
}

/**
 * Log level names mapping
 */
const LevelNames = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL'
};

/**
 * Pattern layout formatter
 * Supports: %d (date), %p (level), %c (category), %m (message)
 */
class PatternLayout {
  constructor(pattern = '[%d] [%p] [%c] - %m') {
    this.pattern = pattern;
  }

  format(level, category, message, timestamp = new Date()) {
    const dateStr = timestamp.toISOString();
    const levelStr = LevelNames[level] || 'UNKNOWN';

    return this.pattern
      .replace('%d', dateStr)
      .replace('%p', levelStr)
      .replace('%c', category)
      .replace('%m', message);
  }
}

/**
 * Console appender - outputs to console
 */
class ConsoleAppender {
  constructor(layout = new PatternLayout()) {
    this.layout = layout;
  }

  append(level, category, message, timestamp) {
    const formatted = this.layout.format(level, category, message, timestamp);

    if (level >= LogLevel.ERROR) {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }
}

/**
 * File appender - writes log lines to a file via Node.js fs (server-side only).
 * Mirrors log4j FileAppender behaviour: appends with optional max file size
 * rotation. Safe to import in the browser (no-ops when fs is unavailable).
 *
 * Pass an fs-compatible module via options.fs (server.js wires `node:fs` in).
 */
class FileAppender {
  /**
   * @param {string} filepath - Absolute path to the log file
   * @param {Object} [options]
   * @param {number} [options.maxSize=5_242_880] - Max bytes before rolling (default 5MB)
   * @param {Object} [options.layout] - PatternLayout instance
   * @param {Object} [options.fs] - Injected fs module (server-side)
   */
  constructor(filepath, options = {}) {
    this.filepath = filepath;
    this.maxSize = options.maxSize || 5 * 1024 * 1024;
    this.layout = options.layout || new PatternLayout();
    // Use injected fs if provided; otherwise no-op (browser-safe)
    this._fs = options.fs || null;
  }

  append(level, category, message, timestamp) {
    if (!this._fs) return; // No-op in browser
    try {
      const line = this.layout.format(level, category, message, timestamp) + '\n';
      // Rotate if file exceeds maxSize
      if (this._fs.existsSync(this.filepath)) {
        const stat = this._fs.statSync(this.filepath);
        if (stat.size > this.maxSize) {
          this._fs.renameSync(this.filepath, this.filepath + '.1');
        }
      }
      this._fs.appendFileSync(this.filepath, line, 'utf8');
    } catch { /* never let logging crash the app */ }
  }
}

/**
 * Main Logger class
 */
export class Logger {
  /**
   * Create a new logger instance
   * @param {string} category - Logger category (usually module name)
   * @param {number} level - Minimum log level
   */
  constructor(category, level = globalLevel) {
    this.category = category;
    this.level = level;
    this.appenders = [];

    this.addAppender(new ConsoleAppender());
  }

  /**
   * Set global log level for all new loggers
   * @param {number} level - Log level from LogLevel enum
   */
  static setGlobalLevel(level) {
    globalLevel = level;
  }

  /**
   * Add an appender to this logger
   * @param {Object} appender - Appender instance
   */
  addAppender(appender) {
    this.appenders.push(appender);
  }

  /**
   * Set the minimum log level
   * @param {number} level - Log level from LogLevel enum
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Internal log method
   * @private
   */
  _log(level, message, ...args) {
    if (level < this.level) return;

    const timestamp = new Date();
    let formattedMessage = message;

    if (args.length > 0) {
      formattedMessage = this.formatMessage(message, args);
    }

    for (const appender of this.appenders) {
      appender.append(level, this.category, formattedMessage, timestamp);
    }
  }

  /**
   * Format message with arguments
   * @private
   */
  formatMessage(message, args) {
    let result = message;
    let argIndex = 0;

    result = result.replace(/%[sdjo]/g, (match) => {
      if (argIndex >= args.length) return match;

      const arg = args[argIndex++];

      switch (match) {
        case '%s':
          return String(arg);
        case '%d':
          return Number(arg).toString();
        case '%j':
        case '%o':
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        default:
          return match;
      }
    });

    if (argIndex < args.length) {
      result += ' ' + args.slice(argIndex).map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    }

    return result;
  }

  /**
   * Log at TRACE level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  trace(message, ...args) {
    this._log(LogLevel.TRACE, message, ...args);
  }

  /**
   * Log at DEBUG level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    this._log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log at INFO level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    this._log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log at WARN level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    this._log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log at ERROR level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    this._log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Log at FATAL level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  fatal(message, ...args) {
    this._log(LogLevel.FATAL, message, ...args);
  }

  /**
   * Check if TRACE level is enabled
   * @returns {boolean}
   */
  isTraceEnabled() {
    return this.level <= LogLevel.TRACE;
  }

  /**
   * Check if DEBUG level is enabled
   * @returns {boolean}
   */
  isDebugEnabled() {
    return this.level <= LogLevel.DEBUG;
  }

  /**
   * Check if INFO level is enabled
   * @returns {boolean}
   */
  isInfoEnabled() {
    return this.level <= LogLevel.INFO;
  }

  /**
   * Check if WARN level is enabled
   * @returns {boolean}
   */
  isWarnEnabled() {
    return this.level <= LogLevel.WARN;
  }

  /**
   * Check if ERROR level is enabled
   * @returns {boolean}
   */
  isErrorEnabled() {
    return this.level <= LogLevel.ERROR;
  }

  /**
   * Check if FATAL level is enabled
   * @returns {boolean}
   */
  isFatalEnabled() {
    return this.level <= LogLevel.FATAL;
  }
}

/**
 * Logger configuration
 */
export const LoggerConfig = {
  /**
   * Configure global logger settings
   * @param {Object} config - Configuration object
   */
  configure(config = {}) {
    if (config.level !== undefined) {
      Logger.defaultLevel = config.level;
    }

    if (config.pattern) {
      Logger.defaultPattern = config.pattern;
    }

    if (config.appenders) {
      Logger.defaultAppenders = config.appenders;
    }
  }
};

export default Logger;

export { FileAppender, ConsoleAppender, PatternLayout };