import { PostStatus } from '@prisma/client';
import { prisma } from './prisma.js';

/** Marks due deadline posts and past-validity notices as expired; rows remain stored. */
export async function expirePosts(now = new Date()): Promise<number> {
  const result = await prisma.post.updateMany({
    where: {
      status: PostStatus.ACTIVE,
      OR: [
        { type: 'DEADLINE', deadlineAt: { lte: now } },
        { type: 'NOTICE', validUntil: { not: null, lte: now } }
      ]
    },
    data: { status: PostStatus.EXPIRED }
  });
  return result.count;
}
