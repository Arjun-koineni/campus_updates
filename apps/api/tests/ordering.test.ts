import { describe, expect, it } from 'vitest';

describe('post ordering contract', () => {
  it('documents deadline ordering as nearest first and notices as newest first', () => {
    const deadlinePosts = [{ deadline: 3 }, { deadline: 1 }, { deadline: 2 }].sort((a, b) => a.deadline - b.deadline);
    const noticePosts = [{ created: 1 }, { created: 3 }, { created: 2 }].sort((a, b) => b.created - a.created);
    expect(deadlinePosts.map((post) => post.deadline)).toEqual([1, 2, 3]);
    expect(noticePosts.map((post) => post.created)).toEqual([3, 2, 1]);
  });
});
