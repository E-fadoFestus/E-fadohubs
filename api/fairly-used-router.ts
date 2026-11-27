import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { registerFairlyUsedRoutes } from '../src/lib/fairly-used-routes.js';

let cachedApp: express.Express | null = null;

function getFairlyUsedExpressApp(): express.Express {
  if (cachedApp) return cachedApp;

  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-paystack-signature, verif-hash'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    next();
  });

  app.use((req: any, res, next) => {
    if (req._body) return next();
    return express.json({
      limit: '50mb',
      verify: (r: any, _res, buf) => {
        r.rawBody = buf;
      }
    })(req, res, next);
  });

  registerFairlyUsedRoutes(app);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl || req.url}`
    });
  });

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('[Vercel Fairly Used Express Middleware Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: err?.message || 'Internal server error handling Fairly Used Market request'
      });
    }
  });

  cachedApp = app;
  return app;
}

async function readNormalizedBody(req: VercelRequest): Promise<{
  parsedBody: any;
  rawBody: Buffer | undefined;
  alreadyParsed: boolean;
}> {
  const method = String(req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { parsedBody: undefined, rawBody: undefined, alreadyParsed: true };
  }

  const existingRaw: Buffer | undefined = Buffer.isBuffer((req as any).rawBody)
    ? (req as any).rawBody
    : typeof (req as any).rawBody === 'string'
      ? Buffer.from((req as any).rawBody, 'utf8')
      : undefined;

  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) {
      const str = req.body.toString('utf8');
      let parsed: any = {};
      try {
        parsed = str ? JSON.parse(str) : {};
      } catch {
        parsed = {};
      }
      return { parsedBody: parsed, rawBody: existingRaw || req.body, alreadyParsed: true };
    }

    if (typeof req.body === 'string') {
      let parsed: any = {};
      try {
        parsed = req.body.trim() ? JSON.parse(req.body) : {};
      } catch {
        parsed = {};
      }
      return {
        parsedBody: parsed,
        rawBody: existingRaw || Buffer.from(req.body, 'utf8'),
        alreadyParsed: true
      };
    }

    if (typeof req.body === 'object') {
      let synthesizedRaw = existingRaw;
      if (!synthesizedRaw) {
        try {
          synthesizedRaw = Buffer.from(JSON.stringify(req.body), 'utf8');
        } catch {
          synthesizedRaw = undefined;
        }
      }
      return { parsedBody: req.body, rawBody: synthesizedRaw, alreadyParsed: true };
    }
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req as any) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = chunks.length ? Buffer.concat(chunks) : existingRaw;
    if (!raw || raw.length === 0) {
      return { parsedBody: {}, rawBody: raw, alreadyParsed: true };
    }
    const text = raw.toString('utf8');
    let parsed: any = {};
    try {
      parsed = text.trim() ? JSON.parse(text) : {};
    } catch {
      parsed = {};
    }
    return { parsedBody: parsed, rawBody: raw, alreadyParsed: true };
  } catch {
    return { parsedBody: {}, rawBody: existingRaw, alreadyParsed: true };
  }
}

function resolveTargetUrl(req: VercelRequest): string {
  const rawUrl = String(req.url || '/api/fairly-used-router');
  const parsedUrl = new URL(rawUrl, 'https://www.e-fado.com');

  const queryRouteRaw = req.query?.__route;
  const queryRoute = Array.isArray(queryRouteRaw)
    ? queryRouteRaw.join('/')
    : typeof queryRouteRaw === 'string'
      ? queryRouteRaw
      : '';

  const routeParam = parsedUrl.searchParams.get('__route') || queryRoute;
  if (routeParam) {
    parsedUrl.searchParams.delete('__route');
    const remainingQuery = parsedUrl.searchParams.toString();
    const normalizedPath = routeParam.startsWith('/') ? routeParam : `/${routeParam}`;
    return `${normalizedPath}${remainingQuery ? `?${remainingQuery}` : ''}`;
  }

  const origHeader = req.headers['x-vercel-original-url'] || req.headers['x-rewrite-url'];
  if (typeof origHeader === 'string' && origHeader.startsWith('/api/')) {
    return origHeader;
  }

  return rawUrl;
}

async function dispatchToExpress(
  app: express.Express,
  req: VercelRequest,
  res: VercelResponse,
  targetUrl: string,
  parsedBody: any,
  rawBody: Buffer | undefined
): Promise<void> {
  const expressReq: any = new Readable({
    read() {
      this.push(null);
    }
  });

  const cleanHeaders: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(req.headers || {})) {
    if (v !== undefined) {
      cleanHeaders[k.toLowerCase()] = v as string | string[];
    }
  }

  expressReq.method = req.method || 'GET';
  expressReq.url = targetUrl;
  expressReq.originalUrl = targetUrl;
  expressReq.headers = cleanHeaders;
  expressReq.httpVersion = '1.1';
  expressReq.httpVersionMajor = 1;
  expressReq.httpVersionMinor = 1;
  expressReq.socket = (req as any).socket || { remoteAddress: cleanHeaders['x-forwarded-for'] || '' };
  expressReq.connection = expressReq.socket;
  expressReq.body = parsedBody;
  if (rawBody) expressReq.rawBody = rawBody;
  expressReq._body = true;

  const expressRes: any = new EventEmitter();
  const capturedHeaders: Record<string, string | string[]> = {};
  const bodyChunks: Buffer[] = [];
  let statusCode = 200;
  let ended = false;

  expressRes.statusCode = 200;
  expressRes.headersSent = false;
  expressRes.locals = {};
  expressRes.setHeader = (name: string, value: string | number | string[]) => {
    capturedHeaders[String(name).toLowerCase()] = Array.isArray(value) ? value.map(String) : String(value);
    return expressRes;
  };
  expressRes.getHeader = (name: string) => capturedHeaders[String(name).toLowerCase()];
  expressRes.getHeaders = () => ({ ...capturedHeaders });
  expressRes.hasHeader = (name: string) => String(name).toLowerCase() in capturedHeaders;
  expressRes.removeHeader = (name: string) => {
    delete capturedHeaders[String(name).toLowerCase()];
  };
  expressRes.writeHead = (code: number, hdrs?: Record<string, any>) => {
    statusCode = code;
    expressRes.statusCode = code;
    if (hdrs) {
      for (const [k, v] of Object.entries(hdrs)) {
        if (v !== undefined) expressRes.setHeader(k, v);
      }
    }
    expressRes.headersSent = true;
    return expressRes;
  };
  expressRes.write = (chunk: any, encoding?: BufferEncoding) => {
    if (chunk !== undefined && chunk !== null) {
      bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding || 'utf8'));
    }
    return true;
  };

  await new Promise<void>((resolve, reject) => {
    const finishTimer = setTimeout(() => {
      reject(new Error('Fairly Used Market API request timed out before response completed.'));
    }, 25000);

    expressRes.end = (chunk?: any, encoding?: BufferEncoding) => {
      if (ended) return expressRes;
      ended = true;
      clearTimeout(finishTimer);
      try {
        if (chunk !== undefined && chunk !== null) {
          bodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), encoding || 'utf8'));
        }
        statusCode = expressRes.statusCode || statusCode || 200;
        for (const [k, v] of Object.entries(capturedHeaders)) {
          if (k !== 'transfer-encoding' && k !== 'content-length') {
            res.setHeader(k, v);
          }
        }
        res.status(statusCode);
        const outBuf = Buffer.concat(bodyChunks);
        const ct = String(capturedHeaders['content-type'] || '');
        if (ct.includes('video/') || ct.includes('application/pdf') || ct.includes('octet-stream')) {
          res.send(outBuf);
        } else {
          res.send(outBuf.toString('utf8'));
        }
        expressRes.headersSent = true;
        expressRes.emit('finish');
        resolve();
      } catch (sendErr) {
        reject(sendErr);
      }
      return expressRes;
    };

    try {
      app(expressReq, expressRes);
    } catch (syncErr) {
      clearTimeout(finishTimer);
      reject(syncErr);
    }
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const targetUrl = resolveTargetUrl(req);
    const { parsedBody, rawBody } = await readNormalizedBody(req);
    const app = getFairlyUsedExpressApp();
    await dispatchToExpress(app, req, res, targetUrl, parsedBody, rawBody);
  } catch (err: any) {
    console.error('[Vercel Fairly Used Router Error]:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        verified: false,
        message: err?.message || 'Internal server error handling Fairly Used Market request'
      });
    }
  }
}
