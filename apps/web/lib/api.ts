const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Request failed');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', body: form, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? 'Upload failed');
  }
  return response.json();
}

export function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export function formatDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function relativeDeadline(value: string | null) {
  if (!value) return '';
  const hours = Math.round((new Date(value).getTime() - Date.now()) / 3600000);
  if (hours < 0) return 'Expired';
  if (hours < 1) return 'Closing soon';
  if (hours < 24) return `${hours}h left`;
  return `${Math.ceil(hours / 24)}d left`;
}

/** Converts a datetime-local control labelled IST to an unambiguous UTC ISO value. */
export function istLocalToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 5, Number(minute) - 30)).toISOString();
}
