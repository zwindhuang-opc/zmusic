/**
 * Muse Puppeteer Bridge - Generate songs via Edge browser CDP connection.
 *
 * HOW IT WORKS:
 *   1. Connects to user's Edge browser on localhost:9222 (CDP port)
 *   2. Navigates to muse.top homepage
 *   3. Types the prompt into the textarea
 *   4. Clicks the Generate button via DOM events
 *   5. Waits for generation to complete (~60-90s)
 *   6. Navigates to Assets page to find the new song
 *   7. Clicks play button to trigger audio download
 *   8. Captures the audio URL from network requests
 *
 * PREREQUISITES:
 *   - Edge browser running with --remote-debugging-port=9222
 *   - User logged into muse.top in that Edge instance
 *
 * @module services/musePuppeteerBridge
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const CDP_PORT = 9222;
const CDP_HOST = 'localhost';

let browserInstance = null;
let connectionPromise = null;

/**
 * Connect to Edge CDP. Reuses existing connection if available.
 */
async function connectEdge() {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const browser = await puppeteer.connect({
        browserURL: `http://${CDP_HOST}:${CDP_PORT}`,
        defaultViewport: null,
        protocolTimeout: 60000,
      });
      browserInstance = browser;
      return browser;
    } catch (e) {
      connectionPromise = null;
      throw new Error(`Cannot connect to Edge CDP on port ${CDP_PORT}. 
        Please launch Edge with: msedge.exe --remote-debugging-port=9222 
        Error: ${e.message}`);
    }
  })();

  return connectionPromise;
}

/**
 * Get or create a Muse page in the browser.
 */
async function getMusePage() {
  const browser = await connectEdge();
  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('muse.top'));
  if (!page) {
    page = pages[0];
    await page.goto('https://muse.top/', { waitUntil: 'networkidle2', timeout: 45000 });
  }
  return page;
}

/**
 * Check if the user is logged in to Muse.
 * @returns {Promise<{loggedIn: boolean, credits: number|null}>}
 */
async function checkLogin() {
  try {
    const page = await getMusePage();
    const client = await page.target().createCDPSession();

    const result = await client.send('Runtime.evaluate', {
      expression: `
        (function() {
          const bodyText = document.body.innerText;
          const creditMatch = bodyText.match(/(\\d+)\\s*✨/);
          const hasAvatar = document.querySelectorAll('[class*="avatar"]').length > 0;
          return JSON.stringify({
            loggedIn: hasAvatar || bodyText.includes('会员福利') || bodyText.includes('资产'),
            credits: creditMatch ? parseInt(creditMatch[1]) : null,
            pageText: bodyText.substring(0, 200),
          });
        })()
      `,
      returnByValue: true,
    });

    const data = JSON.parse(result.result?.value || '{}');
    return { loggedIn: data.loggedIn === true, credits: data.credits };
  } catch (e) {
    return { loggedIn: false, credits: null, error: e.message };
  }
}

/**
 * Generate a song via the Edge browser UI.
 *
 * @param {Object} params
 * @param {string} params.prompt - Song description/lyrics
 * @param {string} [params.title] - Song title (optional)
 * @param {string} [params.mode] - 'quick' or 'master'
 * @param {number} [params.timeout] - Max wait time in ms (default 180000)
 * @returns {Promise<Object>} Generation result with audio URL
 */
async function generateSong(params) {
  const {
    prompt,
    title,
    mode = 'quick',
    timeout = 180000,
  } = params;

  if (!prompt || prompt.length < 3) {
    throw new Error('Prompt must be at least 3 characters');
  }

  const page = await getMusePage();
  const client = await page.target().createCDPSession();

  // Enable network monitoring to capture audio URL
  await client.send('Network.enable');
  const capturedRequests = [];

  const networkHandler = (params) => {
    const url = params.request?.url || params.response?.url || '';
    if (url.includes('.mp3') || url.includes('audio') || url.includes('cdn-work')) {
      capturedRequests.push({
        url: url.substring(0, 500),
        type: params.requestType || params.response?.contentType || 'unknown',
        timestamp: Date.now(),
      });
    }
  };

  client.on('Network.requestWillBeSent', networkHandler);
  client.on('Network.responseReceived', networkHandler);

  // Make sure we're on the homepage
  if (!page.url().includes('muse.top/') || page.url().includes('/assets') || page.url().includes('/creation')) {
    await page.goto('https://muse.top/', { waitUntil: 'networkidle2', timeout: 45000 });
  }

  await new Promise(r => setTimeout(r, 3000));

  // Step 1: Type prompt
  await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const el = document.querySelector('textarea');
        if (!el) return 'no textarea';
        const ns = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        const prompt = arguments[0] || '';
        if (ns) ns.call(el, prompt);
        else el.value = prompt;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ready';
      })()
    `,
    returnByValue: true,
  }, prompt);

  await new Promise(r => setTimeout(r, 1500));

  // Step 2: Click generate button
  const clickResult = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          const t = b.textContent.trim();
          if ((t.includes('生成') || t.toLowerCase().includes('generate')) && 
              !t.includes('刷新') && !t.toLowerCase().includes('refresh')) {
            b.click();
            return 'Clicked: ' + t;
          }
        }
        return 'not found';
      })()
    `,
    returnByValue: true,
  });

  const clickMsg = clickResult.result?.value || 'click failed';

  // Step 3: Wait for generation to complete
  const startTime = Date.now();
  const pollInterval = 5000;
  let creditsBefore = null;
  let generationComplete = false;

  // Get initial credits
  const initialState = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const bodyText = document.body.innerText;
        const match = bodyText.match(/(\\d+)\\s*✨/);
        return JSON.stringify({ credits: match ? match[1] : 'unknown' });
      })()
    `,
    returnByValue: true,
  });
  creditsBefore = JSON.parse(initialState.result?.value || '{}').credits;

  // Poll for completion
  while (Date.now() - startTime < timeout) {
    await new Promise(r => setTimeout(r, pollInterval));

    try {
      const state = await client.send('Runtime.evaluate', {
        expression: `
          (function() {
            const bodyText = document.body.innerText;
            const isGenerating = bodyText.includes('生成中') || 
                                bodyText.includes('深度思考') || 
                                bodyText.includes('Generating');
            const match = bodyText.match(/(\\d+)\\s*✨/);
            return JSON.stringify({
              isGenerating,
              credits: match ? match[1] : 'unknown',
              url: location.href,
            });
          })()
        `,
        returnByValue: true,
      });

      const s = JSON.parse(state.result?.value || '{}');

      // Credits decreased = generation completed
      if (s.credits && s.credits !== creditsBefore && !s.isGenerating) {
        generationComplete = true;
        break;
      }

      // If no longer generating and credits changed
      if (!s.isGenerating && s.credits && s.credits !== creditsBefore) {
        generationComplete = true;
        break;
      }

      // If credits changed mid-generation, still wait for it to finish
      if (!s.isGenerating) {
        generationComplete = true;
        break;
      }
    } catch (e) {
      // Page might be busy, continue polling
    }
  }

  if (!generationComplete) {
    // Check if we have captured the audio URL already
    if (capturedRequests.length === 0) {
      throw new Error(`Generation timed out after ${timeout}ms`);
    }
  }

  // Step 4: Navigate to Assets page to find and play the song
  await page.goto('https://muse.top/assets', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Step 5: Find and click the play button for the most recent song
  // The most recent song is typically the first one in the list
  const playResult = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        // Find the first list item (most recent song)
        const listItems = document.querySelectorAll('[class*="list-item"], [class*="ListItem"]');
        if (listItems.length === 0) return JSON.stringify({ error: 'No songs found' });
        
        const firstItem = listItems[0];
        const h3 = firstItem.querySelector('h3');
        const title = h3?.textContent?.trim() || 'Unknown';
        
        // Click play button or the item itself
        const playBtn = firstItem.querySelector('[class*="play"], [class*="Play"]');
        if (playBtn) {
          playBtn.click();
        } else {
          firstItem.click();
        }
        
        return JSON.stringify({ 
          clicked: true, 
          title,
          hasPlayBtn: !!playBtn,
        });
      })()
    `,
    returnByValue: true,
  });

  const playData = JSON.parse(playResult.result?.value || '{}');

  // Wait for audio URL to be captured
  await new Promise(r => setTimeout(r, 5000));

  // Step 6: Collect all captured audio URLs
  const audioRequests = capturedRequests.filter(r => r.url.includes('.mp3'));

  // Also check for audio elements on the page
  const audioElementCheck = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const audios = document.querySelectorAll('audio');
        const results = [];
        audios.forEach(a => {
          if (a.src && a.src.includes('muse') || a.src.includes('cdn-work')) {
            results.push({
              src: a.src,
              duration: a.duration,
            });
          }
        });
        return JSON.stringify(results);
      })()
    `,
    returnByValue: true,
  });

  const audioElements = JSON.parse(audioElementCheck.result?.value || '[]');

  // Determine the audio URL
  let audioUrl = null;
  if (audioRequests.length > 0) {
    audioUrl = audioRequests[audioRequests.length - 1].url;
  } else if (audioElements.length > 0) {
    audioUrl = audioElements[0].src;
  }

  // Extract song ID from URL
  let songId = null;
  if (audioUrl) {
    const match = audioUrl.match(/\/audio\/([a-f0-9]+)/);
    if (match) songId = match[1];
  }

  // Get final credits
  const finalState = await client.send('Runtime.evaluate', {
    expression: `
      (function() {
        const bodyText = document.body.innerText;
        const match = bodyText.match(/(\\d+)\\s*✨/);
        return JSON.stringify({ credits: match ? match[1] : 'unknown' });
      })()
    `,
    returnByValue: true,
  }).catch(() => null);

  const finalCredits = finalState
    ? JSON.parse(finalState.result?.value || '{}').credits
    : null;

  // Clean up network listeners
  client.removeAllListeners('Network.requestWillBeSent');
  client.removeAllListeners('Network.responseReceived');
  await client.send('Network.disable').catch(() => { });

  return {
    success: !!audioUrl,
    songId,
    title: playData.title || title || 'Generated Song',
    audioUrl,
    imageUrl: songId ? `https://cdn-work.muse.top/work/image/${songId}.jpeg` : null,
    creditsBefore,
    creditsAfter: finalCredits,
    creditsUsed: creditsBefore && finalCredits ? parseInt(creditsBefore) - parseInt(finalCredits) : 14,
    generatedAt: new Date().toISOString(),
    mode,
    prompt,
  };
}

/**
 * Close the browser connection gracefully.
 */
async function disconnect() {
  if (browserInstance) {
    try {
      await browserInstance.disconnect();
    } catch (e) {
      // Ignore
    }
    browserInstance = null;
    connectionPromise = null;
  }
}

export {
  connectEdge,
  getMusePage,
  checkLogin,
  generateSong,
  disconnect,
};