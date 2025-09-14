'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { initOctokit, getIssueTemplates, listUserDemoIssues, closeIssue, getCurrentUser, addHoldToIssue, removeHoldFromIssue, issueIsOnHold } from '../lib/github';
import TokenForm from '../components/TokenForm';
// RepoSelector removed (fixed repository)
import TemplatesList from '../components/TemplatesList';
import DemosList from '../components/DemosList';
import ThemeToggle from '../components/ThemeToggle';
import { useToasts } from '../components/Toasts';
import Badge from '../components/Badge';

interface TemplateEntry {
  name: string; // display name
  about?: string;
  body?: string;
  filename: string;
}

export default function HomePage() {
  const { add: addToast } = useToasts();
  const [token, setToken] = useState<string>('');
  const owner = 'octodemo';
  const repo = 'bootstrap';
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [demos, setDemos] = useState<any[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
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

  // Pending snapshot persistence (localStorage) ---------------------------------
  const PENDING_KEY = 'gh_demo_pending_ops';
  interface PendingSnapshot { id: number; number: number; action: 'close' | 'hold' | 'unhold'; issue: any; ts: number; }

  const loadPendingSnapshots = useCallback((): PendingSnapshot[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }, []);

  const savePendingSnapshots = useCallback((arr: PendingSnapshot[]) => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(arr)); } catch { /* ignore */ }
  }, []);

  const pruneSnapshots = useCallback((arr: PendingSnapshot[]) => {
    const cutoff = Date.now() - 10 * 60 * 1000; // 10 minutes TTL
    return arr.filter(s => s.ts >= cutoff);
  }, []);

  const refreshDemos = useCallback(async () => {
    if (!octokit) return;
    setLoadingDemos(true);
    setError(null);
    try {
      const issues = await listUserDemoIssues(octokit, owner, repo, currentUser || undefined);
      const snapshots = pruneSnapshots(loadPendingSnapshots());
      const existingIds = new Set(issues.map(i => i.id));
      const stillRelevant = snapshots.filter(s => s.action !== 'close' || existingIds.has(s.id));
      const byId = new Map<number, any>();
      for (const issue of issues) byId.set(issue.id, issue);
      for (const snap of stillRelevant) {
        if (!byId.has(snap.id)) continue;
        if (snap.action === 'hold') {
          const issueRef = byId.get(snap.id);
          const labels = Array.isArray(issueRef.labels) ? [...issueRef.labels] : [];
          if (!labels.some((l:any)=> (typeof l === 'string'? l : l.name) === 'demo::lifecycle_hold')) {
            labels.push({ name: 'demo::lifecycle_hold', color: '777777' });
            issueRef.labels = labels;
          }
        } else if (snap.action === 'unhold') {
          const issueRef = byId.get(snap.id);
          if (Array.isArray(issueRef.labels)) {
            issueRef.labels = issueRef.labels.filter((l:any)=> (typeof l === 'string'? l : l.name) !== 'demo::lifecycle_hold');
          }
        }
      }
      setDemos(Array.from(byId.values()));
      savePendingSnapshots(stillRelevant);
    } catch (e: any) {
      setError(e.message || 'Failed to load demos');
    } finally {
      setLoadingDemos(false);
    }
  }, [octokit, currentUser, loadPendingSnapshots, pruneSnapshots, savePendingSnapshots]);


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

  // Auto-refresh demo issues every 30 seconds while authenticated & user known
  useEffect(() => {
    if (!octokit || !currentUser) return;
    const id = setInterval(() => {
      refreshDemos();
    }, 15_000);
    return () => clearInterval(id);
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
    if (issue._demoRepoUrl) {
      window.open(issue._demoRepoUrl, '_blank', 'noopener');
    }
  };

  const handleCloseDemo = async (issue: any) => {
    if (!octokit) return;
    setPendingIds(prev => new Set(prev).add(issue.id));
    // snapshot
    const snaps = pruneSnapshots(loadPendingSnapshots());
    snaps.push({ id: issue.id, number: issue.number, action: 'close', issue, ts: Date.now() });
    savePendingSnapshots(snaps);
    try {
      await closeIssue(octokit, owner, repo, issue.number);
      addToast({ variant: 'success', message: `Closed demo #${issue.number}` });
    } catch (err) {
      await refreshDemos();
      setPendingIds(prev => { const n = new Set(prev); n.delete(issue.id); return n; });
      const after = pruneSnapshots(loadPendingSnapshots()).filter(s => !(s.id === issue.id && s.action === 'close'));
      savePendingSnapshots(after);
      addToast({ variant: 'error', message: `Failed to close #${issue.number}` });
      return;
    }
    await refreshDemos();
    setPendingIds(prev => { const n = new Set(prev); n.delete(issue.id); return n; });
    const after = pruneSnapshots(loadPendingSnapshots()).filter(s => !(s.id === issue.id && s.action === 'close'));
    savePendingSnapshots(after);
  };

  const handleToggleHold = async (issue: any) => {
    if (!octokit) return;
    setPendingIds(prev => new Set(prev).add(issue.id));
    const onHold = issueIsOnHold(issue);
    const snaps = pruneSnapshots(loadPendingSnapshots());
    snaps.push({ id: issue.id, number: issue.number, action: onHold ? 'unhold' : 'hold', issue, ts: Date.now() });
    savePendingSnapshots(snaps);
    try {
      if (onHold) {
        await removeHoldFromIssue(octokit, owner, repo, issue.number);
        addToast({ variant: 'success', message: `Removed hold on #${issue.number}` });
      } else {
        await addHoldToIssue(octokit, owner, repo, issue.number);
        addToast({ variant: 'info', message: `Placed hold on #${issue.number}` });
      }
    } catch (e) {
      await refreshDemos();
      setPendingIds(prev => { const n = new Set(prev); n.delete(issue.id); return n; });
      const after = pruneSnapshots(loadPendingSnapshots()).filter(s => !(s.id === issue.id && (s.action === 'hold' || s.action === 'unhold')));
      savePendingSnapshots(after);
      addToast({ variant: 'error', message: `Failed to update hold for #${issue.number}` });
      return;
    }
    await refreshDemos();
    setPendingIds(prev => { const n = new Set(prev); n.delete(issue.id); return n; });
    const after = pruneSnapshots(loadPendingSnapshots()).filter(s => !(s.id === issue.id && (s.action === 'hold' || s.action === 'unhold')));
    savePendingSnapshots(after);
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
        <section className="panel span-2" aria-live="polite">
          <h2 id="templates-heading">Demo Templates (octodemo/bootstrap)</h2>
          {loadingTemplates && <p role="status" aria-describedby="templates-heading">Loading templates…</p>}
          {!loadingTemplates && templates.length===0 && !error && (
            <p>No templates found (directory .github/ISSUE_TEMPLATE may be missing or contains only unsupported files).</p>
          )}
          {error && <p className="error">{error}</p>}
          <TemplatesList templates={templates} onCreate={handleCreate} disabled={!octokit} owner={owner} repo={repo} loading={loadingTemplates} />
        </section>
  <section className="panel span-2" aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
              <h2 style={{ margin: 0 }}>Your Demos (open)</h2>
              {/* Stats */}
              {demos.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                  <Badge tone="accent" title="Total open demos">{demos.length}</Badge>
                  <Badge tone={demos.some(i=> i.labels?.some((l:any)=> (typeof l==='string'? l : l.name)==='demo::lifecycle_hold')) ? 'warning':'default'} title="Held demos">{demos.filter(i=> i.labels?.some((l:any)=> (typeof l==='string'? l : l.name)==='demo::lifecycle_hold')).length} hold</Badge>
                </div>
              )}
              <p className="hint" style={{ flexBasis:'100%', marginTop:'2px' }}>Demo state changes might take a minute to reflect on the list, please be patient.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {loadingDemos && <span className="muted" role="status" aria-live="polite" style={{ fontSize: '0.85rem' }}>Loading…</span>}
              <button
                className="btn btn-default small"
                onClick={() => refreshDemos()}
                disabled={!octokit || loadingDemos}
                aria-label="Refresh demo issues"
              >
                Refresh
              </button>
            </div>
          </div>
          <DemosList issues={demos} pendingIds={pendingIds} onOpen={handleOpenDemo} onClose={handleCloseDemo} onToggleHold={handleToggleHold} disabled={!octokit} loading={loadingDemos} />
        </section>
      </main>
      <footer className="app-footer">
        <p>Always keep your PAT secure.</p>
      </footer>
    </div>
  );
}
