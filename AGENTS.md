# Agent Instructions

## Project scope

This repository is a reusable Fumadocs documentation starter. The Agent Skills pages under `docs/` are licensed example content, not requirements for this starter and not an authoritative copy of the Agent Skills specification.

## Editing

- Put site identity, canonical URL, repository links, feature flags, and page actions in `src/site.config.ts`.
- Put documentation content and navigation metadata under `docs/`.
- Keep AI secrets server-only. Never add real credentials to tracked environment files.
- AI and MCP must remain safe when unconfigured; the default project must build without external credentials.
- Preserve `docs/LICENSE` and `ATTRIBUTION.md` while any derived Agent Skills content remains.
- Do not edit generated directories such as `.next/`, `.source/`, Playwright reports, or TypeScript build info.

Before changing Next.js APIs or conventions, read the relevant guide from the installed version under `node_modules/next/dist/docs/`.

## Verification

Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test:e2e` for changes that affect the rendered site or application behavior.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
