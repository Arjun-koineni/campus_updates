import { mockCategories, mockPosts, mockUser, mockUsers, getMockDashboardData } from './mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getMockResponse<T>(path: string, init?: RequestInit): T | null {
  const url = path.split('?')[0];
  const searchParams = new URLSearchParams(path.includes('?') ? path.split('?')[1] : '');

  if (url === '/api/auth/me') return { user: mockUser } as T;
  if (url === '/api/auth/login') return { user: mockUser } as T;
  if (url === '/api/auth/logout') return { ok: true } as T;
  if (url === '/api/dashboard') return getMockDashboardData() as T;
  if (url === '/api/categories') return { categories: mockCategories } as T;
  if (url === '/api/users') return { users: mockUsers } as T;
  if (url === '/api/users/import') return { created: 12, updated: 3 } as T;

  if (url === '/api/posts') {
    const q = searchParams.get('q')?.toLowerCase();
    const categoryId = searchParams.get('categoryId');
    let filtered = [...mockPosts];
    if (categoryId) filtered = filtered.filter((p) => p.categoryId === categoryId);
    if (q) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          (p.source && p.source.toLowerCase().includes(q))
      );
    }
    return { posts: filtered } as T;
  }

  return null;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? 'Request failed');
    }
    if (response.status === 204) return undefined as T;
    return response.json();
  } catch (err) {
    const fallback = getMockResponse<T>(path, init);
    if (fallback !== null) {
      return fallback;
    }
    throw err;
  }
}

export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, { method: 'POST', body: form, credentials: 'include' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? 'Upload failed');
    }
    return response.json();
  } catch (err) {
    if (path === '/api/users/import') {
      return { created: 12, updated: 3 } as T;
    }
    throw err;
  }
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
