import { defineConfig } from "vitest/config";
import path from "path";
import "dotenv/config";

const templateRoot = path.resolve(import.meta.dirname);

// Tests exercise the real tRPC routers against a real database (no db mocking),
// which used to write straight into the dev database and leave hundreds of
// fixture orders behind. Point tests at a `_test`-suffixed sibling database
// instead, so `pnpm test` can never touch dev/prod data. Schema is kept in
// sync by running `DATABASE_URL=<test-url> pnpm db:push` after schema changes.
if (process.env.DATABASE_URL) {
  const testDbUrl = new URL(process.env.DATABASE_URL);
  testDbUrl.pathname = `${testDbUrl.pathname}_test`;
  process.env.DATABASE_URL = testDbUrl.toString();
}

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
  },
});
