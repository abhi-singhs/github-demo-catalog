'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { initOctokit, getIssueTemplates, listUserDemoIssues, closeIssue, getCurrentUser } from '../lib/github';
import TokenForm from '../components/TokenForm';
// RepoSelector removed (fixed repository)
import TemplatesList from '../components/TemplatesList';
import DemosList from '../components/DemosList';
import ThemeToggle from '../components/ThemeToggle';

interface TemplateEntry {
  name: string; // display name
  about?: string;
  body?: string;
  filename: string;
}

export default function HomePage() {
  const [token, setToken] = useState<string>('');
  const owner = 'octodemo';
  const repo = 'bootstrap';
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [demos, setDemos] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingDemos, setLoadingDemos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // no longer creating via API; link opens GitHub UI
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const octokit = useMemo(() => (token ? initOctokit(token) : null), [token]);

  const refreshTemplates = useCallback(async () => {
    if (!octokit) return;
    setLoadingTemplates(true);
    setError(null);
    try {
      const data = await getIssueTemplates(octokit, owner, repo);
      setTemplates(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, [octokit]);

  const refreshDemos = useCallback(async () => {
    if (!octokit) return;
    setLoadingDemos(true);
    setError(null);
    try {
      const issues = await listUserDemoIssues(octokit, owner, repo, currentUser || undefined);
      setDemos(issues);
    } catch (e: any) {
      setError(e.message || 'Failed to load demos');
    } finally {
      setLoadingDemos(false);
    }
  }, [octokit, currentUser]);

  useEffect(() => {
    if (!octokit) return;
    getCurrentUser(octokit).then(u => setCurrentUser(u.login)).catch(()=>{});
  }, [octokit]);

  // Once we know the current user, refresh demos to ensure filtering strictly to creator
  useEffect(() => {
    if (octokit && currentUser) {
      refreshDemos();
    }
  }, [octokit, currentUser, refreshDemos]);

  useEffect(() => {
    if (octokit) {
      refreshTemplates();
    }
  }, [octokit, refreshTemplates]);

  const handleCreate = async (_template: TemplateEntry) => {
    // After user creates issue in new tab, they can manually refresh demos
    setTimeout(()=>{ refreshDemos(); }, 4000); // optimistic refresh after delay
  };

  const handleOpenDemo = (issue: any) => {
    // find first github repo link in body or comments_url pre-fetched field comment_bodies
    const text = `${issue.body}\n${issue._firstComment || ''}`;
    const match = text.match(/https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/);
    if (match) {
      window.open(match[0], '_blank', 'noopener');
    } else {
      window.open(issue.html_url, '_blank', 'noopener');
    }
  };

  const handleCloseDemo = async (issue: any) => {
    if (!octokit) return;
    await closeIssue(octokit, owner, repo, issue.number);
    await refreshDemos();
  };

  const handleLogout = () => {
    localStorage.removeItem('gh_demo_pat');
    setToken('');
    setTemplates([]);
    setDemos([]);
    setCurrentUser(null);
    setError(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>GitHub Demo Catalog</h1>
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </header>
      <main className="content-grid">
        <section className="panel">
          <h2>Authenticate</h2>
          <TokenForm onToken={setToken} token={token} onLogout={handleLogout} />
          {!token && <p className="hint">Provide a fine-grained PAT with access to octodemo/bootstrap issues (read/write) and contents (read only).</p>}
        </section>
        {/* Repository selector removed: repository fixed to octodemo/bootstrap */}
        <section className="panel span-2">
          <h2>Issue Templates (octodemo/bootstrap)</h2>
          {loadingTemplates && <p>Loading templates...</p>}
          {!loadingTemplates && templates.length===0 && !error && (
            <p>No templates found (directory .github/ISSUE_TEMPLATE may be missing or contains only unsupported files).</p>
          )}
          {error && <p className="error">{error}</p>}
          <TemplatesList templates={templates} onCreate={handleCreate} disabled={!octokit} owner={owner} repo={repo} />
        </section>
        <section className="panel span-2">
          <h2>Your Demo Issues (open)</h2>
          {loadingDemos && <p>Loading demos...</p>}
          <DemosList issues={demos} onOpen={handleOpenDemo} onClose={handleCloseDemo} disabled={!octokit} />
        </section>
      </main>
      <footer className="app-footer">
        <p>Always keep your PAT secure.</p>
      </footer>
    </div>
  );
}
