import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from './lib/redis.js';
import { hashToken } from './lib/auth.js';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import categoryRoutes from './routes/categories.js';
import postRoutes from './routes/posts.js';
import dashboardRoutes from './routes/dashboard.js';
import { errorHandler, notFound } from './middleware/errors.js';

export const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.webOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
// All state-changing browser requests must originate from the configured UI.
// This also protects multipart student imports from cross-site submission.
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && origin !== config.webOrigin) return res.status(403).json({ error: 'Untrusted request origin' });
  if (config.nodeEnv === 'production' && !req.secure) return res.status(400).json({ error: 'HTTPS required' });
  next();
});

function store(prefix: string) {
  return new RedisStore({ prefix, sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as Promise<any> });
}

const productionStore = (prefix: string) => config.nodeEnv === 'production' ? store(prefix) : undefined;

app.get('/health', (_req, res) => res.json({ ok: true, service: 'campus-updates-api' }));
app.use('/api', rateLimit({ windowMs: 60000, limit: 180, store: productionStore('rl:api:'), standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, store: productionStore('rl:auth-ip:'), standardHeaders: true, legacyHeaders: false, skip: (req) => ['GET', 'HEAD'].includes(req.method) }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, store: productionStore('rl:auth-account:'), keyGenerator: (req) => hashToken(String(req.body?.rollNo ?? '').trim()), skip: (req) => !req.body?.rollNo, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(config.port, () => console.info(`Campus Updates API listening on http://localhost:${config.port}`));
}

export default app;
