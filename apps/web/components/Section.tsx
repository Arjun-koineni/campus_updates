import Link from 'next/link';
import type { Post } from '../lib/types';
import PostCard from './PostCard';

interface SectionProps {
  title: string;
  hint?: string;
  posts: Post[];
  href?: string;
}

export default function Section({ title, hint, posts, href }: SectionProps) {
  return (
    <section className="content-section scroll-reveal">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {hint && <span>{hint}</span>}
        </div>
        {href && (
          <Link href={href} className="see-all">
            See all →
          </Link>
        )}
      </div>

      {posts.length ? (
        <div className="post-list">
          {posts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              compact
              className={`stagger-${Math.min(index + 1, 8)}`}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">✨ Nothing here right now.</div>
      )}
    </section>
  );
}
