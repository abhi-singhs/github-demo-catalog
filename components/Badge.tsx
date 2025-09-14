'use client';
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'accent' | 'info' | 'warning';
  size?: 'sm' | 'md';
  title?: string;
  className?: string;
}

export default function Badge({ children, tone='default', size='sm', title, className='' }: BadgeProps) {
  return (
    <span
      className={`badge badge-${tone} badge-${size} ${className}`.trim()}
      title={title}
    >{children}</span>
  );
}
