'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, slugify } from '../../../lib/api';
import type { Category, Post, User } from '../../../lib/types';
import TopBar from '../../../components/TopBar';
import PostCard from '../../../components/PostCard';

export default function CategoryPage() {
  const params = useParams<{ slug: string }>(); const router = useRouter(); const [user, setUser] = useState<User | null>(null); const [category, setCategory] = useState<Category | null>(null); const [posts, setPosts] = useState<Post[]>([]); const [past, setPast] = useState(false); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api<{ user: User }>('/api/auth/me'), api<{ categories: Category[] }>('/api/categories')]).then(async ([me, result]) => { setUser(me.user); const found = result.categories.find((item) => slugify(item.name) === params.slug); if (!found) throw new Error('Category not found'); setCategory(found); const postsResult = await api<{ posts: Post[] }>(`/api/posts?categoryId=${found.id}&past=${past}`); setPosts(postsResult.posts); }).catch((err) => { if (err.message?.includes('Authentication')) router.push('/login'); else setError(err.message ?? 'Unable to load category'); }); }, [params.slug, past, router]);
  if (!user || !category) return <main className="login-page"><p className="muted">{error || 'Loading updates…'}</p></main>;
  return <><TopBar user={user} /><main className="shell"><div className="page-heading"><div><Link href="/dashboard" className="back-link">← Dashboard</Link><h1>{category.name}</h1><p className="muted">{category.type === 'DEADLINE' ? 'Sorted by nearest deadline' : 'Latest notices first'}</p></div>{user.role === 'ADMIN' && <Link href="/admin/posts/new" className="admin-pill">+ New post</Link>}</div><div className="filter-row"><button className={`filter-button ${!past ? 'active' : ''}`} onClick={() => setPast(false)}>Active</button><button className={`filter-button ${past ? 'active' : ''}`} onClick={() => setPast(true)}>Past</button></div>{error ? <p className="error">{error}</p> : posts.length ? <div className="post-list">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div> : <div className="empty-state">No {past ? 'past' : 'active'} updates in this category.</div>}</main></>;
}
