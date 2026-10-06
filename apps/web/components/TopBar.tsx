'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, slugify } from '../lib/api';
import type { User, Category } from '../lib/types';
import { mockCategories } from '../lib/mockData';

import { useTheme } from '../lib/useTheme';

interface TopBarProps {
  user: User;
  onMenu?: () => void;
  navigateTo?: (href: string) => void;
}

export default function TopBar({ user, onMenu, navigateTo }: TopBarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(mockCategories);

  useEffect(() => {
    api<{ categories: Category[] }>('/api/categories')
      .then((res) => {
        if (res.categories?.length) setCategories(res.categories);
      })
      .catch(() => {});
  }, []);

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    if (navigateTo) navigateTo('/login');
    else router.push('/login');
  }

  function handleNav(href: string) {
    setIsOpen(false);
    if (navigateTo) navigateTo(href);
    else router.push(href);
  }

  function toggleMenu() {
    if (onMenu) {
      onMenu();
    }
    setIsOpen(!isOpen);
  }

  return (
    <>
      <header className="topbar">
        <button
          className="icon-button"
          aria-label="Open menu"
          onClick={toggleMenu}
        >
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
          <button
            className="icon-button theme-toggle-btn"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'bright'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'bright'} mode`}
            onClick={toggleTheme}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="icon-button" aria-label="Notifications" onClick={() => handleNav('/dashboard')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Claymorphic Navigation Drawer */}
      {isOpen && (
        <>
          <div className="clay-drawer-backdrop" onClick={() => setIsOpen(false)} />
          <aside className="clay-drawer">
            <div className="drawer-header">
              <div className="drawer-brand">
                <span className="brand-mark">✦</span>
                <span>Campus Updates</span>
              </div>
              <button
                className="icon-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="drawer-user-card">
              <div className="drawer-user-avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="drawer-user-meta">
                <span className="drawer-user-name">{user.name}</span>
                <span className="drawer-user-sub">
                  {user.rollNo} • {user.role === 'ADMIN' ? 'Admin ⚡' : 'Student 🎓'}
                </span>
              </div>
            </div>

            {/* Bright & Dark Mode Switcher */}
            <div className="drawer-theme-card">
              <div className="drawer-theme-label">
                <span>{theme === 'light' ? '☀️' : '🌙'}</span>
                <span>Theme</span>
              </div>
              <div className="theme-segmented-control">
                <button
                  type="button"
                  className={`theme-segment-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => { if (theme !== 'light') toggleTheme(); }}
                >
                  ☀️ Bright
                </button>
                <button
                  type="button"
                  className={`theme-segment-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                >
                  🌙 Dark
                </button>
              </div>
            </div>

            <div className="drawer-section-title">Navigation</div>
            <nav className="drawer-nav-list">
              <a
                className="drawer-nav-item"
                onClick={() => handleNav('/dashboard')}
              >
                <span>🏠</span> Dashboard
              </a>
            </nav>

            <div className="drawer-section-title">Categories</div>
            <nav className="drawer-nav-list">
              {categories.map((category) => (
                <a
                  key={category.id}
                  className="drawer-nav-item"
                  onClick={() => handleNav(`/category/${slugify(category.name)}`)}
                >
                  <span>{category.type === 'DEADLINE' ? '🎯' : '📋'}</span>
                  {category.name}
                </a>
              ))}
            </nav>

            {user.role === 'ADMIN' && (
              <div className="drawer-admin-section">
                <div className="drawer-section-title">Admin Management</div>
                <nav className="drawer-nav-list">
                  <a
                    className="drawer-nav-item"
                    onClick={() => handleNav('/admin/posts/new')}
                  >
                    <span>✍️</span> + New Post
                  </a>
                  <a
                    className="drawer-nav-item"
                    onClick={() => handleNav('/admin/users')}
                  >
                    <span>👥</span> Student Accounts
                  </a>
                  <a
                    className="drawer-nav-item"
                    onClick={() => handleNav('/admin/categories')}
                  >
                    <span>📂</span> Menu & Categories
                  </a>
                </nav>
              </div>
            )}

            <button className="drawer-logout-btn" onClick={logout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </aside>
        </>
      )}
    </>
  );
}
