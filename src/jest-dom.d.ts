// vitest 5 changed Assertion<T> to Assertion<R, T>, so the augmentation shipped
// in @testing-library/jest-dom/vitest no longer merges and every matcher loses
// its type (testing-library/jest-dom#738). Extend vitest's Matchers instead.
// Drop this file once jest-dom ships a vitest 5 aware declaration.
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}
