# Authentication and Access Control

There is no password authentication. `app/lib/session.ts` wraps a cookie session that stores a `userId` and an optional `devCountry` override. `app/components/dev-ui.tsx` renders a floating panel that switches the current user and country, posting to `app/routes/api.switch-user.ts` and `app/routes/api.set-dev-country.ts`. A 401 reading "Select a user from the DevUI panel" means the session has no user selected.

`app/lib/access.server.ts` centralises authorisation. `getAccess(request, courseId)` returns an `Access` record describing the viewer — `isAdmin`, `isOwningInstructor`, `isStaff`, `enrolled`, the PPP fields, and `canViewContent`. It never throws, because lesson pages need to render a paywall preview for signed-out and unenrolled visitors. Built on top of it are throwing guards for callers that should reject outright:

- `requireUserId` — 401 when signed out
- `requireContentAccess` — 401/403 unless the viewer can read course content
- `requireStaff` — 401/403 unless the viewer is the owning instructor or an admin
- `requireInstructorOrAdmin` — for pages spanning all of someone's courses

Loaders and actions are authorised independently. A loader guard does not protect the action on the same route, so mutating actions call a `require*` guard themselves.
