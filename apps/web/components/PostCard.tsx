import Link from 'next/link';
import type { Post } from '../lib/types';
import { formatDate, relativeDeadline } from '../lib/api';

interface PostCardProps {
  post: Post;
  compact?: boolean;
  className?: string;
}

export default function PostCard({ post, compact = false, className = '' }: PostCardProps) {
  const isDeadline = post.type === 'DEADLINE';
  const deadlineText = relativeDeadline(post.deadlineAt ?? null);

  return (
    <article
      className={`post-card scroll-reveal ${post.priority === 'CRITICAL' ? 'critical' : ''} ${post.status === 'EXPIRED' ? 'expired' : ''} ${className}`}
    >
      <div className="post-card-top">
        <span className={`eyebrow ${isDeadline ? 'deadline' : 'notice'}`}>
          {post.category?.name ?? (isDeadline ? 'Deadline' : 'Notice')}
        </span>
        {post.pinned && <span className="pin">📌 PINNED</span>}
        {post.status === 'EXPIRED' && <span className="expired-label">EXPIRED</span>}
      </div>

      <h3>{post.title}</h3>
      <p className={compact ? 'clamp-2' : ''}>{post.summary}</p>

      {isDeadline && post.deadlineAt && (
        <div className="deadline-row">
          <span>🕐 {formatDate(post.deadlineAt)}</span>
          <strong>{deadlineText}</strong>
        </div>
      )}

      {!isDeadline && post.validUntil && (
        <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          Valid until {formatDate(post.validUntil)}
        </div>
      )}

      <div className="post-footer">
        <span className="source">{post.source ?? 'Campus admin'}</span>
        <span className="post-links">
          {post.attachmentUrl && (
            <Link href={post.attachmentUrl} target="_blank" rel="noreferrer" className="text-link">
              PDF ↗
            </Link>
          )}
          {post.link && (
            <Link href={post.link} target="_blank" rel="noreferrer" className="text-link">
              Open link ↗
            </Link>
          )}
        </span>
      </div>
    </article>
  );
}
