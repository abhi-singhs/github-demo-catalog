'use client';
import React from 'react';

interface TemplateEntry { name: string; about?: string; filename: string; body?: string; }
interface Props { templates: TemplateEntry[]; onCreate?: (t:TemplateEntry)=>void; creating?: string | null; disabled?: boolean; owner?: string; repo?: string; }

export default function TemplatesList({ templates, onCreate, creating, disabled, owner='octodemo', repo='bootstrap' }: Props) {
  return (
    <ul className="list">
      {templates.map(t => (
        <li key={t.filename} className="list-item">
          <div className="flex-col">
            <strong>{t.name}</strong>
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
              Create Demo
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
