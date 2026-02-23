# AGENTS.md

Guidance for coding agents working in this repository.

## Project

- Name: `textbooked-frontend`
- Stack: Next.js App Router + TypeScript + Tailwind + shadcn/ui
- API: Orval-generated typed client from backend OpenAPI
- Auth: Auth.js (Google) + JWT session + backend Bearer token
- Package manager: Yarn only

## Hard Constraints

- Use `yarn` commands only. Do not use `npm`.
- Do not call backend endpoints with raw `fetch` from pages/components.
- Route all API calls through `lib/api/*` domain functions.
- Keep changes minimal and focused; avoid overengineering.
- Never commit secrets (`.env`, OAuth secrets, tokens).

## Common Commands

```bash
yarn codegen
yarn check:structure
yarn g:component components/shared/MyComponent --client
yarn g:component app/'(public)'/help/components HelpPanel --client
yarn g:component components/complex/AccountPanel AccountPanel --client --structured
yarn dev
yarn lint
yarn build
```

## Environment Variables

Required for local/prod:

- `NEXT_PUBLIC_BACKEND_URL`
- `NEXT_PUBLIC_OPENAPI_PATH` (default expected: `/swagger-yaml`)
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (required in production)

Optional:

- `BACKEND_JWT_SECRET` (if not set, backend token signing falls back to `AUTH_SECRET`)

## Repository Layout

- `app/` Next.js route entries and route-local modules
- `providers/` global providers (`SessionProvider`, theme, toasts)
- `components/` reusable shared components and UI primitives
- `lib/api/` API config, mutator, request helpers, domain endpoints
- `lib/api/endpoints/` Orval-generated clients (committed)
- `lib/api/schemas/` Orval-generated models (committed)
- `lib/auth/` token helpers
- `lib/utils/` shared utilities

## Component Architecture

- `app/**/page.tsx` and `app/**/layout.tsx` are Next.js route entrypoints.
- Colocate route-specific modules under each route segment:
  - `app/**/components`
  - `app/**/hooks`
  - `app/**/lib`
  - `app/**/types.ts`
- Keep components minimal by default (`index.tsx` only when enough).
- Use `createComponent` selectively for complex reusable components only.
- `style.ts` is optional and should be used only for reusable CVA/tokens.
- Forbidden:
  - `app/**/_screen`
  - `app/**/_layout`
  - `legacy.tsx`
  - explicit `createComponent<...>` generic syntax

## API + Auth Rules

- Codegen source:
  - `${ORVAL_BACKEND_URL}${NEXT_PUBLIC_OPENAPI_PATH}` (if set), else
  - `${NEXT_PUBLIC_BACKEND_URL}${NEXT_PUBLIC_OPENAPI_PATH}`
- Generated output must remain committed in `lib/api/endpoints/` and `lib/api/schemas/`.
- Backend auth header format: `Authorization: Bearer <token>`.
- `session.apiToken` is the token used by API layer.

## UI/UX Baseline

- Show loading state for all network operations.
- Show empty states where data can be missing.
- Show readable error messages for failed requests.
- Mutations should disable pending actions while in flight.

## Change Workflow

1. Read the affected route/component and API domain functions.
2. Implement changes in the smallest coherent patch.
3. If backend contract changes, run `yarn codegen`.
4. Run:
   - `yarn lint`
   - `yarn build`
5. Update docs (`README.md`, `.env.example`) when scripts/env/behavior change.

## Done Criteria

- Type-safe code with no lint/build errors.
- Uses generated client and shared API layer consistently.
- No secret leakage in code/docs.
- Behavior validated for loading/error/empty states where relevant.
