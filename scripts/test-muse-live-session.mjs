// scripts/test-muse-live-session.mjs
import { connectCDP, checkLogin, extractAuthToken, fetchFromEdge } from '../src/services/museCdpBridge.js';
import { createHash } from 'crypto';

async function main() {
  console.log('=== Muse Live Session Test ===');
  await connectCDP(9222);
  
  // 1. Check login via CDP bridge (extracts cached profile + live API call)
  console.log('\n1. checkLogin() call:');
  const info = await checkLogin();
  console.log('   loggedIn:', info.loggedIn);
  console.log('   credits:', info.credits);
  console.log('   loginStatus:', info.loginStatus);
  console.log('   liveCredit:', info.liveCredit ?? 'n/a');
  console.log('   source:', info.source ?? 'n/a');
  console.log('   tokenFound:', info.tokenFound);
  console.log('   tokenSource:', info.tokenSource);
  console.log('   msg:', info.msg);
  console.log('   code:', info.code);
  if (info.error) console.log('   error:', info.error);

  // 2. Try direct /project/song/v1/user/info live call via fetchFromEdge
  console.log('\n2. Direct live /project/song/v1/user/info call via fetchFromEdge:');
  const tokenInfo = await extractAuthToken();
  const authToken = tokenInfo.token || info.authToken;
  console.log('   token present:', !!authToken, 'source:', tokenInfo.source);

  const body = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: info.deviceId || 'zmusic-cdp',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'zmusic' + Math.random().toString(36).substring(2, 10),
    ...(authToken ? { authToken } : {}),
    ...(info.ssid ? { sid: info.ssid } : {}),
  };

  let signStr = '';
  Object.keys(body).sort().forEach(k => { signStr += k + body[k]; });
  signStr += 'com.xingchat.web.muse.secret';
  body.sign = createHash('md5').update(signStr, 'utf8').digest('hex');

  const result = await fetchFromEdge(
    'https://project-api.atmob.com/project/song/v1/user/info',
    { method: 'POST', body, authToken }
  );
  console.log('   HTTP:', result.status);
  let data;
  try { data = JSON.parse(result.body); } catch { data = { raw: (result.body || '').substring(0, 500) }; }
  console.log('   code:', data.code, 'msg:', data.msg);
  if (data.data) {
    const d = data.data;
    const mi = d.memberInfo || {};
    console.log('   loginStatus (LIVE):', d.loginStatus);
    console.log('   uid:', d.uid);
    console.log('   LIVE credit:', mi.credit ?? d.credit);
    console.log('   LIVE ep:', mi.evaluationCreditPaid);
    console.log('   LIVE en:', mi.evaluationCreditNoPaid);
    console.log('   LIVE isMember:', mi.isMember, 'paidMember:', mi.paidMember);

    const canGenNow = d.loginStatus === 1 && (mi.credit ?? d.credit ?? 0) > 0;
    console.log('\n   ==> CAN GENERATE NOW?', canGenNow ? 'YES ✅' : 'NO ❌');
    if (!canGenNow) {
      console.log('       Reason:',
        d.loginStatus !== 1 ? 'loginStatus !== 1 (server-side session expired)'
        : 'no credits (0)');
      if (d.loginStatus !== 1) {
        console.log('\n   >> User needs to:');
        console.log('      1. Go to muse.top tab in Edge');
        console.log('      2. Click avatar/menu → Log out');
        console.log('      3. Log back in via SMS/WeChat');
        console.log('      4. Then ZMusic status will show loginStatus=1');
      }
    }
  } else {
    console.log('   (no data) raw:', JSON.stringify(data).substring(0, 500));
  }
  process.exit(0);
}

main().catch(e => { console.error('TEST ERR:', e); process.exit(1); });
