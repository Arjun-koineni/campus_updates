import bcrypt from 'bcryptjs';
import { PrismaClient, CategoryType, Role } from '@prisma/client';
import '../src/config.js';

const prisma = new PrismaClient();

const categories = [
  ['Announcements', CategoryType.NOTICE], ['Hackathons', CategoryType.DEADLINE], ['Workshops', CategoryType.DEADLINE],
  ['Events', CategoryType.DEADLINE], ['Exam PDFs', CategoryType.NOTICE], ['Lab details', CategoryType.NOTICE],
  ['Exam fees', CategoryType.DEADLINE], ['Semester fees', CategoryType.DEADLINE], ['Other registrations', CategoryType.DEADLINE]
] as const;

async function main() {
  for (const [index, [name, type]] of categories.entries()) {
    const existing = await prisma.category.findFirst({ where: { name, active: true } });
    if (!existing) await prisma.category.create({ data: { name, type, sortOrder: index } });
  }
  const rollNo = process.env.ADMIN_ROLL_NO ?? 'ADMIN001';
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error('Set ADMIN_PASSWORD to at least 12 characters before seeding');
  await prisma.user.upsert({
    where: { rollNo },
    update: { role: Role.ADMIN, active: true },
    create: { rollNo, name: process.env.ADMIN_NAME ?? 'Campus Admin', email: process.env.ADMIN_EMAIL ?? 'admin@example.edu', passwordHash: await bcrypt.hash(password, 12), role: Role.ADMIN, firstLoginRequired: false }
  });
  console.info(`Seeded ${categories.length} categories and admin ${rollNo}`);
}

main().finally(() => prisma.$disconnect());
