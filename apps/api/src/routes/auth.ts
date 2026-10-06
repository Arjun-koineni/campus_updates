import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';
import { hashToken, randomCode, randomToken, signSession } from '../lib/auth.js';
import { sendEmail } from '../lib/email.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const rollInput = z.object({ rollNo: z.string().trim().min(1).max(40) });
const loginSchema = rollInput.extend({ password: z.string().min(1).max(128) });
const passwordSchema = rollInput.extend({ code: z.string().regex(/^\d{6}$/), password: z.string().min(8).max(128) });
const resetSchema = rollInput.extend({ code: z.string().regex(/^[a-f0-9]{48}$/), password: z.string().min(8).max(128) });

const cookieOptions = () => ({ httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax' as const, maxAge: config.sessionTtlHours * 3600000, path: '/' });

async function issueToken(userId: string, purpose: 'FIRST_LOGIN' | 'PASSWORD_RESET', value: string) {
  await prisma.$transaction([
    prisma.authToken.updateMany({ where: { userId, purpose, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.authToken.create({ data: { userId, purpose, tokenHash: hashToken(value), expiresAt: new Date(Date.now() + 15 * 60 * 1000) } })
  ]);
}

router.post('/request-setup', async (req, res) => {
  const { rollNo } = rollInput.parse(req.body);
  let devCode: string | undefined;
  const user = await prisma.user.findUnique({ where: { rollNo } });
  if (user?.active && user.firstLoginRequired) {
    const code = randomCode();
    devCode = code;
    await issueToken(user.id, 'FIRST_LOGIN', code);
    await sendEmail(user.email, 'Set your Campus Updates password', `Your one-time setup code is ${code}. It expires in 15 minutes. If you did not request this code, ignore this email.`);
  }
  return res.json({ message: 'If your account is eligible, a one-time code was sent to your registered email.', ...(config.nodeEnv === 'development' ? { devCode } : {}) });
});

router.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { rollNo: input.rollNo } });
  if (!user || !user.active || !user.passwordHash || user.firstLoginRequired) return res.status(401).json({ error: 'Invalid credentials. New students should use First login.' });
  if (user.lockedUntil && user.lockedUntil > new Date()) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  if (!(await bcrypt.compare(input.password, user.passwordHash))) {
    const now = new Date();
    // A single database statement makes concurrent failures contribute to the lockout.
    await prisma.$executeRaw`
      UPDATE "User" SET
        failed_login_count = CASE WHEN locked_until <= ${now} THEN 1 ELSE failed_login_count + 1 END,
        locked_until = CASE WHEN (CASE WHEN locked_until <= ${now} THEN 1 ELSE failed_login_count + 1 END) >= 5
          THEN ${new Date(Date.now() + 15 * 60000)} ELSE NULL END
      WHERE id = ${user.id}::uuid
    `;
    return res.status(401).json({ error: 'Invalid roll number or password' });
  }
  const current = await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  res.cookie(config.cookieName, signSession({ userId: current.id, role: current.role, version: current.sessionVersion }), cookieOptions());
  return res.json({ user: { id: current.id, rollNo: current.rollNo, name: current.name, role: current.role } });
});

async function consumeToken(rollNo: string, credential: string, password: string, purpose: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { rollNo } });
    if (!user?.active || (purpose === 'FIRST_LOGIN' && !user.firstLoginRequired)) return null;
    const token = await tx.authToken.findFirst({ where: { userId: user.id, purpose, tokenHash: hashToken(credential), usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!token) return null;
    const consumed = await tx.authToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (consumed.count !== 1) return null;
    await tx.authToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    return tx.user.update({ where: { id: user.id }, data: { passwordHash, firstLoginRequired: false, failedLoginCount: 0, lockedUntil: null, sessionVersion: { increment: 1 } } });
  });
}

router.post('/setup-password', async (req, res) => {
  const input = passwordSchema.parse(req.body);
  const user = await consumeToken(input.rollNo, input.code, input.password, 'FIRST_LOGIN');
  if (!user) return res.status(400).json({ error: 'Code is invalid or expired' });
  res.cookie(config.cookieName, signSession({ userId: user.id, role: user.role, version: user.sessionVersion }), cookieOptions());
  return res.json({ user: { id: user.id, rollNo: user.rollNo, name: user.name, role: user.role } });
});

router.post('/forgot-password', async (req, res) => {
  const { rollNo } = rollInput.parse(req.body);
  let devToken: string | undefined;
  const user = await prisma.user.findUnique({ where: { rollNo } });
  if (user?.active && !user.firstLoginRequired) {
    const token = randomToken();
    devToken = token;
    await issueToken(user.id, 'PASSWORD_RESET', token);
    const url = `${config.webOrigin}/login?rollNo=${encodeURIComponent(rollNo)}&token=${token}`;
    await sendEmail(user.email, 'Reset your Campus Updates password', `Reset your password: ${url}\nThis one-time link expires in 15 minutes. If you did not request it, ignore this email.`);
  }
  return res.json({ message: 'If the account exists, a password reset link was sent.', ...(config.nodeEnv === 'development' ? { devToken } : {}) });
});

router.post('/reset-password', async (req, res) => {
  const input = resetSchema.parse(req.body);
  const user = await consumeToken(input.rollNo, input.code, input.password, 'PASSWORD_RESET');
  if (!user) return res.status(400).json({ error: 'Reset link is invalid or expired' });
  return res.json({ message: 'Password reset successfully. Please log in.' });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: { id: req.user!.id, rollNo: req.user!.rollNo, name: req.user!.name, role: req.user!.role, year: req.user!.year, branch: req.user!.branch, section: req.user!.section } }));

router.post('/logout', requireAuth, async (req, res) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { sessionVersion: { increment: 1 } } });
  res.clearCookie(config.cookieName, { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax', path: '/' });
  return res.status(204).send();
});

export default router;
