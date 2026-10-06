'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { usePageTransition } from '../../lib/usePageTransition';

type Mode = 'login' | 'setup' | 'forgot' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const { navigateTo, TransitionOverlay } = usePageTransition();

  const [mode, setMode] = useState<Mode>('login');
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const roll = params.get('rollNo');
    if (token && roll) {
      setCode(token);
      setRollNo(roll);
      setMode('reset');
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await api<{ user: { role: 'STUDENT' | 'ADMIN' } }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ rollNo, password }),
        });
        navigateTo('/dashboard');
      } else if (mode === 'setup') {
        await api<{ user: { role: 'STUDENT' | 'ADMIN' } }>('/api/auth/setup-password', {
          method: 'POST',
          body: JSON.stringify({ rollNo, code, password }),
        });
        navigateTo('/dashboard');
      } else if (mode === 'forgot') {
        const result = await api<{ message: string; devToken?: string }>('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ rollNo }),
        });
        setMessage(
          `${result.message}${result.devToken ? ` Development token: ${result.devToken}` : ''}`
        );
        setMode('reset');
      } else {
        await api('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ rollNo, code, password }),
        });
        setMessage('Password reset. You can log in now.');
        setMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again');
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === 'login'
      ? 'Welcome back'
      : mode === 'setup'
        ? 'Set your password'
        : mode === 'forgot'
          ? 'Forgot password?'
          : 'Create a new password';

  const subtitle =
    mode === 'login'
      ? 'One calm place for every campus deadline and notice.'
      : mode === 'setup'
        ? 'Secure your account with a strong password.'
        : mode === 'forgot'
          ? "We'll send a reset code to your registered email."
          : 'Choose a new password for your account.';

  return (
    <>
      <TransitionOverlay />
      <main className="login-page">
        <div className="login-card page-enter">
          <div className="login-brand">
            <div className="brand" style={{ marginBottom: 8 }}>
              <span className="brand-mark">✦</span>
              <span>Campus Updates</span>
            </div>
            <h1 style={{ marginTop: 24 }}>{title}</h1>
            <p className="muted" style={{ marginTop: 8 }}>{subtitle}</p>
          </div>

          <form className="form-card form-grid" onSubmit={submit}>
            <div className="field">
              <label htmlFor="rollNo">Roll number</label>
              <input
                id="rollNo"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                autoComplete="username"
                placeholder="e.g. 22CS001"
                required
              />
            </div>

            {mode === 'login' && (
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
              </div>
            )}

            {(mode === 'setup' || mode === 'reset') && (
              <>
                <div className="field">
                  <label htmlFor="code">
                    {mode === 'setup' ? 'One-time code' : 'Reset token from your email link'}
                  </label>
                  <input
                    id="code"
                    inputMode={mode === 'setup' ? 'numeric' : 'text'}
                    maxLength={mode === 'setup' ? 6 : 48}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={mode === 'setup' ? '6-digit code' : 'Paste your token'}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>
              </>
            )}

            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}

            <button className="button" disabled={busy}>
              {busy
                ? '⏳ Working…'
                : mode === 'login'
                  ? '🔓 Log in'
                  : mode === 'forgot'
                    ? '📧 Send reset code'
                    : '✅ Continue'}
            </button>

            {mode === 'login' && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, rgba(56, 217, 169, 0.15), rgba(51, 154, 240, 0.15))' }}
                  onClick={async () => {
                    await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ rollNo: '23116580', password: 'pass' }) });
                    navigateTo('/dashboard');
                  }}
                >
                  🎓 Log in as Student (23116580)
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, rgba(132, 94, 247, 0.15), rgba(255, 107, 107, 0.15))' }}
                  onClick={async () => {
                    await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ rollNo: 'ADMIN001', password: 'pass' }) });
                    navigateTo('/dashboard');
                  }}
                >
                  👑 Log in as Admin (ADMIN001)
                </button>
              </div>
            )}
          </form>

          <div className="login-help">
            {mode === 'login' ? (
              <>
                <button
                  className="link-button"
                  onClick={() => { setMode('forgot'); setMessage(''); setError(''); }}
                >
                  Forgot password?
                </button>
                <span> · </span>
                <button
                  className="link-button"
                  onClick={async () => {
                    setError('');
                    setMessage('');
                    try {
                      const result = await api<{ message: string; devCode?: string }>(
                        '/api/auth/request-setup',
                        { method: 'POST', body: JSON.stringify({ rollNo }) }
                      );
                      setMode('setup');
                      setMessage(
                        `${result.message}${result.devCode ? ` Development code: ${result.devCode}` : ''}`
                      );
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Could not send code');
                    }
                  }}
                >
                  First login
                </button>
              </>
            ) : (
              <button
                className="link-button"
                onClick={() => { setMode('login'); setMessage(''); setError(''); }}
              >
                ← Back to login
              </button>
            )}
          </div>

          <p className="login-help" style={{ marginTop: 12 }}>
            Accounts are created by your campus admin.{' '}
            <Link href="/login" className="text-link">
              Secure access
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
