/**
 * Logger Utility - Log4j-style Logging System
 * 
 * This module provides a comprehensive logging system inspired by Log4j.
 * It supports multiple log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
 * and provides structured logging with timestamps, module names, and optional data.
 * 
 * Features:
 * - Six log levels for granular control
 * - ISO 8601 timestamp formatting
 * - Module name tracking for easy debugging
 * - Optional structured data logging
 * - Configurable log levels per module
 * 
 * @module utils/logger
 * @version 1.0.0
 * @author ZMusic Team
 */

/**
 * Log Level Constants
 * 
 * Defines the severity levels for logging, from most verbose (TRACE) to most severe (FATAL).
 * Lower numbers indicate more verbose logging.
 * 
 * @constant {Object}
 */
const LogLevel = {
  /** TRACE - Most detailed logging, typically only enabled during development */
  TRACE: 0,
  /** DEBUG - Detailed information useful for debugging */
  DEBUG: 1,
  /** INFO - General information about application operation */
  INFO: 2,
  /** WARN - Warning messages about potential issues */
  WARN: 3,
  /** ERROR - Error events that might still allow the application to continue */
  ERROR: 4,
  /** FATAL - Very severe error events that will presumably lead the application to abort */
  FATAL: 5
};

/**
 * Log Level Names
 * 
 * Human-readable names for each log level, used in log output formatting.
 * 
 * @constant {string[]}
 */
const LevelNames = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

/**
 * Logger Class
 * 
 * Provides logging functionality with support for multiple log levels,
 * module tracking, and structured data logging.
 * 
 * @class Logger
 */
class Logger {
  /**
   * Constructor - Initialize a new Logger instance
   * 
   * @param {string} [moduleName='App'] - Name of the module using this logger
   */
  constructor(moduleName = 'App') {
    /** @type {string} Module name for log identification */
    this.moduleName = moduleName;
    /** @type {number} Current log level threshold */
    this.level = LogLevel.INFO;
  }

  /**
   * Set the log level threshold
   * 
   * Messages below this level will not be logged.
   * 
   * @param {number} level - Log level from LogLevel constants
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Internal logging method
   * 
   * Formats and outputs log messages with timestamp, level, module name, and optional data.
   * 
   * @private
   * @param {number} level - Log level for this message
   * @param {string} message - Log message text
   * @param {Object} [data] - Optional structured data to include
   */
  _log(level, message, data) {
    if (level < this.level) return;
    const timestamp = new Date().toISOString();
    const output = `[${timestamp}] [${LevelNames[level]}] [${this.moduleName}] ${message}`;
    if (data) {
      console.log(output, JSON.stringify(data));
    } else {
      console.log(output);
    }
  }

  /**
   * Log a TRACE level message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Optional structured data
   */
  trace(message, data) { this._log(LogLevel.TRACE, message, data); }
  
  /**
   * Log a DEBUG level message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Optional structured data
   */
  debug(message, data) { this._log(LogLevel.DEBUG, message, data); }
  
  /**
   * Log an INFO level message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Optional structured data
   */
  info(message, data) { this._log(LogLevel.INFO, message, data); }
  
  /**
   * Log a WARN level message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Optional structured data
   */
  warn(message, data) { this._log(LogLevel.WARN, message, data); }
  
  /**
   * Log an ERROR level message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Optional structured data
   */
  error(message, data) { this._log(LogLevel.ERROR, message, data); }
  
  /**
   * Log a FATAL level message
   * 
   * @param {string} message - Log message
   * @param {Object} [data] - Optional structured data
   */
  fatal(message, data) { this._log(LogLevel.FATAL, message, data); }
}

export { Logger, LogLevel };
export default Logger;
