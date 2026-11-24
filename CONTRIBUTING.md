# Contributing to OneJoy

Thanks for helping. This guide covers how work is planned, how to run the project, and what a pull request needs before it can merge.

## How work is planned

- All work starts as a **GitHub issue** (use the bug or feature template) and lives on the **OneJoy project board**.
- Large pieces of work are split into **sub-issues**, so each pull request stays small. Use "blocked by" links when one issue depends on another.
- Issues carry a **type** label (`bug`, `feature`, `chore`, `documentation`), an **area** label (`area: database`, `area: ui`, …), and a **milestone** for the release they belong to.
- Board status is the single source of truth for progress. Don't track status anywhere else.

## Branches and commits

- `main` is always deployable and is protected: changes land only through pull requests with green CI.
- Branch from `main` and name the branch after the work:
  - `feat/short-description` for new features
  - `fix/short-description` for bug fixes
  - `chore/…`, `docs/…`, `refactor/…`, `test/…` for everything else
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add weekly goal picker` or `fix(db): hide removed comments from non-moderators`.
- Keep pure formatting changes in their own commits.

## Running it locally

Needs Node 22+ (see `.nvmrc`) and Docker Desktop.

```bash
npm install
npx supabase start             # local Postgres + Auth in Docker
cp .env.example .env.local     # fill in the values printed by the command above
npm run db:reset               # apply migrations
npx tsx scripts/seed-demo.ts   # optional demo data
npm run dev                    # http://localhost:3000
```

## Checks

CI runs all of these on every pull request. Run them before pushing:

| Command                | What it checks                                          |
| ---------------------- | ------------------------------------------------------- |
| `npm run format:check` | Prettier formatting (`npm run format` fixes it)         |
| `npm run lint`         | ESLint                                                  |
| `npm run typecheck`    | TypeScript                                              |
| `npm test`             | Unit tests (Vitest)                                     |
| `npm run test:db`      | Database rules and functions (pgTAP, needs Supabase)    |
| `npm run e2e`          | Browser tests (Playwright, needs Supabase + dev server) |
| `npm run build`        | Production build                                        |

## Database changes

- Every schema change is a new file in `supabase/migrations/`. Never edit a migration that has already shipped.
- Every new table has row-level security enabled, and every rule gets a pgTAP test in `supabase/tests/`.
- New functions are **not callable by clients by default**. Grant `execute` explicitly to `authenticated` for RPCs only.
- Regenerate types after a schema change: `npm run db:types`.

## Pull requests

- Fill in the template: what and why, how you tested it, and screenshots for UI changes.
- Link the issue with `Closes #123` so the board updates itself when the PR merges.
- PRs are squash-merged, so the PR title becomes the commit message on `main` and must follow Conventional Commits.
- Record significant technical decisions as an ADR in `docs/adr/`.

## Releases

Versions follow [Semantic Versioning](https://semver.org/). Each release gets a `CHANGELOG.md` entry, a `vX.Y.Z` tag and a GitHub release.
