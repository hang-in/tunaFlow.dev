#!/usr/bin/env node
/**
 * Build-time metadata prefetch.
 *
 * Walks the projects content directory directly (no `astro:content` import)
 * and calls the live fetchers once per project, populating
 * `src/content/.cache/metadata.json` so the Astro build is hermetic.
 *
 * Runs under plain Node: this script must NOT import `astro:content`, which
 * is a runtime virtual module only resolvable inside Astro's own transform
 * pipeline. Reading the JSON files directly keeps this script runnable from
 * CI, cron, and `npm run fetch:metadata` without the Astro toolchain.
 *
 * Usage:
 *   node scripts/fetch-metadata.mjs [--reset]
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = resolve(__dirname, '../src/content/projects');
const CACHE_PATH = resolve(__dirname, '../src/content/.cache/metadata.json');

const reset = process.argv.includes('--reset');
if (reset) {
  const { unlink } = await import('node:fs/promises');
  try {
    await unlink(CACHE_PATH);
    console.log('[fetch] cache reset');
  } catch {
    /* nothing to clear */
  }
}

function giteaBase() {
  return process.env.GITEA_BASE_URL?.replace(/\/$/, '') ?? 'https://git.d9ng.co.kr';
}

function githubHeaders() {
  const h = {
    'user-agent': 'tunaflow-dev-metadata-fetcher',
    accept: 'application/vnd.github+json',
  };
  if (process.env.GITHUB_TOKEN) h.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchGithub({ owner, name }) {
  const j = await fetchJson(`https://api.github.com/repos/${owner}/${name}`, githubHeaders());
  return {
    stars: typeof j.stargazers_count === 'number' ? j.stargazers_count : null,
    forks: typeof j.forks_count === 'number' ? j.forks_count : null,
    defaultBranch: typeof j.default_branch === 'string' ? j.default_branch : null,
    pushedAt: typeof j.pushed_at === 'string' ? j.pushed_at : null,
  };
}

async function fetchGitea({ owner, name }) {
  const h = { 'user-agent': 'tunaflow-dev-metadata-fetcher', accept: 'application/json' };
  if (process.env.GITEA_TOKEN) h.authorization = `token ${process.env.GITEA_TOKEN}`;
  const j = await fetchJson(`${giteaBase()}/api/v1/repos/${owner}/${name}`, h);
  return {
    stars: typeof j.stars_count === 'number' ? j.stars_count : null,
    forks: typeof j.forks_count === 'number' ? j.forks_count : null,
    defaultBranch: typeof j.default_branch === 'string' ? j.default_branch : null,
    pushedAt: typeof j.pushed_at === 'string' ? j.pushed_at : null,
  };
}

async function loadProjects() {
  const entries = await readdir(PROJECTS_DIR);
  const out = [];
  for (const e of entries) {
    if (!e.endsWith('.json')) continue;
    const raw = await readFile(join(PROJECTS_DIR, e), 'utf8');
    out.push(JSON.parse(raw));
  }
  return out;
}

async function loadCache() {
  try {
    return JSON.parse(await readFile(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function persistCache(cache) {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n');
}

async function getOne(cache, project) {
  const key = `${project.sources.host}:${project.sources.owner}/${project.sources.name}`;
  const cached = cache[key];
  try {
    const data =
      project.sources.host === 'github'
        ? await fetchGithub(project.sources)
        : await fetchGitea(project.sources);
    const live = { ...data, fetchedAt: new Date().toISOString(), source: 'live' };
    cache[key] = live;
    return { key, ...live };
  } catch (err) {
    if (cached) return { key, ...cached, source: 'cache' };
    return {
      key,
      stars: null,
      forks: null,
      defaultBranch: null,
      pushedAt: null,
      fetchedAt: new Date(0).toISOString(),
      source: 'fallback',
      error: (err instanceof Error ? err.message : String(err)),
    };
  }
}

const projects = await loadProjects();
console.log(`[fetch] ${projects.length} projects to resolve`);

const cache = await loadCache();
let live = 0, fromCache = 0, fallback = 0;

for (const project of projects) {
  const result = await getOne(cache, project);
  if (result.source === 'live') live++;
  else if (result.source === 'cache') fromCache++;
  else fallback++;
  const star = result.stars !== null ? ` star ${result.stars}` : '';
  console.log(`  ${result.source.padEnd(8)} ${result.key}${star}`);
}

await persistCache(cache);
console.log(`[fetch] done - live:${live} cache:${fromCache} fallback:${fallback}`);
if (live === 0 && fromCache === 0) {
  console.warn('[fetch] WARNING: no live or cached metadata resolved');
}
