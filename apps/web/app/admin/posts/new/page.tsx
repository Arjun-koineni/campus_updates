'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, istLocalToIso } from '../../../../lib/api';
import type { Category, User } from '../../../../lib/types';
import { usePageTransition } from '../../../../lib/usePageTransition';
import { useScrollAnimations } from '../../../../lib/useScrollAnimations';
import TopBar from '../../../../components/TopBar';

export default function NewPostPage() {
  const router = useRouter();
  const { navigateTo, TransitionOverlay } = usePageTransition();
  useScrollAnimations();

  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [deadlineAt, setDeadlineAt] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [link, setLink] = useState('');
  const [source, setSource] = useState('Manual admin post');
  const [priority, setPriority] = useState<'NORMAL' | 'CRITICAL'>('NORMAL');
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ user: User }>('/api/auth/me'),
      api<{ categories: Category[] }>('/api/categories'),
    ])
      .then(([me, result]) => {
        if (me.user.role !== 'ADMIN') throw new Error('Admin access required');
        setUser(me.user);
        setCategories(result.categories);
        setCategoryId(result.categories[0]?.id ?? '');
      })
      .catch((err) => {
        if (err.message.includes('access') || err.message.includes('Authentication'))
          router.push('/dashboard');
        else setError(err.message);
      });
  }, [router]);

  const category = categories.find((item) => item.id === categoryId);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSaved(false);
    try {
      await api('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          categoryId,
          type: category?.type,
          title,
          summary,
          deadlineAt: deadlineAt ? istLocalToIso(deadlineAt) : undefined,
          validUntil: validUntil ? istLocalToIso(validUntil) : undefined,
          link,
          source,
          priority,
          pinned,
        }),
      });
      setSaved(true);
      setTimeout(() => navigateTo('/dashboard'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create post');
    }
  }

  if (!user) {
    return (
      <main className="login-page">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p className="muted" style={{ marginTop: 16 }}>Loading admin tools…</p>
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
            <h1>📝 New post</h1>
            <p className="muted">Publish a clear, deadline-aware update.</p>
          </div>
        </div>

        <form className="form-card form-grid scroll-zoom" onSubmit={save}>
          <div className="field">
            <label>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.type.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Register for the inter-college hackathon"
              required
            />
          </div>

          <div className="field">
            <label>Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What should students know? Include the important action and context."
              required
            />
          </div>

          <div className="grid-two">
            <div className="field">
              <label>
                {category?.type === 'DEADLINE' ? '⏰ Deadline (IST)' : '📅 Valid until (optional)'}
              </label>
              <input
                type="datetime-local"
                value={category?.type === 'DEADLINE' ? deadlineAt : validUntil}
                onChange={(e) =>
                  category?.type === 'DEADLINE'
                    ? setDeadlineAt(e.target.value)
                    : setValidUntil(e.target.value)
                }
                required={category?.type === 'DEADLINE'}
              />
            </div>
            <div className="field">
              <label>🔗 Official link (optional)</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <div className="field">
            <label>📰 Source</label>
            <input value={source} onChange={(e) => setSource(e.target.value)} />
          </div>

          <div className="form-actions">
            <label className="check">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              📌 Pin this notice
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'CRITICAL')}
            >
              <option value="NORMAL">Normal priority</option>
              <option value="CRITICAL">🔴 Critical priority</option>
            </select>
          </div>

          {error && <p className="error">{error}</p>}
          {saved && <p className="success">✅ Post published.</p>}

          <div className="form-actions">
            <button className="button" disabled={saved}>
              🚀 Publish post
            </button>
            <a
              onClick={() => navigateTo('/dashboard')}
              className="button secondary"
              style={{ cursor: 'pointer' }}
            >
              Cancel
            </a>
          </div>
        </form>
      </main>
    </>
  );
}
