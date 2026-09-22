/**
 * SmsService — SMS provider wrapper with multiple gateway support.
 *
 * Priority chain (picks first that has required env vars configured):
 *   1. Tencent Cloud SMS  (SMS_PROVIDER=tencent)
 *   2. Aliyun SMS        (SMS_PROVIDER=aliyun)
 *   3. Twilio            (SMS_PROVIDER=twilio)
 *   4. DEV MODE FALLBACK — prints the code to server log (no API keys needed).
 *
 * For development, no env vars are required — the service automatically falls
 * back to log-only mode and returns success so the full register/login flow
 * can be tested end-to-end.
 */

import Logger from '../utils/logger.js';
import config from '../config/index.js';

const logger = new Logger('SmsService');

const SMS_TEMPLATES = {
  register: {
    en: '[ZMusic] Your registration code is: {code}. Valid for 10 minutes.',
    zh: '【ZMusic】您的注册验证码是：{code}，10分钟内有效。',
  },
  login: {
    en: '[ZMusic] Your login code is: {code}. Valid for 10 minutes.',
    zh: '【ZMusic】您的登录验证码是：{code}，10分钟内有效。',
  },
  reset: {
    en: '[ZMusic] Your password reset code is: {code}. Valid for 10 minutes.',
    zh: '【ZMusic】您的重置密码验证码是：{code}，10分钟内有效。',
  },
};

function resolveProvider() {
  const explicit = process.env.SMS_PROVIDER || config?.sms?.provider;
  if (explicit) return explicit.toLowerCase();

  if (process.env.TENCENT_SMS_SECRET_ID && process.env.TENCENT_SMS_TEMPLATE_ID) return 'tencent';
  if (process.env.ALIYUN_SMS_ACCESS_KEY_ID && process.env.ALIYUN_SMS_TEMPLATE_CODE) return 'aliyun';
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return 'twilio';
  return 'dev';
}

function formatMessage(purpose, code, lang = 'zh') {
  const tpl = SMS_TEMPLATES[purpose] || SMS_TEMPLATES.register;
  const body = tpl[lang] || tpl.zh || tpl.en;
  return body.replaceAll('{code}', String(code));
}

async function sendTencent({ phone, code, purpose }) {
  // Tencent SMS requires their official SDK (tencentcloud-sdk-nodejs).
  // Try to load it; fall through with a clear error if missing.
  try {
    const tencentcloud = await import('tencentcloud-sdk-nodejs');
    const SmsClient = tencentcloud.sms.v20210111.Client;
    const client = new SmsClient({
      credential: {
        secretId: process.env.TENCENT_SMS_SECRET_ID,
        secretKey: process.env.TENCENT_SMS_SECRET_KEY,
      },
      region: process.env.TENCENT_SMS_REGION || 'ap-guangzhou',
    });
    const resp = await client.SendSms({
      PhoneNumberSet: [phone.startsWith('+') ? phone : `+86${phone.replace(/^0+/, '')}`],
      SmsSdkAppId: process.env.TENCENT_SMS_APP_ID,
      SignName: process.env.TENCENT_SMS_SIGN_NAME,
      TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
      TemplateParamSet: [String(code)],
    });
    const ok = resp?.SendStatusSet?.[0]?.Code === 'Ok';
    if (!ok) throw new Error(JSON.stringify(resp?.SendStatusSet?.[0] || resp));
    return { ok: true, provider: 'tencent', ref: resp?.SendStatusSet?.[0]?.SerialNo };
  } catch (e) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module.*tencentcloud/.test(e.message || '')) {
      throw new Error('Tencent SDK missing: npm i tencentcloud-sdk-nodejs');
    }
    throw e;
  }
}

async function sendAliyun({ phone, code, purpose }) {
  try {
    const Core = await import('@alicloud/dysmsapi20170525');
    const OpenApi = await import('@alicloud/openapi-client');
    const Util = await import('@alicloud/tea-util');
    const config = new OpenApi.default.Config({
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
    });
    config.endpoint = process.env.ALIYUN_SMS_ENDPOINT || 'dysmsapi.aliyuncs.com';
    const client = new Core.default(config);
    const params = {
      PhoneNumbers: phone.replace(/^\+86/, ''),
      SignName: process.env.ALIYUN_SMS_SIGN_NAME,
      TemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
      TemplateParam: JSON.stringify({ code: String(code) }),
    };
    const resp = await client.sendSmsWithOptions(params, new Util.default.RuntimeOptions({}));
    if (resp?.body?.code !== 'OK') throw new Error(JSON.stringify(resp?.body));
    return { ok: true, provider: 'aliyun', ref: resp?.body?.bizId };
  } catch (e) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module.*alicloud/.test(e.message || '')) {
      throw new Error('Aliyun SDK missing: npm i @alicloud/dysmsapi20170525 @alicloud/openapi-client @alicloud/tea-util');
    }
    throw e;
  }
}

async function sendTwilio({ phone, code, purpose, lang }) {
  try {
    const twilio = await import('twilio');
    const client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const toPhone = phone.startsWith('+') ? phone : `+86${phone.replace(/^0+/, '')}`;
    const msg = await client.messages.create({
      body: formatMessage(purpose, code, lang),
      from: process.env.TWILIO_FROM_NUMBER,
      to: toPhone,
    });
    return { ok: true, provider: 'twilio', ref: msg.sid };
  } catch (e) {
    if (e?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find module.*twilio/.test(e.message || '')) {
      throw new Error('Twilio SDK missing: npm i twilio');
    }
    throw e;
  }
}

async function sendDev({ phone, code, purpose }) {
  const line1 = '========================================';
  const line2 = `  ZMusic SMS [DEV MODE] — NO SMS WAS SENT`;
  const line3 = `  To:     ${phone}`;
  const line4 = `  Purpose:${purpose}`;
  const line5 = `  Code:   ${code}    (use this in the SMS input!)`;
  const line6 = '========================================';
  logger.warn('\n' + line1 + '\n' + line2 + '\n' + line3 + '\n' + line4 + '\n' + line5 + '\n' + line6);
  return {
    ok: true,
    provider: 'dev',
    devCode: code,
    note: 'DEV_MODE: code returned in response for local testing',
  };
}

export async function sendSms({ phone, code, purpose, lang = 'zh' }) {
  if (!phone) return { ok: false, error: 'PHONE_REQUIRED' };
  const provider = resolveProvider();

  try {
    switch (provider) {
      case 'tencent': return await sendTencent({ phone, code, purpose });
      case 'aliyun':  return await sendAliyun({ phone, code, purpose });
      case 'twilio':  return await sendTwilio({ phone, code, purpose, lang });
      case 'dev':
      default:        return await sendDev({ phone, code, purpose });
    }
  } catch (e) {
    logger.error(`SMS send failed via ${provider}: ${e.message}`);
    return {
      ok: false,
      error: 'SMS_SEND_FAILED',
      provider,
      detail: process.env.NODE_ENV === 'development' ? e.message : undefined,
    };
  }
}

export function getSmsProvider() {
  return resolveProvider();
}

export default { sendSms, getSmsProvider, formatMessage };
