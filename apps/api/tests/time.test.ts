import { describe, expect, it } from 'vitest';
import { isDeadlineVisible, isWithinGraceWindow } from '../src/lib/time.js';

describe('deadline grace-window rules', () => {
  const now = new Date('2026-10-06T12:00:00.000Z');

  it('keeps a future deadline visible', () => {
    expect(isDeadlineVisible(new Date('2026-10-06T13:00:00.000Z'), now)).toBe(true);
  });

  it('keeps an unregistered expired deadline visible during the default 2.5-hour grace window', () => {
    const deadline = new Date('2026-10-06T10:00:00.000Z');
    expect(isWithinGraceWindow(deadline, now)).toBe(true);
    expect(isDeadlineVisible(deadline, now)).toBe(true);
  });

  it('hides deadlines after the grace window', () => {
    expect(isDeadlineVisible(new Date('2026-10-06T09:29:59.000Z'), now)).toBe(false);
  });

  it('treats a notice without an expiry as always visible', () => {
    expect(isDeadlineVisible(null, now)).toBe(true);
  });
});
