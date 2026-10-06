'use client';

import { useEffect, useState } from 'react';
import { api, apiForm } from '../../../lib/api';
import type { User } from '../../../lib/types';
import { usePageTransition } from '../../../lib/usePageTransition';
import { useScrollAnimations } from '../../../lib/useScrollAnimations';
import TopBar from '../../../components/TopBar';

export default function AdminUsersPage() {
  const { navigateTo, TransitionOverlay } = usePageTransition();
  useScrollAnimations();

  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<{ user: User }>('/api/auth/me'),
      api<{ users: User[] }>('/api/users'),
    ])
      .then(([me, result]) => {
        if (me.user.role !== 'ADMIN') throw new Error('Admin access required');
        setUser(me.user);
        setUsers(result.users);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setError('');
    setMessage('');
    const form = new FormData();
    form.append('file', file);
    try {
      const result = await apiForm<{ created: number; updated: number }>(
        '/api/users/import',
        form
      );
      setMessage(`${result.created} accounts created, ${result.updated} updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  }

  if (!user) {
    return (
      <main className="login-page">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p className="muted" style={{ marginTop: 16 }}>{error || 'Loading users…'}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <TransitionOverlay />
      <TopBar user={user} navigateTo={navigateTo} />

      <main className="shell page-enter">
        <div className="page-heading scroll-reveal">
          <div>
            <a
              onClick={() => navigateTo('/dashboard')}
              className="back-link"
              style={{ cursor: 'pointer' }}
            >
              ← Dashboard
            </a>
            <h1>👥 Student accounts</h1>
            <p className="muted">
              Importing an existing roll number updates its profile and reactivates it.
            </p>
          </div>
        </div>

        <div className="grid-two">
          <form className="form-card form-grid scroll-zoom" onSubmit={upload}>
            <h2>📥 Import student list</h2>
            <p className="muted" style={{ fontSize: 13 }}>
              CSV columns: roll_no, name, email, year, branch, section
            </p>
            <div className="field">
              <label htmlFor="student-file">CSV file</label>
              <input
                id="student-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
            <button className="button">📤 Import list</button>
          </form>

          <section className="admin-card scroll-zoom">
            <h2>📊 {users.length} accounts</h2>
            <div className="user-list">
              {users.slice(0, 12).map((item) => (
                <div className="user-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.rollNo} · {item.branch ?? 'Branch not set'}
                    </span>
                  </div>
                  <span className={item.active ? 'status-active' : 'status-inactive'}>
                    {item.active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
