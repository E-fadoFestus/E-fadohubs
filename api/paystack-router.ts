import type { VercelRequest, VercelResponse } from '@vercel/node';
import { POST as paystackInitializePost } from '../src/app/api/paystack/initialize/route';
import { GET as paystackVerifyGet, POST as paystackVerifyPost } from '../src/app/api/paystack/verify/route';
import { GET as paystackBanksGet } from '../src/app/api/paystack/banks/route';
import { POST as paystackVerifyAccountPost } from '../src/app/api/paystack/verify-account/route';
import { POST as paystackWithdrawPost } from '../src/app/api/paystack/withdraw/route';
import { GET as paystackWithdrawStatusGet } from '../src/app/api/paystack/withdraw/status/route';
import { POST as paystackWebhookPost } from '../src/app/api/webhook/paystack/route';

async function readRawBody(req: VercelRequest): Promise<string | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return undefined;
  }
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return req.body;
    if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
    return JSON.stringify(req.body);
  }
  return await new Promise<string | undefined>((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      resolve(chunks.length ? Buffer.concat(chunks).toString('utf8') : undefined);
    });
    req.on('error', () => resolve(undefined));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-paystack-signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'www.e-fado.com';
    const reqUrl = new URL(req.url || '/api/paystack', `${proto}://${host}`);
    const action = String(req.query?.action || '').toLowerCase().trim();

    // Determine target handler from rewrite ?action=... or URL pathname
    let resolvedAction = action;
    if (!resolvedAction) {
      const path = reqUrl.pathname.toLowerCase();
      if (path.includes('withdraw/status') || path.includes('withdraw-status')) resolvedAction = 'withdraw-status';
      else if (path.includes('verify-account')) resolvedAction = 'verify-account';
      else if (path.includes('initialize')) resolvedAction = 'initialize';
      else if (path.includes('withdraw')) resolvedAction = 'withdraw';
      else if (path.includes('verify')) resolvedAction = 'verify';
      else if (path.includes('banks')) resolvedAction = 'banks';
      else if (path.includes('webhook')) resolvedAction = 'webhook';
    }

    let routeFn: ((r: Request) => Promise<Response>) | null = null;
    if (resolvedAction === 'initialize' && req.method === 'POST') routeFn = paystackInitializePost;
    else if (resolvedAction === 'banks' && req.method === 'GET') routeFn = paystackBanksGet;
    else if (resolvedAction === 'verify-account' && req.method === 'POST') routeFn = paystackVerifyAccountPost;
    else if (resolvedAction === 'withdraw' && req.method === 'POST') routeFn = paystackWithdrawPost;
    else if (resolvedAction === 'withdraw-status' && req.method === 'GET') routeFn = paystackWithdrawStatusGet;
    else if (resolvedAction === 'verify') {
      routeFn = req.method === 'POST' ? paystackVerifyPost : paystackVerifyGet;
    } else if (resolvedAction === 'webhook' && req.method === 'POST') {
      routeFn = paystackWebhookPost;
    }

    if (!routeFn) {
      return res.status(404).json({ success: false, error: `Unknown or unsupported Paystack route: ${resolvedAction || reqUrl.pathname}` });
    }

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) {
        headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
      }
    }

    const bodyText = await readRawBody(req);
    const webRequest = new Request(reqUrl.toString(), {
      method: req.method || 'GET',
      headers,
      body: bodyText
    });

    const webResponse = await routeFn(webRequest);
    const contentType = webResponse.headers.get('content-type') || 'application/json';
    const text = await webResponse.text();

    res.status(webResponse.status);
    res.setHeader('Content-Type', contentType);
    return res.send(text);
  } catch (err: any) {
    console.error('[Vercel Paystack Router Error]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error handling Paystack request'
    });
  }
}
