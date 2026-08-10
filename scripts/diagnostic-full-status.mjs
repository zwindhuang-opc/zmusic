// scripts/diagnostic-full-status.mjs - Full CDP diagnostic for all 3 engines
import WebSocket from 'ws';
import { createHash } from 'crypto';
import http from 'http';
import https from 'https';

const HTTP = 'http://localhost:9222/json';

function httpReq(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const lib = u.protocol === 'https:' ? https : http;
        const req = lib.request({
            hostname: u.hostname,
            port: u.port || (u.protocol === 'https:' ? 443 : 80),
            path: u.pathname + u.search,
            method: opts.method || 'GET',
            headers: opts.headers || {},
            timeout: opts.timeout || 10000,
        }, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
        });
        req.on('error', reject);
        if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
        req.end();
    });
}

async function main() {
    // 1. List CDP targets
    const targetsRes = await fetch(HTTP).then(r => r.json());
    const pages = targetsRes.filter(t => t.type === 'page');
    console.log('=== STEP 1: CDP Pages ===');
    pages.forEach((p, i) => console.log(`  [${i}] ${p.url.substring(0, 100)} (id=${p.id.substring(0, 10)}...)`));

    const musePage = pages.find(p => p.url.includes('muse.top'));
    const meloPage = pages.find(p => p.url.includes('51melo'));
    const sunoPage = pages.find(p => p.url.includes('suno') && !p.url.includes('localhost') && !p.url.includes('github'));
    console.log('\nMuse page:', musePage ? 'FOUND' : 'NOT FOUND');
    console.log('Melo page:', meloPage ? 'FOUND' : 'NOT FOUND');
    console.log('Suno page:', sunoPage ? 'FOUND' : 'NOT FOUND');

    if (!musePage) { console.log('Muse page not found - exiting'); process.exit(1); }

    // 2. Connect to muse.top page, get localStorage
    console.log('\n=== STEP 2: Connect to muse.top tab ===');
    const museWs = new WebSocket(musePage.webSocketDebuggerUrl);
    await new Promise(r => museWs.once('open', r));
    console.log('Connected to muse.top via CDP');

    let callId = 1;
    function cdpCmd(ws, method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = callId++;
            const msg = JSON.stringify({ id, method, params });
            ws.send(msg);
            const handler = (data) => {
                const obj = JSON.parse(data.toString());
                if (obj.id === id) {
                    ws.removeListener('message', handler);
                    resolve(obj.result || obj.error || {});
                }
            };
            ws.on('message', handler);
            setTimeout(() => { ws.removeListener('message', handler); reject(new Error('CDP timeout: ' + method)); }, 8000);
        });
    }

    await cdpCmd(museWs, 'Runtime.enable');

    // Read ALL localStorage keys
    const allKeysExpr = `
    (function(){
      try {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) { keys.push(localStorage.key(i)); }
        var dump = {};
        keys.forEach(k => { dump[k] = localStorage.getItem(k); });
        return JSON.stringify(dump);
      } catch(e) { return JSON.stringify({ERR: e.message}); }
    })()
  `;
    const keysRes = await cdpCmd(museWs, 'Runtime.evaluate', { expression: allKeysExpr, returnByValue: true });
    const storageStr = keysRes?.result?.value || '{}';
    const storage = JSON.parse(storageStr);
    console.log('\nmuse.top localStorage KEYS:', Object.keys(storage));
    const userStore = JSON.parse(storage['muse-user-store'] || '{}');
    console.log('muse-user-store TOP-level keys:', Object.keys(userStore));
    if (userStore.state) console.log('  state keys:', Object.keys(userStore.state));

    const profile = userStore.state?.profile || userStore.profile || {};
    const token = userStore.state?.token || userStore.token || '';
    const memberInfo = profile.memberInfo || {};
    console.log('\n=== MUSE USER INFO (from localStorage cache) ===');
    console.log('  user:', profile.userName || profile.phone || profile.nickname || '(unknown)');
    console.log('  userId:', profile.userId);
    console.log('  deviceId:', profile.deviceId);
    console.log('  ssid:', profile.ssid ? 'PRESENT (' + profile.ssid.substring(0, 8) + '...)' : 'ABSENT');
    console.log('  uid:', profile.uid);
    console.log('  cached credit:', memberInfo.credit ?? profile.credit ?? 'undefined');
    console.log('  evaluationCreditPaid:', memberInfo.evaluationCreditPaid);
    console.log('  evaluationCreditNoPaid:', memberInfo.evaluationCreditNoPaid);
    console.log('  isMember:', memberInfo.isMember, 'paidMember:', memberInfo.paidMember);
    console.log('  loginStatus (cache):', profile.loginStatus);
    console.log('  isLoggedIn (cache):', userStore.state?.isLoggedIn);
    console.log('  token present:', token ? 'YES (' + (token.length) + ' chars, starts with ' + token.substring(0, 12) + '...)' : 'NO');

    // Decode JWT
    if (token && token.includes('.')) {
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const now = Date.now() / 1000;
            console.log('\n  JWT decode:');
            console.log('    iss:', payload.iss);
            console.log('    sub:', payload.sub);
            console.log('    iat:', payload.iat ? new Date(payload.iat * 1000).toISOString() : 'n/a');
            console.log('    exp:', payload.exp ? new Date(payload.exp * 1000).toISOString() : 'n/a');
            console.log('    EXPIRED:', payload.exp && payload.exp < now ? 'YES' : 'NO');
        } catch (e) { console.log('  JWT decode failed:', e.message); }
    }

    // 3. Make LIVE API call
    console.log('\n=== STEP 3: LIVE Muse API /user/info call ===');
    const authToken = token;
    const deviceId = profile.deviceId || 'zmusic-cdp';
    const ssid = profile.ssid;
    const nonce = 'zmusic' + Math.random().toString(36).substring(2, 10);
    const body = {
        packageName: 'com.xingchat.web.muse',
        appPlatform: 4,
        channelName: 'web',
        machineId: deviceId,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: nonce,
        ...(authToken ? { authToken } : {}),
        ...(ssid ? { sid: ssid } : {}),
    };

    // Compute signature (must match museCdpBridge!)
    let signStr = '';
    const sortedKeys = Object.keys(body).sort();
    sortedKeys.forEach(k => { signStr += k + body[k]; });
    signStr += 'com.xingchat.web.muse.secret';
    const sign = createHash('md5').update(signStr, 'utf8').digest('hex');
    body.sign = sign;

    console.log('  request body keys:', Object.keys(body).join(','));
    console.log('  authToken present:', !!authToken);
    console.log('  sid present:', !!ssid);
    console.log('  POST https://muse.top/api/v1/activity/user/info');

    const res = await httpReq('https://muse.top/api/v1/activity/user/info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0',
            'Origin': 'https://muse.top',
            'Referer': 'https://muse.top/',
            ...(authToken ? { Authorization: 'Bearer ' + authToken, authtoken: authToken, 'x-auth-token': authToken } : {}),
            ...(ssid ? { Cookie: 'ssid=' + ssid } : {}),
        },
        body: JSON.stringify(body),
        timeout: 15000,
    });

    console.log('  HTTP status:', res.status);
    let result;
    try { result = JSON.parse(res.body); }
    catch { result = { raw: res.body.substring(0, 300) }; }
    console.log('  response body:');
    console.log('    code:', result.code, 'msg:', result.msg);
    if (result.data) {
        const d = result.data;
        console.log('    loginStatus:', d.loginStatus, 'uid:', d.uid);
        const mi = d.memberInfo || {};
        console.log('    LIVE credit:', mi.credit ?? d.credit);
        console.log('    evaluationCreditPaid:', mi.evaluationCreditPaid);
        console.log('    evaluationCreditNoPaid:', mi.evaluationCreditNoPaid);
        console.log('    isMember:', mi.isMember, 'paidMember:', mi.paidMember);
    } else {
        console.log('    (no data key in response)');
        console.log('    raw:', JSON.stringify(result).substring(0, 500));
    }

    const liveLoginStatus = result?.data?.loginStatus;
    const liveCredit = result?.data?.memberInfo?.credit ?? result?.data?.credit;
    const cachedCredit = memberInfo.credit ?? profile.credit;

    console.log('\n=== COMPARISON: CACHED vs LIVE ===');
    console.log('  Cached credit (muse.top UI shows this):', cachedCredit);
    console.log('  Live API credit (would be used for generation):', liveCredit);
    console.log('  Live loginStatus:', liveLoginStatus);
    console.log('  Session valid for generation?',
        liveLoginStatus === 1 && (liveCredit > 0 || cachedCredit > 0) ? 'YES'
            : liveLoginStatus === 1 ? 'YES but no live credits'
                : 'NO (code=1006/loginStatus!=1)');

    museWs.close();

    // 4. Read Melo tab localStorage if present
    console.log('\n=== STEP 4: h.51melo.com localStorage ===');
    if (meloPage) {
        const meloWs = new WebSocket(meloPage.webSocketDebuggerUrl);
        await new Promise(r => meloWs.once('open', r));
        callId = 1;
        await cdpCmd(meloWs, 'Runtime.enable');

        const keysRes = await cdpCmd(meloWs, 'Runtime.evaluate', { expression: allKeysExpr, returnByValue: true });
        const storage = JSON.parse(keysRes?.result?.value || '{}');
        console.log('  localStorage KEYS:', Object.keys(storage));
        Object.keys(storage).forEach(k => {
            const v = storage[k];
            if (v && v.length < 200) console.log('    ' + k + ' = ' + v);
            else console.log('    ' + k + ' = (' + (v?.length || 0) + ' chars) ' + (v || '').substring(0, 80));
        });

        // Look for MELO_ACCESS_TOKEN / token / jwt
        const possibleKeys = Object.keys(storage).filter(k =>
            /token|jwt|auth|session|login|user|me/i.test(k)
        );
        console.log('\n  Potential auth-related keys:', possibleKeys);

        // Also check cookies via CDP Network.getCookies
        await cdpCmd(meloWs, 'Network.enable');
        const cookies = await cdpCmd(meloWs, 'Network.getCookies');
        const allCookies = cookies?.cookies || [];
        console.log('\n  Cookie count:', allCookies.length);
        allCookies.filter(c => /51melo|h\.51melo/i.test(c.domain)).forEach(c => {
            console.log('    Cookie: ' + c.name + ' = ' + (c.value.length < 80 ? c.value : c.value.substring(0, 60) + '...') + ' [' + c.domain + ']');
        });

        meloWs.close();
    } else {
        console.log('  (h.51melo.com tab not found in CDP pages)');
    }
}

main().catch(e => { console.error('DIAG ERR:', e); process.exit(1); });
