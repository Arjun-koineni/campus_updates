'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import type { Category, User } from '../../../lib/types';
import { usePageTransition } from '../../../lib/usePageTransition';
import { useScrollAnimations } from '../../../lib/useScrollAnimations';
import TopBar from '../../../components/TopBar';

export default function AdminCategoriesPage() {
  const { navigateTo, TransitionOverlay } = usePageTransition();
  useScrollAnimations();

  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<'DEADLINE' | 'NOTICE'>('DEADLINE');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const result = await api<{ categories: Category[] }>('/api/categories');
    setCategories(result.categories);
  }

  useEffect(() => {
    Promise.all([
      api<{ user: User }>('/api/auth/me'),
      api<{ categories: Category[] }>('/api/categories'),
    ])
      .then(([me, result]) => {
        if (me.user.role !== 'ADMIN') throw new Error('Admin access required');
        setUser(me.user);
        setCategories(result.categories);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type, sortOrder: categories.length }),
      });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add category');
    }
  }

  async function remove(id: string) {
    try {
      await api(`/api/categories/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove category');
    }
  }

  async function rename(id: string) {
    try {
      await api(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: draft }),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename category');
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const index = categories.findIndex((item) => item.id === id);
    const target = categories[index + direction];
    if (!target) return;
    await Promise.all([
      api(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      api(`/api/categories/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ sortOrder: categories[index].sortOrder }),
      }),
    ]);
    await load();
  }

  if (!user) {
    return (
      <main className="login-page">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p className="muted" style={{ marginTop: 16 }}>{error || 'Loading categories…'}</p>
          <button
            className="button button-secondary"
            style={{ marginTop: 16 }}
            onClick={() => navigateTo('/dashboard')}
          >
            ← Back to Dashboard
          </button>
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
            <h1>📂 Menu categories</h1>
            <p className="muted">Keep the student menu in the order your campus uses.</p>
          </div>
        </div>

        <div className="grid-two">
          <form className="form-card form-grid scroll-zoom" onSubmit={add}>
            <h2>➕ Add category</h2>
            <div className="field">
              <label>Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hackathons"
                required
              />
            </div>
            <div className="field">
              <label>Post type</label>
              <select value={type} onChange={(e) => setType(e.target.value as 'DEADLINE' | 'NOTICE')}>
                <option value="DEADLINE">🎯 Deadline</option>
                <option value="NOTICE">📋 Notice</option>
              </select>
            </div>
            <button className="button">Add category</button>
            {error && <p className="error">{error}</p>}
          </form>

          <section className="admin-card scroll-zoom">
            <h2>📋 Active menu</h2>
            <div className="user-list">
              {categories.map((item, index) => (
                <div className="user-row" key={item.id}>
                  <div>
                    {editing === item.id ? (
                      <input
                        className="inline-input"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && rename(item.id)}
                        autoFocus
                      />
                    ) : (
                      <>
                        <strong>
                          {index + 1}. {item.name}
                        </strong>
                        <span>{item.type === 'DEADLINE' ? '🎯' : '📋'} {item.type.toLowerCase()} posts</span>
                      </>
                    )}
                  </div>
                  <div className="row-actions">
                    {editing === item.id ? (
                      <button className="link-button" onClick={() => rename(item.id)}>
                        ✅ Save
                      </button>
                    ) : (
                      <button
                        className="link-button"
                        onClick={() => { setEditing(item.id); setDraft(item.name); }}
                      >
                        ✏️ Rename
                      </button>
                    )}
                    <button
                      className="link-button"
                      onClick={() => move(item.id, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className="link-button"
                      onClick={() => move(item.id, 1)}
                      disabled={index === categories.length - 1}
                    >
                      ↓
                    </button>
                    <button className="link-button danger" onClick={() => remove(item.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
