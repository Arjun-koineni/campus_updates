import Link from 'next/link';
import type { Post } from '../lib/types';
import PostCard from './PostCard';

export default function Section({ title, hint, posts, href }: { title: string; hint?: string; posts: Post[]; href?: string }) {
  return <section className="content-section"><div className="section-heading"><div><h2>{title}</h2>{hint && <span>{hint}</span>}</div>{href && <Link href={href} className="see-all">See all →</Link>}</div>{posts.length ? <div className="post-list">{posts.map((post) => <PostCard key={post.id} post={post} compact />)}</div> : <div className="empty-state">Nothing here right now.</div>}</section>;
}
