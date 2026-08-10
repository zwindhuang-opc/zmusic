import dotenv from 'dotenv';
dotenv.config();

/**
 * On Windows, force the console to UTF-8 so Chinese characters in log
 * messages (lyrics, error text from Muse/Suno/Melo APIs) display correctly
 * instead of being replaced with "????" in the terminal and log files.
 * This must run before any Logger instance writes to stdout.
 */
if (process.platform === 'win32') {
  try {
    // Set the Windows console code page to 65001 (UTF-8)
    process.stdout.setDefaultEncoding('utf8');
    process.stderr.setDefaultEncoding('utf8');
  } catch { /* best-effort — continue even if setting encoding fails */ }
}

export default function init() {
  console.log('Environment variables loaded from .env');
}