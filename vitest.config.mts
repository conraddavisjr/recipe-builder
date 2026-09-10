import { defineConfig } from "vitest/config";
import path from "node:path";

// Tests cover pure logic only (context building, similarity, schemas, scheduling).
// Components and route handlers are exercised in the browser, not here.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
});
