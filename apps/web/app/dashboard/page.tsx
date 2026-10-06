'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, slugify } from '../../lib/api';
import type { Category, Post, User } from '../../lib/types';
import TopBar from '../../components/TopBar';
import PostCard from '../../components/PostCard';
import Section from '../../components/Section';

type DashboardData = { pinned: Post[]; closingSoon: Post[]; pending: Post[]; fresh: Post[]; categories: Category[] };

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null); const [data, setData] = useState<DashboardData | null>(null); const [search, setSearch] = useState(''); const [results, setResults] = useState<Post[]>([]); const [menu, setMenu] = useState(false); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api<{ user: User }>('/api/auth/me'), api<DashboardData>('/api/dashboard')]).then(([me, dashboard]) => { setUser(me.user); setData(dashboard); }).catch(() => { window.location.href = '/login'; }); }, []);
  async function runSearch(event: React.FormEvent) { event.preventDefault(); if (!search.trim()) return setResults([]); try { const result = await api<{ posts: Post[] }>(`/api/posts?q=${encodeURIComponent(search)}`); setResults(result.posts); } catch (err) { setError(err instanceof Error ? err.message : 'Search failed'); } }
  if (!user || !data) return <main className="login-page"><p className="muted">Loading your campus…</p></main>;
  return <><TopBar user={user} onMenu={() => setMenu(!menu)} />{menu && <aside className="mobile-menu"><button className="icon-button" onClick={() => setMenu(false)}>×</button><strong>Explore</strong>{data.categories.map((category) => <Link key={category.id} href={`/category/${slugify(category.name)}`}>{category.name}</Link>)}{user.role === 'ADMIN' && <Link href="/admin/posts/new" className="admin-pill">Create post</Link>}</aside>}
    <main className="shell"><div className="welcome"><div><p className="eyebrow notice">TUESDAY · 06 OCTOBER</p><h1>Hi, {user.name.split(' ')[0]}</h1><p>Here’s what needs your attention.</p></div>{user.role === 'ADMIN' && <div className="admin-actions"><Link href="/admin/posts/new" className="admin-pill">+ New post</Link><Link href="/admin/users" className="admin-pill">Students</Link><Link href="/admin/categories" className="admin-pill">Menu</Link></div>}</div>
      <form className="search" onSubmit={runSearch}><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deadlines, notices, fees…" aria-label="Search campus updates" /></form>
      {error && <p className="error">{error}</p>}
      {results.length > 0 && <section className="content-section"><div className="section-heading"><div><h2>Search results</h2><span>Matches from your campus updates</span></div><button className="link-button" onClick={() => { setSearch(''); setResults([]); }}>Clear</button></div><div className="post-list">{results.map((post) => <PostCard key={post.id} post={post} />)}</div></section>}
      {data.pinned.length > 0 && <div className="banner"><span className="banner-label">PINNED NOTICE</span><h3>{data.pinned[0].title}</h3><p>{data.pinned[0].summary}</p><Link href={`/category/${slugify(data.pinned[0].category.name)}`} className="banner-link">View notice →</Link></div>}
      <div className="category-strip"><Link className="category-chip active" href="/dashboard">All updates</Link>{data.categories.map((category) => <Link className="category-chip" key={category.id} href={`/category/${slugify(category.name)}`}>{category.name}</Link>)}</div>
      <Section title="Closing soon" hint="Deadlines in the next 48 hours" posts={data.closingSoon} href="/category/hackathons" />
      <Section title="My pending" hint="Remind me later items" posts={data.pending} />
      <Section title="New / updated" hint="Since your last visit" posts={data.fresh} />
    </main></>;
}
