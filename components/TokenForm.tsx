'use client';
import React, { useState } from 'react';

interface Props { onToken: (token: string) => void; token?: string; onLogout: () => void; }

export default function TokenForm({ onToken, token: activeToken, onLogout }: Props) {
  const [token, setToken] = useState('');

  React.useEffect(()=>{
    const saved = localStorage.getItem('gh_demo_pat');
    if (saved && !activeToken) { setToken(saved); onToken(saved); }
  },[onToken, activeToken]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    onToken(trimmed);
    localStorage.setItem('gh_demo_pat', trimmed); // always persist now
  };

  if (activeToken) {
    return (
      <div className="token-form">
        <p className="hint">Authenticated. Token stored locally.</p>
        <button type="button" className="btn btn-danger" onClick={onLogout}>Logout</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="token-form">
      <input type="password" placeholder="Fine-grained PAT" value={token} onChange={e=>setToken(e.target.value)} className="input" />
      <p className="hint">Token stored locally in this browser (localStorage).</p>
      <button className="btn btn-primary" type="submit" disabled={!token}>Set Token</button>
    </form>
  );
}
