# Deployment

The app is a static export (`output: 'export'`). `yarn build` writes the site to `out/`.

## Environment

`NEXT_PUBLIC_*` variables are baked in at **build time**. Changing them after the build has no effect, so every
instance (e.g. regular map vs. preview) needs its own build.

| Variable                | Required | Default                               | Purpose                                 |
|-------------------------|----------|---------------------------------------|-----------------------------------------|
| `NEXT_PUBLIC_CASES_URL` | no       | `https://api.feminizidmap.org/cases`  | Full URL of the dataset endpoint        |

Set the **full** URL, including the path. Example:

```bash
NEXT_PUBLIC_CASES_URL="https://api.feminizidmap.org/cases-public-preview-2026" yarn build
```

The old `NEXT_PUBLIC_API_URL` (base URL only) is no longer read.

## Build notes

- `yarn build` fetches the dataset (`/database` is prerendered), so the endpoint must be reachable from the build machine.
- `basePath` / `NEXT_PUBLIC_BASE_PATH` is set by the GitHub Pages workflow (`.github/workflows/nextjs.yml`).
  For other hosts, serve `out/` from the domain root or set `basePath` in `next.config.mjs`.
- The GitHub Pages workflow doesn't set `NEXT_PUBLIC_CASES_URL`, so it uses the default.
