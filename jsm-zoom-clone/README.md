# RealZoom

A Zoom-style video conferencing app built with Next.js. Signed-in users can start instant meetings, schedule meetings for later, join by link, use a personal meeting room, and browse previous calls and recordings.

## Features

- **Instant meetings**: start a call with one click and share the link.
- **Scheduled meetings**: pick a future date and time and an optional description, then copy the invite link.
- **Home dashboard**: a live clock in the viewer's own timezone and your next upcoming meeting.
- **Join by link or ID**: paste a meeting link (from any host) or just the meeting ID.
- **Personal room**: a permanent room tied to your user ID, with a copyable invite.
- **Meeting room**: grid or speaker layouts, participant list, call stats, device settings, and "end call for everyone" for the host.
- **Pre-join setup**: camera/mic preview, with an option to join with both off.
- **History**: upcoming, previous and recorded calls, with playback links for recordings.
- **Auth**: email and social sign-in through Clerk. Every app page requires a session.

## Tech stack

| Area           | Library                                                        |
| -------------- | -------------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org) (App Router, Turbopack), React 19 |
| Auth           | [Clerk](https://clerk.com) (`@clerk/nextjs` 7)                 |
| Video          | [Stream Video](https://getstream.io/video/) React SDK + Node SDK |
| Styling        | Tailwind CSS 4, `tw-animate-css`, shadcn/ui (Radix primitives) |
| Misc           | `react-datepicker`, `lucide-react`                              |
| Tooling        | TypeScript 6, ESLint 9 (flat config, `eslint-config-next`)     |

## Getting started

### Prerequisites

- Node.js **20.9 or newer** (required by Next.js 16)
- A free [Clerk](https://dashboard.clerk.com) application
- A free [Stream](https://dashboard.getstream.io) app with Video enabled

### 1. Install

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

| Variable                            | Where it comes from                         | Used by        |
| ----------------------------------- | ------------------------------------------- | -------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API keys                  | browser + server |
| `CLERK_SECRET_KEY`                  | Clerk dashboard → API keys                  | server only    |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`     | `/sign-in` (the app's own sign-in page)     | Clerk redirects |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL`     | `/sign-up`                                  | Clerk redirects |
| `NEXT_PUBLIC_STREAM_API_KEY`        | Stream dashboard → your app                 | browser + server |
| `STREAM_SECRET_KEY`                 | Stream dashboard → your app                 | server only (token signing) |
| `NEXT_PUBLIC_BASE_URL`              | The app's public URL, e.g. `http://localhost:3000` | invite links |

If you leave the two `*_SIGN_IN/UP_URL` values unset, Clerk sends users to its hosted Account Portal instead of the in-app pages.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to sign in first.

## Scripts

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack)                        |
| `npm run build`     | Production build (also type-checks)                     |
| `npm start`         | Serve the production build                              |
| `npm run lint`      | Run ESLint over the project                             |
| `npm run typecheck` | Generate Next.js route types, then run `tsc --noEmit`   |

## Project structure

```
app/
  layout.tsx                 Root layout: ClerkProvider, fonts, global CSS, toaster
  globals.css                Tailwind v4 theme (brand colours) + Stream/Clerk overrides
  (auth)/sign-in, sign-up    Clerk <SignIn/> and <SignUp/> pages (public)
  (root)/layout.tsx          Requires a session; wraps everything in the Stream client
  (root)/(home)/             Pages with navbar + sidebar: home, upcoming, previous,
                             recordings, personal-room
  (root)/meeting/[id]/       Meeting page: setup screen, then the call itself
actions/stream.actions.ts    Server action that signs Stream user tokens
providers/StreamClientProvider.tsx  Creates the Stream video client for the signed-in user
hooks/                       useGetCalls (call history), useGetCallById
components/                  App components (MeetingRoom, MeetingSetup, CallList, ...)
components/ui/               shadcn/ui primitives
constants/index.ts           Sidebar links and avatar images
proxy.ts                     Clerk middleware (Next.js 16 "proxy" convention)
```

## How it works

1. **Authentication.** `proxy.ts` runs `clerkMiddleware()` on every request. `app/(root)/layout.tsx` calls `auth.protect()`, so every page in that route group redirects signed-out visitors to `/sign-in`.
2. **Video client.** Once Clerk has loaded the user, `StreamClientProvider` creates a `StreamVideoClient` for them. Its `tokenProvider` is the `tokenProvider` server action, which checks the Clerk session and signs a one-hour Stream token with `STREAM_SECRET_KEY`. The secret never reaches the browser.
3. **Meetings.** New and scheduled meetings are Stream calls of type `default`, with a random UUID as the call ID. The meeting page loads the call by ID, shows a device-setup screen, then joins.
4. **History.** `useGetCalls` asks Stream for calls the user created or is a member of, and splits them into upcoming and ended. Recordings are fetched per call.

## Deployment

The app deploys to any Node host that supports Next.js, Vercel included. Set the same environment variables in your host. Set `NEXT_PUBLIC_BASE_URL` to the production URL so invite links point to the right place. For production, use Clerk's production keys.
