import { Router } from 'express';
import { parse } from 'csv-parse/sync';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../services/auditService.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } });
const studentRow = z.object({
  roll_no: z.string().trim().min(1), name: z.string().trim().min(1), email: z.string().email(),
  year: z.string().trim().optional().default(''), branch: z.string().trim().optional().default(''), section: z.string().trim().optional().default('')
});

router.use(requireAuth, requireRole('ADMIN'));

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file is required' });
  const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as unknown[];
  const rows = records.map((record) => studentRow.parse(record));
  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const existing = await prisma.user.findUnique({ where: { rollNo: row.roll_no } });
    await prisma.user.upsert({
      where: { rollNo: row.roll_no },
      create: { rollNo: row.roll_no, name: row.name, email: row.email, year: row.year || null, branch: row.branch || null, section: row.section || null },
      update: { name: row.name, email: row.email, year: row.year || null, branch: row.branch || null, section: row.section || null, active: true }
    });
    if (existing) updated += 1; else created += 1;
  }
  await audit(req.user!.id, 'imported', 'users', 'bulk', { created, updated });
  return res.json({ created, updated, total: rows.length });
});

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, rollNo: true, name: true, email: true, role: true, year: true, branch: true, section: true, active: true }, orderBy: { name: 'asc' } });
  return res.json({ users });
});

router.patch('/:id/deactivate', async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { active: false } });
  await audit(req.user!.id, 'deactivated', 'user', user.id, { rollNo: user.rollNo });
  return res.json({ user: { id: user.id, active: user.active } });
});

export default router;
