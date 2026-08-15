const AUTO_CONFIG_KEY = 'zmusic_auto_config';

export const AUTO_DEFAULTS = {
  songsPerAuto: 3,
  countdownSeconds: 60,
  songDuration: 120,
  autoChaining: true,
  stopOnError: true,
  maxErrors: 3,
  autoCloseOnStop: true,
  autoCloseOnDone: true,
  autoCloseDelay: 3000,
  perEngineOverrides: {},
};

const DEFAULTS = { ...AUTO_DEFAULTS };

function load() {
  try {
    const raw = localStorage.getItem(AUTO_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch { }
  return { ...DEFAULTS };
}

export function getAutoConfig() {
  return load();
}

export function setAutoConfig(partial) {
  const current = load();
  const updated = { ...current, ...partial };
  try {
    localStorage.setItem(AUTO_CONFIG_KEY, JSON.stringify(updated));
  } catch { }
  return updated;
}

export function getEngineSongCount(engine) {
  const config = load();
  const override = config.perEngineOverrides?.[engine];
  return override ?? config.songsPerAuto;
}

export function getSongDuration(engine) {
  const config = load();
  const override = config.perEngineOverrides?.[`${engine}_duration`];
  return override ?? config.songDuration;
}

export function getCountdownSeconds() {
  const config = load();
  return config.countdownSeconds ?? DEFAULTS.countdownSeconds;
}

export function getMaxErrors(_engine) {
  const config = load();
  return config.maxErrors ?? DEFAULTS.maxErrors;
}

export function shouldAutoChain() {
  const config = load();
  return config.autoChaining ?? DEFAULTS.autoChaining;
}

export function shouldStopOnError() {
  const config = load();
  return config.stopOnError ?? DEFAULTS.stopOnError;
}

export function shouldAutoCloseOnStop() {
  const config = load();
  return config.autoCloseOnStop ?? DEFAULTS.autoCloseOnStop;
}

export function shouldAutoCloseOnDone() {
  const config = load();
  return config.autoCloseOnDone ?? DEFAULTS.autoCloseOnDone;
}

export function getAutoCloseDelay() {
  const config = load();
  return config.autoCloseDelay ?? DEFAULTS.autoCloseDelay;
}

export { DEFAULTS };
