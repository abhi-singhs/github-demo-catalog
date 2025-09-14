import './globals.css';
import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'GitHub Demo Catalog',
  description: 'Create and manage demo issues from issue templates',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // Inline script to set data-theme early to avoid flash
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const t=localStorage.getItem('gh_demo_theme');if(t==='dark'){document.documentElement.dataset.theme='dark';}else if(!t){if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.dataset.theme='dark';}}}catch(e){}})();`
          }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
