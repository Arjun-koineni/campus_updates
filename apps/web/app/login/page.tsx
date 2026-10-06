'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

type Mode = 'login' | 'setup' | 'forgot' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { const params = new URLSearchParams(window.location.search); const token = params.get('token'); const roll = params.get('rollNo'); if (token && roll) { setCode(token); setRollNo(roll); setMode('reset'); } }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') {
        const result = await api<{ user: { role: 'STUDENT' | 'ADMIN' } }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ rollNo, password }) }); router.push(result.user.role === 'ADMIN' ? '/admin/posts/new' : '/dashboard');
      } else if (mode === 'setup') {
        const result = await api<{ user: { role: 'STUDENT' | 'ADMIN' } }>('/api/auth/setup-password', { method: 'POST', body: JSON.stringify({ rollNo, code, password }) }); router.push(result.user.role === 'ADMIN' ? '/admin/posts/new' : '/dashboard');
      } else if (mode === 'forgot') {
        const result = await api<{ message: string; devToken?: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ rollNo }) });
        setMessage(`${result.message}${result.devToken ? ` Development token: ${result.devToken}` : ''}`); setMode('reset');
      } else {
        await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ rollNo, code, password }) }); setMessage('Password reset. You can log in now.'); setMode('login');
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again'); }
    finally { setBusy(false); }
  }

  const title = mode === 'login' ? 'Welcome back' : mode === 'setup' ? 'Set your password' : mode === 'forgot' ? 'Forgot password?' : 'Create a new password';
  return <main className="login-page"><div className="login-card">
    <div className="login-brand"><div className="brand"><span className="brand-mark">✦</span><span>Campus Updates</span></div><h1>{title}</h1><p className="muted">One calm place for every campus deadline and notice.</p></div>
    <form className="form-card form-grid" onSubmit={submit}>
      <div className="field"><label htmlFor="rollNo">Roll number</label><input id="rollNo" value={rollNo} onChange={(e) => setRollNo(e.target.value)} autoComplete="username" required /></div>
      {(mode === 'login') && <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></div>}
      {(mode === 'setup' || mode === 'reset') && <><div className="field"><label htmlFor="code">{mode === 'setup' ? 'One-time code' : 'Reset token from your email link'}</label><input id="code" inputMode={mode === 'setup' ? 'numeric' : 'text'} maxLength={mode === 'setup' ? 6 : 48} value={code} onChange={(e) => setCode(e.target.value)} required /></div><div className="field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></div></>}
      {error && <p className="error">{error}</p>}{message && <p className="success">{message}</p>}
      <button className="button" disabled={busy}>{busy ? 'Working…' : mode === 'login' ? 'Log in' : mode === 'forgot' ? 'Send reset code' : 'Continue'}</button>
    </form>
    <div className="login-help">{mode === 'login' ? <><button className="link-button" onClick={() => { setMode('forgot'); setMessage(''); setError(''); }}>Forgot password?</button><span> · </span><button className="link-button" onClick={async () => { setError(''); setMessage(''); try { const result = await api<{ message: string; devCode?: string }>('/api/auth/request-setup', { method: 'POST', body: JSON.stringify({ rollNo }) }); setMode('setup'); setMessage(`${result.message}${result.devCode ? ` Development code: ${result.devCode}` : ''}`); } catch (err) { setError(err instanceof Error ? err.message : 'Could not send code'); } }}>First login</button></> : <button className="link-button" onClick={() => { setMode('login'); setMessage(''); setError(''); }}>Back to login</button>}</div>
    <p className="login-help">Accounts are created by your campus admin. <Link href="/login" className="text-link">Secure access</Link></p>
  </div></main>;
}
