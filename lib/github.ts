import { Octokit } from '@octokit/rest';
import yaml from 'js-yaml';

export function initOctokit(token: string) {
  return new Octokit({ auth: token });
}

export async function getCurrentUser(octokit: Octokit) {
  const { data } = await octokit.rest.users.getAuthenticated();
  return data;
}

export interface IssueTemplateMeta {
  name: string; // display name
  about?: string;
  body?: string;
  filename: string; // original filename in directory
}

// Fetch issue templates by reading the contents of .github/ISSUE_TEMPLATE and parsing front-matter.
// Supports both YAML issue form templates (.yml/.yaml) and legacy markdown templates (.md)
export async function getIssueTemplates(octokit: Octokit, owner: string, repo: string): Promise<IssueTemplateMeta[]> {
  // Basic in-memory cache to avoid re-fetching (per session in the browser context)
  const cacheKey = `${owner}/${repo}`;
  if (typeof window !== 'undefined') {
    (window as any)._issueTemplateCache = (window as any)._issueTemplateCache || {};
    const cached = (window as any)._issueTemplateCache[cacheKey];
    if (cached) return cached;
  }
  try {
    const dirPath = '.github/ISSUE_TEMPLATE';
    const res = await octokit.rest.repos.getContent({ owner, repo, path: dirPath, ref: 'main' }).catch((err: any) => {
      if (err.status === 404) {
        console.info(`[templates] Directory ${dirPath} not found in ${owner}/${repo}@main`);
        return { data: [] } as any;
      }
      throw err;
    });
    if (!Array.isArray(res.data)) return [];
    const files = (res.data as Array<any>).filter((f: any) => f.type === 'file');
    if (files.length === 0) {
      console.info(`[templates] No template files in ${owner}/${repo}/${dirPath}`);
    }
    const templates: IssueTemplateMeta[] = [];
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (!(/(\.ya?ml|\.md)$/.test(lower))) continue; // skip unsupported
      try {
        // Use API to get file content (ensures we respect repository visibility & auth)
        const fileRes = await octokit.rest.repos.getContent({ owner, repo, path: `${dirPath}/${file.name}`, ref: 'main' });
        if (!('content' in fileRes.data)) {
          console.debug(`[templates] Unexpected content shape for ${file.name}`);
          continue;
        }
        const encoding = (fileRes.data as any).encoding;
        let text = (fileRes.data as any).content;
        if (encoding === 'base64') {
          try {
            text = Buffer.from(text, 'base64').toString('utf-8');
          } catch (decodeErr) {
            console.debug(`[templates] Failed to decode base64 for ${file.name}`);
            continue;
          }
        }
        let meta: IssueTemplateMeta | null = null;
        if (/\.ya?ml$/.test(lower)) {
          const data: any = yaml.load(text);
          if (data && typeof data === 'object') {
            meta = {
              name: (data as any).name || file.name,
              about: (data as any).description || (data as any).about,
              body: undefined,
              filename: file.name,
            };
          }
        } else if (/\.md$/.test(lower)) {
          const fmMatch = text.match(/^---\n([\s\S]*?)\n---\n/);
          let body = text;
          let about: string | undefined;
          let name: string | undefined;
          if (fmMatch) {
            const yamlBlock = fmMatch[1];
            try {
              const data: any = yaml.load(yamlBlock);
              if (data) {
                name = data.name || data.title;
                about = data.about || data.description;
              }
            } catch { /* ignore front-matter errors */ }
            body = text.slice(fmMatch[0].length);
          }
          meta = {
            name: name || file.name.replace(/\.md$/, '') || file.name,
            about,
            body,
            filename: file.name,
          };
        }
        if (meta) templates.push(meta);
      } catch (fileErr) {
        console.debug(`[templates] Error processing ${file.name}:`, fileErr);
      }
    }
    templates.sort((a, b) => a.name.localeCompare(b.name));
    if (typeof window !== 'undefined') {
      (window as any)._issueTemplateCache[cacheKey] = templates;
    }
    return templates;
  } catch (e: any) {
    console.warn('[templates] Failed to load issue templates:', e?.message || e);
    return [];
  }
}


export async function listUserDemoIssues(octokit: Octokit, owner: string, repo: string, currentLogin?: string) {
  const q: any = { owner, repo, labels: 'demo', state: 'open', per_page: 50 }; // open only for dashboard
  const { data } = await octokit.rest.issues.listForRepo(q);
  // Optionally filter by creator
  const filtered = currentLogin ? data.filter(i => i.user?.login === currentLogin) : data;
  // fetch first comment to parse repo link (optional future use)
  for (const issue of filtered as any[]) {
    try {
      const comments = await octokit.rest.issues.listComments({ owner, repo, issue_number: issue.number, per_page: 1 });
      (issue as any)._firstComment = comments.data[0]?.body || '';
    } catch { /* ignore */ }
  }
  return filtered;
}

export async function closeIssue(octokit: Octokit, owner: string, repo: string, issue_number: number) {
  await octokit.rest.issues.update({ owner, repo, issue_number, state: 'closed' });
}
