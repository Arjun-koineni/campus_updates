'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import type { User } from '../lib/types';

export default function TopBar({ user, onMenu }: { user: User; onMenu?: () => void }) {
  const router = useRouter();
  async function logout() { await api('/api/auth/logout', { method: 'POST' }); router.push('/login'); }
  return <header className="topbar">
    <button className="icon-button" aria-label="Open menu" onClick={onMenu}>☰</button>
    <Link href="/dashboard" className="brand"><span className="brand-mark">✦</span><span>Campus Updates</span></Link>
    <div className="top-actions"><button className="icon-button" aria-label="Notifications">♢<span className="notification-dot" /></button><button className="avatar" onClick={logout} title="Log out">{user.name.slice(0, 1).toUpperCase()}</button></div>
  </header>;
}
