/**
 * Live metadata fetchers for the projects collection.
 *
 * Strategy
 * --------
 * At build time, we call these once per project and merge the result into
 * the static JSON loaded by content collections. Output is cached in
 * `src/content/.cache/metadata.json` so subsequent builds (including local
 * `astro dev` restarts) are offline-friendly and the deploy step is
 * hermetic - it never reaches the public internet for metadata.
 *
 * Failure mode
 * ------------
 * If the upstream is down, we keep the last successful cache. We never let
 * a fetch error break the build: a site with stale stars is better than no
 * site.
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = resolve(__dirname, '../content/.cache/metadata.json');

export interface ProjectSources {
  host: 'github' | 'gitea';
  owner: string;
  name: string;
  repo: string;
  site?: string;
}

export interface LiveMetadata {
  stars: number | null;
  forks: number | null;
  defaultBranch: string | null;
  pushedAt: string | null;
  fetchedAt: string;
  source: 'cache' | 'live' | 'fallback';
}

const EMPTY: Omit<LiveMetadata, 'fetchedAt' | 'source'> = {
  stars: null,
  forks: null,
  defaultBranch: null,
  pushedAt: null,
};

async function loadCache(): Promise<Record<string, LiveMetadata>> {
  try {
    const buf = await readFile(CACHE_PATH, 'utf8');
    return JSON.parse(buf) as Record<string, LiveMetadata>;
  } catch {
    return {};
  }
}

async function persistCache(cache: Record<string, LiveMetadata>): Promise<void> {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

function giteaBase(): string {
  return process.env.GITEA_BASE_URL?.replace(/\/$/, '') ?? 'https://git.d9ng.co.kr';
}

function githubHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'user-agent': 'tunaflow-dev-metadata-fetcher',
    accept: 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) {
    h.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function fetchGithub(s: ProjectSources): Promise<LiveMetadata> {
  const url = `https://api.github.com/repos/${s.owner}/${s.name}`;
  const j = (await fetchJson(url, githubHeaders())) as Record<string, unknown>;
  return {
    ...EMPTY,
    stars: typeof j.stargazers_count === 'number' ? j.stargazers_count : null,
    forks: typeof j.forks_count === 'number' ? j.forks_count : null,
    defaultBranch: typeof j.default_branch === 'string' ? j.default_branch : null,
    pushedAt: typeof j.pushed_at === 'string' ? j.pushed_at : null,
    fetchedAt: new Date().toISOString(),
    source: 'live',
  };
}

async function fetchGitea(s: ProjectSources): Promise<LiveMetadata> {
  const base = giteaBase();
  const url = `${base}/api/v1/repos/${s.owner}/${s.name}`;
  const h: Record<string, string> = { 'user-agent': 'tunaflow-dev-metadata-fetcher', accept: 'application/json' };
  if (process.env.GITEA_TOKEN) {
    h.authorization = `token ${process.env.GITEA_TOKEN}`;
  }
  const j = (await fetchJson(url, h)) as Record<string, unknown>;
  return {
    ...EMPTY,
    stars: typeof j.stars_count === 'number' ? j.stars_count : null,
    forks: typeof j.forks_count === 'number' ? j.forks_count : null,
    defaultBranch: typeof j.default_branch === 'string' ? j.default_branch : null,
    pushedAt: typeof j.pushed_at === 'string' ? j.pushed_at : null,
    fetchedAt: new Date().toISOString(),
    source: 'live',
  };
}

const FALLBACK: LiveMetadata = {
  ...EMPTY,
  fetchedAt: new Date(0).toISOString(),
  source: 'fallback',
};

/**
 * Returns live metadata for a project, using the on-disk cache when the
 * upstream is unreachable. The cache itself is updated best-effort: a
 * write failure does not propagate.
 */
export async function getMetadata(sources: ProjectSources): Promise<LiveMetadata> {
  const key = `${sources.host}:${sources.owner}/${sources.name}`;
  const cache = await loadCache();
  const cached = cache[key];

  try {
    const live = sources.host === 'github' ? await fetchGithub(sources) : await fetchGitea(sources);
    cache[key] = live;
    await persistCache(cache);
    return live;
  } catch (err) {
    if (cached) {
      return { ...cached, source: 'cache' };
    }
    process.stderr.write(
      `[metadata] live fetch failed for ${key} (${(err as Error).message}); using empty fallback\n`,
    );
    return FALLBACK;
  }
}

/**
 * Build-time helper. Wipes the cache file if it exists, forcing a full
 * refetch. Useful in CI when we want to guarantee freshness regardless of
 * what was committed before.
 */
export async function resetMetadataCache(): Promise<void> {
  if (await fileExists(CACHE_PATH)) {
    const { unlink } = await import('node:fs/promises');
    await unlink(CACHE_PATH);
  }
}
