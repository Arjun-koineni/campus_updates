import { config } from '../config.js';

export const expiryGraceMs = () => config.expiryGraceHours * 60 * 60 * 1000;

export function isWithinGraceWindow(deadline: Date, now = new Date()): boolean {
  return deadline.getTime() <= now.getTime() && now.getTime() - deadline.getTime() <= expiryGraceMs();
}

export function isDeadlineVisible(deadline: Date | null, now = new Date()): boolean {
  if (!deadline) return true;
  return deadline.getTime() > now.getTime() || isWithinGraceWindow(deadline, now);
}

export function formatIst(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: config.appTimezone,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}
