'use client';
import React from 'react';
import Badge from './Badge';

interface Props { issues: any[]; onOpen: (issue:any)=>void; onClose: (issue:any)=>void; onToggleHold: (issue:any)=>void; pendingIds?: Set<number>; disabled?: boolean; loading?: boolean; }

function timeAgo(iso: string) {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const wk = Math.floor(day / 7);
    if (wk < 4) return `${wk}w ago`;
    const mo = Math.floor(day / 30);
    if (mo < 12) return `${mo}mo ago`;
    const yr = Math.floor(day / 365);
    return `${yr}y ago`;
  } catch { return ''; }
}

export default function DemosList({ issues, onOpen, onClose, onToggleHold, pendingIds, disabled, loading }: Props) {
  if (loading && !issues.length) {
    return (
      <ul className="list" aria-label="Loading demos" aria-busy="true" role="list">
        {Array.from({ length: 3 }).map((_,i)=>(
          <li key={i} className="list-item" aria-hidden="true" role="presentation">
            <div className="flex-col" style={{ flex:1, gap:'0.4rem' }}>
              <div className="skeleton" style={{ width:'60%', height:'10px' }} aria-hidden="true" />
              <div className="skeleton" style={{ width:'35%', height:'8px' }} aria-hidden="true" />
            </div>
            <div className="actions-row" aria-hidden="true">
              <div className="skeleton" style={{ width:48, height:24, borderRadius:6 }} />
              <div className="skeleton" style={{ width:48, height:24, borderRadius:6 }} />
              <div className="skeleton" style={{ width:48, height:24, borderRadius:6 }} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (!issues.length) return <p className="muted">No demo issues yet.</p>;
  return (
    <ul className="list" role="list" aria-busy={loading ? 'true': undefined} aria-live="polite">
      {issues.map(issue => {
        const isPending = pendingIds?.has(issue.id);
        const labels = Array.isArray(issue.labels) ? issue.labels : [];
        const onHold = labels.some((l:any)=> (typeof l === 'string'? l : l.name) === 'demo::lifecycle_hold');
        return (
          <li
            key={issue.id}
            className={`list-item${isPending ? ' pending' : ''}${onHold ? ' on-hold' : ''}`}
            aria-busy={isPending || undefined}
            role="listitem"
          >
            <div className="flex-col" style={{ flex: 1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap' }}>
                <strong style={{ fontSize:'.8rem', lineHeight:1.2 }}>
                  #{issue.number}{' '}
                  {issue._demoRepoUrl ? (
                    <a
                      href={issue._demoRepoUrl}
                      onClick={(e)=>{ e.preventDefault(); if (!isPending) onOpen(issue); }}
                      target="_blank"
                      rel="noopener"
                      className="issue-title-link"
                      aria-label={`Open demo repository for issue #${issue.number}`}
                    >{issue.title}</a>
                  ) : issue.title}
                </strong>
                {onHold && <Badge tone="warning" title="Demo on hold">HOLD</Badge>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                <span className="muted text-xs" title={new Date(issue.updated_at).toLocaleString()}>
                  Updated {timeAgo(issue.updated_at)}
                </span>
                {labels.length > 0 && (
                  <div className="labels-row" style={{ marginTop:0 }}>
                    {labels.map((lbl: any) => {
                      const name = typeof lbl === 'string' ? lbl : lbl.name;
                      const color = typeof lbl === 'string' ? '777777' : (lbl.color || '777777');
                      return (
                        <span
                          key={name}
                          title={name}
                          className="label-badge"
                          style={{ background: `#${color}` }}
                        >{name}</span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="actions-row">
              {isPending && <div className="spinner" aria-label="Updating issue state" />}
              <button
                className="btn btn-default small"
                onClick={()=>onToggleHold(issue)}
                disabled={disabled || isPending}
                aria-label={`Toggle hold for issue #${issue.number}`}
              >{onHold ? 'Unhold' : 'Hold'}</button>
              {issue._demoRepoUrl && (
                <button
                  className="btn btn-default small"
                  onClick={()=>onOpen(issue)}
                  disabled={disabled || isPending}
                  aria-label={`Open demo repository for issue #${issue.number}`}
                >Open</button>
              )}
              <button className="btn btn-danger small" onClick={()=>onClose(issue)} disabled={disabled || isPending}>Close</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
