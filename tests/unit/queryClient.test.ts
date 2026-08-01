import { describe, it, expect } from "vitest";
import { queryClient } from "@/lib/queryClient";

describe("queryClient", () => {
  it("configures the shared defaults used across the app", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(0);
  });
});
