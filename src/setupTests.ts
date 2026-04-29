import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest は globals: true を有効にしていないため、@testing-library/react の
// 自動 cleanup は走らない。ここで明示的に各テスト後に DOM をアンマウントする。
afterEach(() => {
    cleanup();
});
