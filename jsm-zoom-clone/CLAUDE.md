@AGENTS.md

# RealZoom: guide for Claude

A Zoom-style video app: Next.js 16 (App Router) + React 19, Clerk 7 for auth, Stream Video for calls, Tailwind CSS 4 + shadcn/ui for UI. See `README.md` for features and setup.

## Commands

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build; also type-checks. It does NOT lint
npm run lint        # eslint . (flat config); `next lint` no longer exists
npm run typecheck   # next typegen && tsc --noEmit
```

The env var the app reads for Stream is `NEXT_PUBLIC_STREAM_API_KEY`; a plain `STREAM_API_KEY` is ignored.

There is no automated test suite. Before calling a change done, run `npm run typecheck`, `npm run lint` and `npm run build`; all three should pass with zero warnings. For UI changes, also check the page in a browser.

Running the app needs `.env.local` (see `.env.example`). Without Clerk keys, every page returns 500.

## Repo layout gotcha

The git repository root is the **parent** directory (`nextjs-projects/`), which holds several unrelated projects. Paths in `git status`/`git diff` are prefixed with `jsm-zoom-clone/`. Only stage files inside this folder, and never touch sibling projects.

## Architecture

- `proxy.ts`: Next 16's replacement for `middleware.ts`. It only runs `clerkMiddleware()` so that `auth()`/`currentUser()` work. It deliberately does **not** do route matching.
- `app/(root)/layout.tsx`: the auth gate. It calls `await auth.protect()`, so every route in the `(root)` group requires a session. New authenticated pages go under `app/(root)/`; public pages go elsewhere (e.g. `app/(auth)/`).
- `providers/StreamClientProvider.tsx`: creates the `StreamVideoClient` for the Clerk user and disconnects it on cleanup. Effect deps are primitive user fields, not the Clerk `user` object, because its identity changes on every session refresh.
- `actions/stream.actions.ts`: `'use server'` token provider. It re-checks `currentUser()` itself, because server actions are public endpoints and the layout's guard does not cover them. Any new server action or route handler must do its own auth check too.
- `hooks/useGetCalls.ts`, `hooks/useGetCallById.ts`: client-side Stream `queryCalls` wrappers.
- `app/(root)/meeting/[id]/page.tsx`: client page; `params` is a Promise, unwrapped with `use(params)`.
- `components/ui/`: shadcn/ui primitives (`components.json` → `tailwind.config: ""`, which is the v4 style).

## Library-version rules (these differ from older docs and tutorials)

**Next.js 16**
- `params`/`searchParams` are Promises. Use `await` in server components and `use()` in client components.
- Middleware is `proxy.ts`; the `middleware.ts` filename is deprecated.
- `next/image`: local `src` with a query string needs `images.localPatterns`, and the only quality allowed by default is `[75]`.
- Bundled docs for the installed version live in `node_modules/next/dist/docs/`.

**Clerk 7 (Core 3)**
- `<SignedIn>`, `<SignedOut>`, `<Protect>` are **removed** and throw at runtime. Use `<Show when="signed-in">`, `<Show when="signed-out">`, or `<Show when={{ permission: ... }}>`.
- `createRouteMatcher` is deprecated. Protect at the resource (layout/page/action) instead.
- `auth()` is async; use `await auth.protect()`.
- `afterSignOutUrl` goes on `<ClerkProvider>`, not `<UserButton>`.
- The `appearance` prop's layout settings live under `appearance.options` (formerly `appearance.layout`).
- `<ClerkProvider>` sits **inside** `<body>`. Putting it between `<html>` and `<body>` caused hydration errors.

**Stream**
- Server tokens: `streamClient.generateUserToken({ user_id, iat, exp })`. `createToken` is deprecated.

**Tailwind CSS 4** (CSS-first; there is no `tailwind.config.ts`)
- Theme tokens are in the `@theme` block in `app/globals.css`: `dark-1..4`, `blue-1`, `sky-1..3`, `orange-1`, `purple-1`, `yellow-1`. Add colours there as `--color-<name>`.
- Custom utilities use `@utility` (`flex-center`, `flex-between`, `bg-hero`), not `@layer utilities`.
- **Cascade layers matter.** Unlayered CSS beats every Tailwind layer, whatever its specificity:
  - Resets and element defaults go in `@layer base`. An unlayered `* { padding: 0 }` would silently override every `p-*` utility.
  - Overrides for Stream (`.str-video__*`) and Clerk (`.cl-*`) stay **unlayered**, because those libraries ship unlayered CSS. `globals.css` is imported *after* the library stylesheets in `app/layout.tsx` so it wins ties.
  - Clerk 7 injects its styles so that app CSS wins, so a `.cl-*` override always applies. Clerk's cards are light-themed, so never force `color: white` on Clerk elements. That once made the UserButton's "Sign out" invisible. To restyle Clerk, use the `appearance` prop on `<ClerkProvider>`.
- v4 renames: `shadow-sm`→`shadow-xs`, `rounded-sm`→`rounded-xs`, `rounded`→`rounded-sm`, `outline-none`→`outline-hidden`, bare `ring`→`ring-3`. Animations come from `tw-animate-css` (`tailwindcss-animate` is gone).
- shadcn semantic tokens (`bg-background`, `ring-ring`, `bg-accent`, …) appear in `components/ui` but are **not defined** in the theme, so they render nothing. That was already true before the upgrade. Style components with the brand tokens above.

**Tooling ceilings.** Don't bump these without checking peer ranges:
- ESLint stays on **9.x**: `eslint-plugin-react`, `-import` and `-jsx-a11y` (pulled in by `eslint-config-next`) don't support ESLint 10 yet.
- TypeScript stays on **6.0.x**: `typescript-eslint` requires `<6.1.0`.
- `next` and `eslint-config-next` are pinned to the same exact version. Upgrade them together.

## Lint rules worth knowing

`eslint-plugin-react-hooks` 7 includes React Compiler rules:
- `react-hooks/static-components`: never define a component inside another component's render. Hoist it and pass props (see `CallLayout` in `MeetingRoom.tsx`).
- `react-hooks/set-state-in-effect`: avoid synchronous `setState` in effects. The one deliberate exception (creating the Stream client) is suppressed with an explanatory comment.

## Conventions

- Import alias `@/*` maps to the project root.
- Components are default-exported PascalCase files in `components/`. Add `'use client'` only where hooks or browser APIs are needed.
- Merge Tailwind classes with `cn()` from `lib/utils.ts`.
- Show user feedback with `useToast()` from `components/ui/use-toast`.
- Build meeting links from `process.env.NEXT_PUBLIC_BASE_URL`.

## Behaviour worth knowing

- Anything time-of-day must render on the **client**. Server components run in the server's timezone (UTC on Vercel). `HomeHero` uses `useSyncExternalStore` with a `null` server snapshot for this reason.
- `MeetingTypeList` resets its form and `callDetail` every time a dialog opens; keep it that way, or "Schedule Meeting" re-opens on the previous "Meeting Created" screen.
- Join accepts a full link from any host or a bare call ID (`getMeetingPath`).

## Known quirks (not yet fixed)

- Branding: page titles say "RealZoom", the logo text says "RZOOM".
- `next/image` logs aspect-ratio warnings in dev for non-square SVG icons drawn in square boxes; they're cosmetic. Fixing them means resizing the icons.
- "Previous" includes any call whose start time has passed, even if it's still in progress (`useGetCalls`).
