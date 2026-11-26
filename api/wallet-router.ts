import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { registerMarketplaceRoutes } from '../src/lib/marketplace-routes.js';
import { registerWalletRoutes } from '../src/lib/wallet-routes.js';

let cachedApp: express.Express | null = null;

function getWalletExpressApp(): express.Express {
  if (cachedApp) return cachedApp;

  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

  // Preserve Vercel pre-parsed req.body and populate req.rawBody before express.json()
  app.use((req: any, _res, next) => {
    if (req.body !== undefined && req.body !== null) {
      if (Buffer.isBuffer(req.body)) {
        req.rawBody = req.body;
        try {
          req.body = JSON.parse(req.body.toString('utf8') || '{}');
        } catch {
          req.body = {};
        }
      } else if (typeof req.body === 'string') {
        req.rawBody = Buffer.from(req.body, 'utf8');
        try {
          req.body = JSON.parse(req.body || '{}');
        } catch {
          // Leave string body as-is
        }
      } else if (typeof req.body === 'object') {
        try {
          req.rawBody = Buffer.from(JSON.stringify(req.body), 'utf8');
        } catch {
          // Ignore serialization fallback
        }
      }
      req._body = true;
    }
    next();
  });

  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );

  registerMarketplaceRoutes(app);
  registerWalletRoutes(app);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.originalUrl || req.url}`
    });
  });

  cachedApp = app;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawUrl = req.url || '/api/wallet-router';
    const parsedUrl = new URL(rawUrl, 'https://www.e-fado.com');
    const routeParam =
      parsedUrl.searchParams.get('__route') ||
      (typeof req.query?.__route === 'string' ? req.query.__route : '');

    if (routeParam) {
      parsedUrl.searchParams.delete('__route');
      const remainingQuery = parsedUrl.searchParams.toString();
      const normalizedPath = routeParam.startsWith('/') ? routeParam : `/${routeParam}`;
      (req as any).url = `${normalizedPath}${remainingQuery ? `?${remainingQuery}` : ''}`;
    }

    const app = getWalletExpressApp();
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      res.once('finish', done);
      res.once('close', done);
      app(req as any, res as any);
    });
  } catch (err: any) {
    console.error('[Vercel Wallet Router Error]:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: err?.message || 'Internal server error handling wallet request'
      });
    }
  }
}
