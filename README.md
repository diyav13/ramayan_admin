# Ramayana Admin

Admin panel for the Ramayana app. Built with Next.js, React, TypeScript, and Tailwind CSS.

## Quick start

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) — you will land on the admin login page.

| Route | Description |
|---|---|
| `/login` | Admin sign in |
| `/dashboard` | Dashboard with dummy stats, chapters, and episodes |

Login is dummy-only for now — click **Sign In** to reach the dashboard.

## Documentation

**New to Next.js coming from React Native?** Read the full guide:

→ **[docs/NEXTJS_FOR_RN_DEVS.md](docs/NEXTJS_FOR_RN_DEVS.md)**

It covers routing, layouts, server vs client components, styling, and how this project is organized — with React Native comparisons throughout.

## Scripts

```bash
yarn dev      # development server
yarn build    # production build
yarn start    # run production build
yarn lint     # ESLint
```

## Project structure

```
src/app/          → pages and routes
src/components/   → reusable UI
public/images/    → logo and static assets
docs/             → documentation
```
