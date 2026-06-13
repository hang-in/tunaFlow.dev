export type ProjectStatus = 'beta' | 'stable' | 'wip' | 'archived';

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  repo: string;
  language: string;
  status: ProjectStatus;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    slug: 'tunaflow',
    name: 'tunaFlow',
    tagline: 'One surface for Claude Code, Codex, Gemini, and local engines.',
    description:
      'A desktop client for orchestrating subscription-tier CLI coding agents inside a single Plan → Dev → Review workflow. Cross-vendor blind review, branch/adopt, CLI-first.',
    repo: 'https://github.com/hang-in/tunaFlow',
    language: 'Rust',
    status: 'beta',
    featured: true,
  },
  {
    slug: 'tunareader',
    name: 'tunaReader',
    tagline: 'Self-hosted reading assistant for finance and narrative PDFs.',
    description:
      'Markdown parser that preserves page and block coordinates, hybrid BM25 + vector search to surface relevant sections instantly.',
    repo: 'https://github.com/hang-in/tunaReader',
    language: 'TypeScript',
    status: 'stable',
  },
  {
    slug: 'tunasalon',
    name: 'tunaSalon',
    tagline: 'Small-talk TUI for local-LLM personas.',
    description:
      'A Hawkes-intensity engine decides who speaks when; a silence gate and RRF decide when the room goes quiet.',
    repo: 'https://github.com/hang-in/tunaSalon',
    language: 'Rust',
    status: 'stable',
  },
  {
    slug: 'tunactx',
    name: 'tunaCtx',
    tagline: 'Trigger-driven dynamic context loading for code-aware agents.',
    description:
      'A production-hardened fork of CTX. Modulized, packaged, regression-guarded, and instrumented for real-world Claude Code hook use.',
    repo: 'https://github.com/hang-in/tunaCtx',
    language: 'Python',
    status: 'stable',
  },
  {
    slug: 'tunallama',
    name: 'tunaLlama',
    tagline: 'Bridge local LLMs into Claude and Codex.',
    description:
      'A small adapter for routing local model servers into the same surface area as cloud CLI tools.',
    repo: 'https://github.com/hang-in/tunaLlama',
    language: 'Python',
    status: 'wip',
  },
  {
    slug: 'tunapi',
    name: 'tunaPi',
    tagline: 'Ship code horizontally.',
    description:
      'A tool for distributing code work across parallel surfaces. Lightweight, dependency-free.',
    repo: 'https://github.com/hang-in/tunaPi',
    language: 'Python',
    status: 'wip',
  },
  {
    slug: 'tunapop',
    name: 'tunaPop',
    tagline: 'A macOS companion for the tuna family.',
    description:
      'Native menu bar utilities that surface the tunaFlow and sibling tools where the work happens.',
    repo: 'https://github.com/hang-in/tunaPop',
    language: 'Swift',
    status: 'wip',
  },
  {
    slug: 'tunachat',
    name: 'tunaChat',
    tagline: 'Burn your tokens — visually.',
    description:
      'A live visualisation of token spend across sessions. Built to make usage legible.',
    repo: 'https://github.com/hang-in/tunaChat',
    language: 'TypeScript',
    status: 'archived',
  },
  {
    slug: 'tunadish',
    name: 'tunaDish',
    tagline: 'Burn your tokens, again.',
    description:
      'The simpler sibling of tunaChat. A reference impl for token-stream visualisation.',
    repo: 'https://github.com/hang-in/tunaDish',
    language: 'TypeScript',
    status: 'archived',
  },
];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}
