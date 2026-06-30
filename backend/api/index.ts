import { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/main';

let cachedServer: ((req: VercelRequest, res: VercelResponse) => void) | undefined;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedServer) {
    const app = await createApp();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  const server = cachedServer;
  if (!server) throw new Error('Server failed to initialize.');
  return server(req, res);
}
