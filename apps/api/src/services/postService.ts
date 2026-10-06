import { Prisma, PostStatus, PostType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { expiryGraceMs, isDeadlineVisible } from '../lib/time.js';
import { audit } from './auditService.js';

export const postInclude = {
  category: true,
  createdBy: { select: { name: true, rollNo: true } }
} as const;

export function serializePost(post: any) {
  return {
    ...post,
    deadlineAt: post.deadlineAt?.toISOString() ?? null,
    validUntil: post.validUntil?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  };
}

export async function listPosts(options: {
  userId?: string;
  categoryId?: string;
  q?: string;
  past?: boolean;
  admin?: boolean;
}) {
  const now = new Date();
  await prisma.post.updateMany({
    where: {
      status: PostStatus.ACTIVE,
      OR: [
        { type: PostType.DEADLINE, deadlineAt: { lte: now } },
        { type: PostType.NOTICE, validUntil: { not: null, lte: now } }
      ]
    },
    data: { status: PostStatus.EXPIRED }
  });

  const where: Prisma.PostWhereInput = {};
  if (options.categoryId) where.categoryId = options.categoryId;
  if (!options.admin) {
    where.status = options.past ? PostStatus.EXPIRED : { in: [PostStatus.ACTIVE, PostStatus.EXPIRED] };
    where.OR = options.past
      ? [{ type: PostType.NOTICE }, { type: PostType.DEADLINE, deadlineAt: { lt: now } }]
      : [
          { type: PostType.NOTICE, OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
          { type: PostType.DEADLINE, OR: [{ deadlineAt: { gt: now } }, { deadlineAt: { gte: new Date(now.getTime() - expiryGraceMs()), lte: now } }] }
        ];
  }

  if (options.q?.trim()) {
    const ids = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "Post"
      WHERE to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(source, '') || ' ' || coalesce(link, ''))
      @@ websearch_to_tsquery('simple', ${options.q.trim()})
    `);
    where.id = { in: ids.map((row) => row.id) };
  }

  const posts = await prisma.post.findMany({
    where,
    include: postInclude,
    orderBy: [{ type: 'asc' }, { deadlineAt: 'asc' }, { createdAt: 'desc' }]
  });
  let visiblePosts = posts.filter((post) => options.admin || options.past || isDeadlineVisible(post.deadlineAt));
  if (options.userId && !options.admin && !options.past && visiblePosts.length) {
    const completed = await prisma.registration.findMany({ where: { userId: options.userId, status: 'DONE', postId: { in: visiblePosts.map((post) => post.id) } }, select: { postId: true } });
    const completedIds = new Set(completed.map((item) => item.postId));
    visiblePosts = visiblePosts.filter((post) => !(completedIds.has(post.id) && post.type === PostType.DEADLINE && post.deadlineAt && post.deadlineAt <= now));
  }
  return visiblePosts.map(serializePost);
}

export async function createPost(data: Prisma.PostCreateInput, actorId: string) {
  const post = await prisma.post.create({ data, include: postInclude });
  await audit(actorId, 'created', 'post', post.id, { title: post.title });
  return serializePost(post);
}

export async function updatePost(id: string, data: Prisma.PostUpdateInput, actorId: string) {
  const before = await prisma.post.findUniqueOrThrow({ where: { id }, include: postInclude });
  const post = await prisma.$transaction(async (tx) => {
    const updated = await tx.post.update({ where: { id }, data, include: postInclude });
    await tx.postHistory.create({ data: { postId: id, changedBy: actorId, snapshot: JSON.parse(JSON.stringify(before)) } });
    if (data.deadlineAt || data.summary || data.title) {
      await tx.notification.create({ data: { postId: id, title: `Updated: ${updated.title}`, content: updated.summary } });
    }
    return updated;
  });
  await audit(actorId, 'updated', 'post', id, { before: before.title, after: post.title });
  return serializePost(post);
}
