import express, { Router } from 'express';
import { join } from 'node:path';

/**
 * Serves the built single-page app. Any GET that is not a file falls back to index.html so that
 * client-side routes such as /employees/42 survive a page refresh.
 */
export function clientRoutes(distPath: string): Router {
  const indexHtml = join(distPath, 'index.html');
  return Router()
    .use(express.static(distPath, { index: false, maxAge: '1h' }))
    .get('/{*path}', (_req, res) => {
      res.sendFile(indexHtml, { headers: { 'Cache-Control': 'no-cache' } });
    });
}
