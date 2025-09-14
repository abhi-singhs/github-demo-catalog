'use client';
import React from 'react';

interface Props { issues: any[]; onOpen: (issue:any)=>void; onClose: (issue:any)=>void; disabled?: boolean; }

export default function DemosList({ issues, onOpen, onClose, disabled }: Props) {
  if (!issues.length) return <p>No demo issues yet.</p>;
  return (
    <ul className="list">
      {issues.map(issue => (
        <li key={issue.id} className="list-item">
          <div className="flex-col">
            <strong>#{issue.number} {issue.title}</strong>
            <span className="muted">{issue.state} • updated {new Date(issue.updated_at).toLocaleString()}</span>
          </div>
          <div className="actions-row">
            <button className="btn btn-default small" onClick={()=>onOpen(issue)} disabled={disabled}>Open</button>
            <button className="btn btn-danger small" onClick={()=>onClose(issue)} disabled={disabled}>Close</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
