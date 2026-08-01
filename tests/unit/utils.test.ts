import { describe, it, expect } from "vitest";
import { generateNumericStaticParams } from "@/lib/utils";

describe("generateNumericStaticParams", () => {
  it("defaults to 500 numeric string ids starting at 1", () => {
    const params = generateNumericStaticParams();
    expect(params).toHaveLength(500);
    expect(params[0]).toEqual({ id: "1" });
    expect(params[499]).toEqual({ id: "500" });
  });

  it("respects a custom count", () => {
    const params = generateNumericStaticParams(3);
    expect(params).toEqual([{ id: "1" }, { id: "2" }, { id: "3" }]);
  });

  it("returns an empty array for count 0", () => {
    expect(generateNumericStaticParams(0)).toEqual([]);
  });
});
