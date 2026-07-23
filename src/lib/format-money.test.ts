import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format-money";

describe("formatMoney", () => {
  it("formats with stable en-US grouping for SSR/client parity", () => {
    expect(formatMoney(62800000, "AMD")).toBe("62,800,000 AMD");
    expect(formatMoney(1000, "USD")).toBe("1,000 USD");
  });
});
