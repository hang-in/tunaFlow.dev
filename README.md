# tunaFlow.dev

The landing site for the [tunaFlow family](https://github.com/hang-in) of focused, open-source dev tools.

> **Of the agent, By the agent, For the agent.**

## What this is

A single static site that serves as the public home for everything we ship under the `tuna*` and `*bit` banners — headlined by [tunaFlow](https://github.com/hang-in/tunaFlow), the desktop multi-engine AI coding client.

Two tracks share the site:

- **AI dev** — orchestrating, routing, and visualising coding agents.
- **Real-time graphics & physics** — WebGPU solar systems, gravity, black holes.

`tunaFlow` is both a product name and a family name. The site, the brand, and the philosophy are all the same thing.

## Stack

- [Astro 6](https://astro.build) — static-first, React islands as needed
- TypeScript (strict)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) for project data
- Vanilla CSS with custom properties (no Tailwind, by choice)
- Cloudflare Pages for hosting, GitHub Actions for CI

## Repository layout

```
src/
  components/      Reusable Astro components
  content/
    config.ts      Zod schemas for collections
    projects/      One JSON file per project
    site/          Site-wide config (config.json)
  layouts/         BaseLayout
  lib/             Build-time helpers (metadata fetcher, …)
  pages/           Routes
  styles/          Global CSS
public/            Static assets (favicon, CNAME)
scripts/           Build-time scripts
```

## Develop

```bash
npm install
npm run dev                # http://localhost:4321
npm run build              # static output to dist/
npm run preview            # serve the built site
npm run fetch:metadata     # populate src/content/.cache/metadata.json
```

## Adding a project

1. Create `src/content/projects/<slug>.json`.
2. Match the schema in `src/content/config.ts`.
3. Pick a track (`ai-dev` | `shader-physics`) and a status (`beta` | `stable` | `wip` | `archived`).
4. Set `sources.host` to `github` or `gitea` and fill `owner` / `name`.
5. If you want it surfaced as a track headline, add its slug to
   `src/content/site/config.json → featured.<track>`.
6. Run `npm run dev` — the card appears automatically.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which:

1. Installs dependencies.
2. Fetches live metadata (stars, last push) from GitHub and the Gitea instance.
3. Builds the static site.
4. Deploys to Cloudflare Pages at <https://tunaflow.dev>.

A scheduled cron runs the same workflow every 6 hours so star counts and
"last pushed" labels stay fresh even without commits.

### Required secrets / variables

| Name             | Where   | Why                                       |
| ---------------- | ------- | ----------------------------------------- |
| `GITHUB_TOKEN`   | Actions | Higher rate limit on the GitHub API       |
| `GITEA_TOKEN`    | Actions | Read access on the private Gitea instance |
| `GITEA_BASE_URL` | Vars    | Gitea base URL (default: git.d9ng.co.kr)  |

Cloudflare Pages is configured separately via the dashboard; the workflow
uses the official `actions/deploy-pages` action which reads its
credentials from the GitHub App integration.

## Conventions

- No new dependencies without a reason.
- Astro components by default. Reach for a React island only when there's
  real client-side state.
- No CSS framework until vanilla CSS has a visible maintenance cost.
- All copy in English first; localisation is a future task.
- Featured projects are an explicit list in `site/config.json`. Auto-promo
  is the wrong default.
