#!/usr/bin/env node
/**
 * Build-time metadata prefetch.
 *
 * Walks the projects content collection and calls the live fetchers once
 * per project, populating `src/content/.cache/metadata.json` so the Astro
 * build itself is hermetic. This is the script CI runs in the
 * "Fetch live metadata" step; locally it's a no-op once the cache exists.
 *
 * Usage:
 *   node --experimental-strip-types scripts/fetch-metadata.ts [--reset]
 */
import { getCollection } from 'astro:content';
import { getMetadata, resetMetadataCache } from '../src/lib/metadata.ts';

const reset = process.argv.includes('--reset');
if (reset) {
  await resetMetadataCache();
  console.log('[fetch] cache reset');
}

const projects = await getCollection('projects');
console.log(`[fetch] ${projects.length} projects to resolve`);

let ok = 0;
let fallback = 0;
let cached = 0;

for (const entry of projects) {
  const { name, sources } = entry.data;
  const live = await getMetadata(sources);
  if (live.source === 'live') ok++;
  else if (live.source === 'cache') cached++;
  else fallback++;
  console.log(
    `  ${live.source.padEnd(8)} ${sources.host}:${sources.owner}/${name}` +
      (live.stars !== null ? ` ★${live.stars}` : ''),
  );
}

console.log(`[fetch] done — live:${ok} cache:${cached} fallback:${fallback}`);
if (ok === 0 && cached === 0) {
  console.warn('[fetch] WARNING: no live or cached metadata resolved');
}
