require('./_server_bundle.cjs');
const { handleRoute } = require('./_server_bundle.cjs');

function normalizePath(rawPath) {
  if (!rawPath) return '/api/health';
  if (rawPath.startsWith('/api/')) return rawPath;
  if (rawPath.startsWith('/.netlify/functions/api/')) {
    return rawPath.replace('/.netlify/functions/api/', '/api/');
  }
  if (rawPath === '/.netlify/functions/api' || rawPath === '/api') {
    return '/api/health';
  }
  return '/api' + rawPath;
}

async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'Content-Type, Authorization',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-max-age': '86400'
      },
      body: ''
    };
  }

  let parsedBody = {};
  if (event.body) {
    try {
      if (typeof event.body === 'string') {
        parsedBody = JSON.parse(event.body);
      } else {
        parsedBody = event.body;
      }
    } catch (parseError) {
      parsedBody = {};
    }
  }

  const queryString = event.queryStringParameters
    ? '?' + new URLSearchParams(event.queryStringParameters).toString()
    : '';

  const normalizedPath = normalizePath(event.path);

  const req = {
    method: event.httpMethod || 'GET',
    path: normalizedPath,
    originalUrl: normalizedPath + queryString,
    headers: event.headers || {},
    body: parsedBody,
    query: event.queryStringParameters || {},
    params: {}
  };

  let resolved = false;
  const responsePromise = new Promise((resolve) => {
    const res = {
      _statusCode: 200,
      _headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'Content-Type, Authorization',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      _body: '',
      headersSent: false,
      status(code) { this._statusCode = code; return this; },
      setHeader(name, value) { this._headers[name.toLowerCase()] = String(value); return this; },
      getHeader(name) { return this._headers[name.toLowerCase()]; },
      json(data) {
        if (resolved) return;
        resolved = true;
        this.headersSent = true;
        this._headers['content-type'] = 'application/json';
        this._body = JSON.stringify(data);
        resolve({ statusCode: this._statusCode, headers: this._headers, body: this._body });
      },
      send(data) {
        if (resolved) return;
        resolved = true;
        this.headersSent = true;
        if (typeof data === 'object') {
          this._headers['content-type'] = 'application/json';
          this._body = JSON.stringify(data);
        } else {
          this._headers['content-type'] = 'text/plain';
          this._body = String(data);
        }
        resolve({ statusCode: this._statusCode, headers: this._headers, body: this._body });
      },
      end(data) {
        if (resolved) return;
        resolved = true;
        this.headersSent = true;
        if (data) this._body = String(data);
        resolve({ statusCode: this._statusCode, headers: this._headers, body: this._body });
      }
    };

    try {
      const queryPart = req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : '';
      const url = new URL(normalizedPath + (queryPart ? '?' + queryPart : ''), `https://${req.headers.host || 'localhost'}`);
      handleRoute(req, res, url, req.method, req.body).catch(err => {
        if (resolved) return;
        resolved = true;
        console.error('[Netlify API] Route handler error:', err.message, err.stack);
        res.status(500).json({ success: false, error: err.message });
      });
    } catch (uncaughtError) {
      if (resolved) return;
      resolved = true;
      console.error('[Netlify API] Uncaught error:', uncaughtError.message, uncaughtError.stack);
      resolve({
        statusCode: 500,
        headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
        body: JSON.stringify({ success: false, error: uncaughtError.message })
      });
    }
  });

  return responsePromise;
}

module.exports = { handler };
