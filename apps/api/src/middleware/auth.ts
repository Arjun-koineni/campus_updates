import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifySession, type SessionPayload } from '../lib/auth.js';
import { config } from '../config.js';

declare global {
  namespace Express {
    interface Request {
      auth?: SessionPayload;
      user?: Awaited<ReturnType<typeof prisma.user.findUnique>>;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[config.cookieName] as string | undefined;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const payload = verifySession(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active || payload.version !== user.sessionVersion) return res.status(401).json({ error: 'Account is inactive or session has expired' });
    req.auth = { ...payload, role: user.role };
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

export function requireRole(...roles: Array<'STUDENT' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) return res.status(403).json({ error: 'Admin access required' });
    next();
  };
}
