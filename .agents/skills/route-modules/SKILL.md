---
name: route-modules
description: Route modules — pages, API endpoints, loaders, actions. Use when adding a route, or writing or changing a loader or action.
---

# Route Modules

Routing is **config-based**: `app/routes.ts` is the route table, and a module in `app/routes/` does nothing until it is registered there. A route module owns HTTP concerns — parsing, guards, redirects, status codes — and rendering; data access goes through `app/services/`.

## Steps

1. **Create the module** in `app/routes/`, named with dots for path segments and `$` for params: `instructor.$courseId.students.tsx`. Endpoints with no UI are `.ts` and prefixed `api.`.

2. **Register it** in `app/routes.ts`. App pages go inside the `layout("routes/layout.app.tsx", [...])` block; `api/*`, `login`, and `signup` sit outside it.

3. **Import the generated types** from `./+types/<file-name-without-extension>` and type the exports with `Route.LoaderArgs`, `Route.ActionArgs`, `Route.MetaArgs`.

4. **Parse every input** with the Zod helpers in `app/lib/validation.ts` — see [Validation](#validation).

5. **Guard the loader and the action separately.** A loader guard does not protect the action on the same route; every mutating action calls its own `require*` guard. Read [`docs/auth-and-access.md`](../../../docs/auth-and-access.md) to pick the guard.

6. **Typecheck** — `npm run typecheck`. It runs `react-router typegen` first, which creates the `./+types/*` module; plain `tsc` reports it missing.

Done when the route is in `app/routes.ts`, every loader and action parses its inputs and carries its own guard, and the typecheck passes.

## Validation

- `parseParams(params, schema)` — throws a 400; a malformed URL param is not a user-correctable error. Use `z.coerce.number().int()` for numeric ids.
- `parseFormData(formData, schema)` — returns `{ success: true, data }` or `{ success: false, errors }`, a map of the first error per field; return `errors` to render inline form errors.
- `parseJsonBody(request, schema)` — the same shape as `parseFormData`, for JSON endpoints.

Actions that handle several forms branch on an `intent` field: one schema per form, each with `intent: z.literal("<name>")`.
