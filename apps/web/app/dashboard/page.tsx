'use client';

import { useEffect, useState } from 'react';
import { api, slugify } from '../../lib/api';
import type { Category, Post, User } from '../../lib/types';
import { usePageTransition } from '../../lib/usePageTransition';
import { useScrollAnimations } from '../../lib/useScrollAnimations';
import TopBar from '../../components/TopBar';
import PostCard from '../../components/PostCard';
import Section from '../../components/Section';

type DashboardData = {
  pinned: Post[];
  closingSoon: Post[];
  pending: Post[];
  fresh: Post[];
  categories: Category[];
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState('');

  const { navigateTo, TransitionOverlay } = usePageTransition();
  useScrollAnimations();

  useEffect(() => {
    Promise.all([
      api<{ user: User }>('/api/auth/me'),
      api<DashboardData>('/api/dashboard'),
    ])
      .then(([me, dashboard]) => {
        setUser(me.user);
        setData(dashboard);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!search.trim()) return setResults([]);
    try {
      const result = await api<{ posts: Post[] }>(
        `/api/posts?q=${encodeURIComponent(search)}`
      );
      setResults(result.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  }

  // Get formatted date
  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  if (!user || !data) {
    return (
      <main className="login-page">
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <p className="muted" style={{ marginTop: 16 }}>Loading your campus…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <TransitionOverlay />
      <TopBar user={user} onMenu={() => setMenu(!menu)} navigateTo={navigateTo} />

      {/* Mobile Menu */}
      {menu && (
        <>
          <div className="mobile-menu-backdrop" onClick={() => setMenu(false)} />
          <aside className="mobile-menu">
            <div className="menu-header">
              <strong style={{ fontSize: 16 }}>Explore</strong>
              <button className="icon-button" onClick={() => setMenu(false)} aria-label="Close menu">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {data.categories.map((category) => (
              <a
                key={category.id}
                onClick={() => { setMenu(false); navigateTo(`/category/${slugify(category.name)}`); }}
                style={{ cursor: 'pointer' }}
              >
                {category.type === 'DEADLINE' ? '🎯' : '📋'} {category.name}
              </a>
            ))}
            {user.role === 'ADMIN' && (
              <a
                onClick={() => { setMenu(false); navigateTo('/admin/posts/new'); }}
                className="admin-pill"
                style={{ cursor: 'pointer', marginTop: 12 }}
              >
                + Create post
              </a>
            )}
          </aside>
        </>
      )}

      <main className="shell page-enter">
        {/* Welcome Section */}
        <div className="welcome scroll-reveal">
          <div>
            <p className="eyebrow notice" style={{ fontSize: 11, letterSpacing: '1.5px' }}>
              {today.toUpperCase()}
            </p>
            <h1>Hi, {user.name.split(' ')[0]} 👋</h1>
            <p>Here&apos;s what needs your attention.</p>
          </div>
          {user.role === 'ADMIN' && (
            <div className="admin-actions">
              <a onClick={() => navigateTo('/admin/posts/new')} className="admin-pill" style={{ cursor: 'pointer' }}>
                + New post
              </a>
              <a onClick={() => navigateTo('/admin/users')} className="admin-pill" style={{ cursor: 'pointer' }}>
                👥 Students
              </a>
              <a onClick={() => navigateTo('/admin/categories')} className="admin-pill" style={{ cursor: 'pointer' }}>
                📂 Menu
              </a>
            </div>
          )}
        </div>

        {/* Search */}
        <form className="search scroll-zoom" onSubmit={runSearch}>
          <span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deadlines, notices, fees…"
            aria-label="Search campus updates"
          />
        </form>

        {error && <p className="error">{error}</p>}

        {/* Search Results */}
        {results.length > 0 && (
          <section className="content-section scroll-reveal">
            <div className="section-heading">
              <div>
                <h2>Search results</h2>
                <span>Matches from your campus updates</span>
              </div>
              <button
                className="link-button"
                onClick={() => { setSearch(''); setResults([]); }}
              >
                Clear
              </button>
            </div>
            <div className="post-list">
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Pinned Banner */}
        {data.pinned.length > 0 && (
          <div className="banner scroll-zoom">
            <span className="banner-label">📌 PINNED NOTICE</span>
            <h3>{data.pinned[0].title}</h3>
            <p>{data.pinned[0].summary}</p>
            <a
              onClick={() => navigateTo(`/category/${slugify(data.pinned[0].category.name)}`)}
              className="banner-link"
              style={{ cursor: 'pointer' }}
            >
              View notice →
            </a>
          </div>
        )}

        {/* Category Strip */}
        <div className="category-strip scroll-reveal">
          <a
            className="category-chip active"
            onClick={() => navigateTo('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            ✨ All updates
          </a>
          {data.categories.map((category) => (
            <a
              className="category-chip"
              key={category.id}
              onClick={() => navigateTo(`/category/${slugify(category.name)}`)}
              style={{ cursor: 'pointer' }}
            >
              {category.type === 'DEADLINE' ? '🎯' : '📋'} {category.name}
            </a>
          ))}
        </div>

        {/* Content Sections */}
        {data.closingSoon.length > 0 && (
          <Section
            title="⏰ Urgent — Closing Soon"
            hint="Deadlines in the next 48 hours"
            posts={data.closingSoon}
            href="/category/hackathons"
          />
        )}
        {data.pending.length > 0 && (
          <Section
            title="📅 Upcoming Deadlines"
            hint="Registrations & tasks due later this week"
            posts={data.pending}
            href="/category/other-registrations"
          />
        )}
        {data.fresh.length > 0 && (
          <Section
            title="📢 Official Notices & Updates"
            hint="Campus announcements, drives, and resources"
            posts={data.fresh}
            href="/category/announcements"
          />
        )}
      </main>
    </>
  );
}
