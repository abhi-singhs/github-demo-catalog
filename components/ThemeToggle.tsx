'use client';
import React from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light'|'dark'>('light');
  // On mount decide initial theme without causing flicker
  React.useEffect(()=>{
    const stored = localStorage.getItem('gh_demo_theme') as 'light'|'dark'|null;
    if (stored) {
      setTheme(stored);
      if (stored === 'dark') document.documentElement.dataset.theme = 'dark';
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = prefersDark ? 'dark':'light';
    setTheme(initial);
    if (initial === 'dark') document.documentElement.dataset.theme = 'dark';
    localStorage.setItem('gh_demo_theme', initial);
  },[]);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.dataset.theme = 'dark';
      } else {
        delete document.documentElement.dataset.theme;
      }
      localStorage.setItem('gh_demo_theme', next);
      return next;
    });
  };

  return (
    <button className="btn btn-invisible btn-icon" onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
