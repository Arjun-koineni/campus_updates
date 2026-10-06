'use client';

import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import type { User } from '../lib/types';

interface TopBarProps {
  user: User;
  onMenu?: () => void;
  navigateTo?: (href: string) => void;
}

export default function TopBar({ user, onMenu, navigateTo }: TopBarProps) {
  const router = useRouter();

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    if (navigateTo) navigateTo('/login');
    else router.push('/login');
  }

  function handleNav(href: string) {
    if (navigateTo) navigateTo(href);
    else router.push(href);
  }

  return (
    <header className="topbar">
      <button className="icon-button" aria-label="Open menu" onClick={onMenu}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <a onClick={() => handleNav('/dashboard')} className="brand" style={{ cursor: 'pointer' }}>
        <span className="brand-mark">✦</span>
        <span>Campus Updates</span>
      </a>

      <div className="top-actions">
        <button className="icon-button" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notification-dot" />
        </button>
        <button className="avatar" onClick={logout} title="Log out">
          {user.name.slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
}
