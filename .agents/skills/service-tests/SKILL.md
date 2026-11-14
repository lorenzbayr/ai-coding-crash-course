---
name: service-tests
description: Writing and running tests. Use when adding or debugging a test, especially one for a service or anything touching the database.
---

# Service Tests

Services use the shared `db` singleton from `~/db` directly, so a test swaps the database by **mocking the module**, never by passing a handle in. `app/test/setup.ts` provides the database:

- `createTestDb()` — a fresh in-memory SQLite database with the real migrations from `drizzle/` applied, so test and production schemas match.
- `seedBaseData(testDb)` — inserts a student `user`, an `instructor`, a `category`, and a published `course`; returns them for use in assertions.

## Steps

1. **Create the file** next to the module under test: `app/services/<name>.test.ts`.

2. **Mock `~/db` with a getter, then import the module under test below the mock:**

   ```ts
   import { createTestDb, seedBaseData } from "~/test/setup";
   import * as schema from "~/db/schema";

   let testDb: ReturnType<typeof createTestDb>;
   let base: ReturnType<typeof seedBaseData>;

   vi.mock("~/db", () => ({
     get db() {
       return testDb;
     },
   }));

   // Import after mock so the module picks up the test db
   import { getCourseById } from "./courseService";

   beforeEach(() => {
     testDb = createTestDb();
     base = seedBaseData(testDb);
   });
   ```

   The getter keeps the binding live as `beforeEach` replaces `testDb`. An import placed above the mock silently binds the service to the real `data.db` — the test may still pass while reading the wrong database.

3. **Insert extra rows** through `testDb.insert(schema.<table>)`, using the TypeScript enums from `~/db/schema` (`UserRole`, `CourseStatus`, …) for enum columns.

4. **Run the file:**

   ```bash
   npx vitest run app/services/<name>.test.ts
   npx vitest run app/services/<name>.test.ts -t "<test name>"   # one test
   ```

Done when the file runs green on its own and `npm test` passes.

Vitest runs with `globals: true` and `vite-tsconfig-paths`: `describe`/`it`/`expect`/`vi` need no import, and `~/*` resolves.
