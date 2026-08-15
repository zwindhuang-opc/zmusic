/**
 * autoConfig - Centralized configuration for AUTO mode settings
 *
 * Stores user preferences for auto-generation in localStorage.
 * Provides defaults and a simple getter/setter API.
 */

const CONFIG_KEY = 'zmusic_auto_config';

const DEFAULTS = {
  songsPerAuto: 5,       // Default: 5 songs per AUTO cycle
  countdownSeconds: 60,  // Seconds to spend "thinking" before generation
  autoChaining: true,    // Auto-chain to next platform after current finishes
  stopOnError: true,     // Stop AUTO when errors occur
  maxErrors: 8,          // Max consecutive errors before auto-stop (soft safety net)
  autoCloseOnStop: true, // Auto-close all dialogs/panels when AUTO is stopped
  autoCloseOnDone: true, // Auto-close all dialogs/panels when AUTO finishes all songs
  autoCloseDelay: 3000,  // Delay in ms before auto-closing (grace period to see results)
  // Per-engine song count overrides (null = use songsPerAuto default)
  perEngineOverrides: {
    muse: null,
    suno: null,
    melo: null,
  },
};

function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}

export function getAutoConfig() {
  return loadConfig();
}

export function setAutoConfig(partial) {
  const current = loadConfig();
  const updated = { ...current, ...partial };
  saveConfig(updated);
  return updated;
}

export function getEngineSongCount(engine) {
  const config = loadConfig();
  const override = config.perEngineOverrides?.[engine];
  return override || config.songsPerAuto;
}

/**
 * Get the max consecutive errors before auto-stop, dynamically computed
 * from the engine's song count + a small buffer (never less than 3).
 * This replaces the old hardcoded `8` everywhere.
 */
export function getMaxErrors(engine) {
  const count = getEngineSongCount(engine);
  return Math.max(count + 2, 3);
}

export function useAutoConfig() {
  const config = loadConfig();
  return {
    config,
    setConfig: (partial) => setAutoConfig(partial),
    getEngineSongCount,
    getMaxErrors,
  };
}

export { DEFAULTS as AUTO_DEFAULTS };