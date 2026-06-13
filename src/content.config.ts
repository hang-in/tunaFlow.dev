import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const projectStatus = z.enum(['beta', 'stable', 'wip', 'archived']);
const projectTrack = z.enum(['ai-dev', 'shader-physics']);

const sources = z.object({
  site: z.string().url().optional(),
  repo: z.string().url(),
  host: z.enum(['github', 'gitea']),
  owner: z.string().min(1),
  name: z.string().min(1),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase, digits, hyphens only'),
    name: z.string().min(1),
    tagline: z.string().min(1).max(140),
    description: z.string().min(1).max(400),
    track: projectTrack,
    status: projectStatus,
    language: z.string().min(1),
    tags: z.array(z.string()).default([]),
    sources,
    featured: z.array(z.string()).default([]),
    order: z.number().int().min(0).default(100),
    hidden: z.boolean().default(false),
    version: z.string().optional(),
  }),
});

const site = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/site' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1).max(200),
    eyebrow: z.string().min(1),
    tracks: z.object({
      'ai-dev': z.object({ heading: z.string().min(1), lede: z.string().min(1) }),
      'shader-physics': z.object({ heading: z.string().min(1), lede: z.string().min(1) }),
    }),
    featured: z.object({
      'ai-dev': z.array(z.string()).default([]),
      'shader-physics': z.array(z.string()).default([]),
    }),
    links: z.object({
      github: z.string().url().optional(),
    }),
  }),
});

export const collections = { projects, site };
