# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the Vue 3 application: `main.ts` bootstraps the app, `App.vue` defines the root view, `stores/` keeps Pinia state, and `__tests__/` lives alongside source files for co-located specs. Keep new view components under `src/`, create matching `.spec.ts` files in `__tests__/` when unit-testing logic, and add shared assets to `public/` or `src/assets/` if needed.
- Config files such as `vite.config.ts`, `tsconfig*.json`, and `eslint.config.ts` sit at the root along with `.env` or environment defs (`env.d.ts`). Treat `node_modules/` as managed by `pnpm` and avoid committing it.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies and keep the lockfile (`pnpm-lock.yaml`) in sync.
- `pnpm dev`: launches Vite’s dev server with hot reload for development.
- `pnpm build`: runs `type-check` and Vite’s production build (`build-only` command) to produce optimized assets.
- `pnpm preview`: serves the built output locally to verify the production bundle.
- `pnpm test:unit`: runs Vitest for unit tests (see `src/__tests__/App.spec.ts`).
- `pnpm lint`: runs ESLint and Oxlint with auto-fix to enforce standards; `pnpm format` runs Prettier on `src/` for formatting.

## Coding Style & Naming Conventions
- The codebase is Vue + TypeScript; prefer PascalCase for components and Pinia stores (`stores/*`), camelCase for composables/hooks, and kebab-case for CSS classes.
- Prettier (via `pnpm format`) handles indentation (two spaces) and wrapping; ESLint (with Oxlint plugins) enforces Vue/TS rules—run `pnpm lint` before pushing.
- Keep Vue templates clean, export typed props, and prefer explicit return types in stores or composables to stay consistent with `vue-tsc` checks.

## Testing Guidelines
- Vitest is the unit testing framework; test files use the `.spec.ts` suffix and sit near the code they cover (`src/__tests__/`).
- Run `pnpm test:unit` after changes affecting logic or components, and include new mocks/stubs for Pinia stores when needed.
- Aim for clear `describe`/`it` blocks and snapshot the DOM only when regression protection is necessary.

## Commit & Pull Request Guidelines
- Git history is not available locally, so adopt Conventional Commit style (`feat(scope): summary`, `fix:`, etc.) to make future history easier to follow.
- PRs should describe the change, mention related issues or tasks, list test commands executed, and attach screenshots if UI work is involved.
- Address lint/test runners and resolve conflicts before requesting review; mention any manual verification steps you performed.
