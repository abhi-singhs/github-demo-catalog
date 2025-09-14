// Next.js configuration
// We support static export so the app can be deployed to GitHub Pages.
// During local dev we serve at root (/). In GitHub Actions (GITHUB_ACTIONS=true)
// we apply a basePath/assetPrefix matching the repository name so that
// all assets resolve correctly under /<repo>/.
// NOTE: If you fork & rename the repository, update repoName below OR set
// BASE_PATH env variable in the build job.

const repoName = process.env.REPO_NAME || 'github-demo-catalog';
const isCI = process.env.GITHUB_ACTIONS === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Generate static HTML in ./out via `next build` (no separate export command needed)
  output: 'export',
  // Disable image optimization pipeline (not supported in static export without additional config)
  images: { unoptimized: true },
  // Conditionally set basePath/assetPrefix only in CI to avoid local dev path issues
  ...(isCI ? { basePath: `/${repoName}`, assetPrefix: `/${repoName}/` } : {}),
  // Optional: ensure trailing slash routing consistency for static hosting
  trailingSlash: true
};

module.exports = nextConfig;
