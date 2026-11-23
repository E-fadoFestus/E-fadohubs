import type { VercelRequest, VercelResponse } from '@vercel/node';
import { POST as gameLedgerPost } from '../../src/app/api/game/ledger/route.js';

function getAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    const u = new URL(origin);
    if (
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname.endsWith('.e-fado.com') ||
      u.hostname === 'e-fado.com' ||
      u.hostname.endsWith('.vercel.app')
    ) {
      return origin;
    }
  } catch {
    return null;
  }
  return null;
}

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
  const allowedOrigin = getAllowedOrigin(req.headers.origin as string | undefined);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'www.e-fado.com';
    const reqUrl = new URL(req.url || '/api/game/ledger', `${proto}://${host}`);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) {
        headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
      }
    }

    const bodyText = await readRawBody(req);
    const webRequest = new Request(reqUrl.toString(), {
      method: 'POST',
      headers,
      body: bodyText
    });

    const webResponse = await gameLedgerPost(webRequest);
    const contentType = webResponse.headers.get('content-type') || 'application/json';
    const text = await webResponse.text();

    res.status(webResponse.status);
    res.setHeader('Content-Type', contentType);
    return res.send(text);
  } catch (err: any) {
    console.error('[Vercel Game Ledger Error]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error handling game ledger update'
    });
  }
}
