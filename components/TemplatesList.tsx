'use client';
import React from 'react';
import Badge from './Badge';

interface TemplateEntry { name: string; about?: string; filename: string; body?: string; }
interface Props { templates: TemplateEntry[]; onCreate?: (t:TemplateEntry)=>void; creating?: string | null; disabled?: boolean; owner?: string; repo?: string; loading?: boolean; }

export default function TemplatesList({ templates, onCreate, creating, disabled, owner='octodemo', repo='bootstrap', loading }: Props) {
  if (loading && !templates.length) {
    return (
      <ul className="list" aria-label="Loading templates" aria-busy="true" role="list">
        {Array.from({ length:3 }).map((_,i)=>(
          <li className="list-item" key={i} aria-hidden="true" role="presentation">
            <div className="flex-col" style={{ flex:1, gap:'0.35rem' }}>
              <div className="skeleton" style={{ width:'55%', height:'10px' }} aria-hidden="true" />
              <div className="skeleton" style={{ width:'75%', height:'8px' }} aria-hidden="true" />
            </div>
            <div className="actions-row" aria-hidden="true">
              <div className="skeleton" style={{ width:78, height:24, borderRadius:6 }} />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="list" role="list" aria-busy={loading ? 'true': undefined}>
      {templates.map(t => (
        <li key={t.filename} className="list-item" role="listitem">
          <div className="flex-col" style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexWrap:'wrap' }}>
              <strong>{t.name}</strong>
              <Badge tone="info">TEMPLATE</Badge>
            </div>
            {t.about && <span className="muted">{t.about}</span>}
          </div>
          <div className="actions-row">
            <a
              className="btn btn-primary small"
              href={`https://github.com/${owner}/${repo}/issues/new?template=${encodeURIComponent(t.filename)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e)=>{ if (disabled) { e.preventDefault(); return; } if(onCreate) onCreate(t); }}
            >
              {creating === t.filename ? 'Opening…' : 'Create Demo'}
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
