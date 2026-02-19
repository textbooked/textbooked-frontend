# Textbooked Frontend (MVP)

Next.js App Router frontend for testing Textbooked backend flows end-to-end.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Auth.js (Google-only)
- Orval-generated API client from backend OpenAPI
- Yarn package manager

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=https://api.textbooked.hofcoral.com
NEXT_PUBLIC_OPENAPI_PATH=/swagger-yaml
AUTH_SECRET=change-me-to-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# Optional override for backend JWT signing
# BACKEND_JWT_SECRET=change-me
# Optional in production
# NEXTAUTH_URL=https://your-frontend-domain.com
# AUTH_URL=https://your-frontend-domain.com
# AUTH_TRUST_HOST=true
```

Notes:
- `AUTH_SECRET` is used by Auth.js.
- Set `AUTH_URL` to your public frontend URL (for example your nginx domain).
- Set `AUTH_TRUST_HOST=true` behind reverse proxies so Auth.js uses forwarded host/proto headers.
- Backend JWTs are signed with HS256 in the frontend auth callback.
- By default, backend JWT signing uses `BACKEND_JWT_SECRET` if set, else `AUTH_SECRET`.
- For backend verification, use the same shared secret value on backend side.

## Scripts

```bash
yarn codegen
yarn dev
yarn build
yarn lint
```

### `yarn codegen`

- Removes old generated client files via `rimraf lib/api/generated`
- Generates API client/types with Orval from:
  - `${ORVAL_BACKEND_URL}${NEXT_PUBLIC_OPENAPI_PATH}` if `ORVAL_BACKEND_URL` is set
  - otherwise `${NEXT_PUBLIC_BACKEND_URL}${NEXT_PUBLIC_OPENAPI_PATH}`
- Writes output to `lib/api/generated`

## Google OAuth Setup

1. In Google Cloud Console, create OAuth client credentials (Web application).
2. Add this authorized redirect URI:
   - `http://localhost:3001/api/auth/callback/google`
   - `https://<your-vercel-domain>/api/auth/callback/google`
3. Put the generated client ID/secret into `.env.local`.

## Auth Behavior

- Google sign-in only.
- JWT session strategy.
- Session includes `session.backendToken` (HS256 token) used for backend Bearer auth.
- After sign-in, frontend calls backend `GET /auth/me` to ensure the backend user row is synced/created.
- API adapter automatically sends:
  - `Authorization: Bearer <session.backendToken>`

## Local Run

1. Start backend.
2. Run codegen:

```bash
yarn codegen
```

3. Start frontend:

```bash
yarn dev
```

Frontend runs on [http://localhost:3001](http://localhost:3001).

## Implemented Routes

- `/` Library
- `/books/new` Add Book
- `/books/[id]` Book Overview (ToC upload, pace generation, plan creation)
- `/plans/[planId]` Plan View (grouping + optimistic status toggle)
- `/toc/[nodeId]` ToC Node View (assignment + attempts)

## Backend Assumptions and Prerequisites

The frontend expects these backend endpoints for full MVP behavior:

- `GET /books`
- `PATCH /plan-items/:id/status`
- `GET /toc/:nodeId`
- `GET /questions/:id/attempts`

For strongest generated typing, backend Swagger should include response DTO metadata (`@ApiOkResponse({ type: ... })`) for used endpoints.

## CORS Note

Backend must allow frontend origins:
- `http://localhost:3001`
- `https://<your-vercel-domain>`

For NestJS this is typically done with:

```ts
app.enableCors({ origin: ["http://localhost:3001", "https://<your-vercel-domain>"] });
```
