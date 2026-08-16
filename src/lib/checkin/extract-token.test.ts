import { describe, expect, it } from "vitest";
import { extractTokenFromScan } from "./extract-token";

describe("extractTokenFromScan", () => {
  it("extracts the token from a full ticket URL", () => {
    expect(extractTokenFromScan("https://app.example.com/ticket/abc123def456")).toBe("abc123def456");
  });

  it("strips trailing query/hash fragments", () => {
    expect(extractTokenFromScan("https://app.example.com/ticket/abc123?utm=x")).toBe("abc123");
  });

  it("returns the raw value when it is not a URL", () => {
    expect(extractTokenFromScan("abc123def456")).toBe("abc123def456");
  });
});
