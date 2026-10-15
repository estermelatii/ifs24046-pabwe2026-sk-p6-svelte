import { describe, it, expect } from "vitest";
import { LINK_TREE_TYPES, getTypeMeta } from "./constants";

describe("link tree constants", () => {
  it("should expose public, unlisted, and private types", () => {
    expect(LINK_TREE_TYPES.map((t) => t.value)).toEqual(["public", "unlisted", "private"]);
  });

  it("should resolve metadata for known types", () => {
    expect(getTypeMeta("public").label).toBe("Publik");
    expect(getTypeMeta("unlisted").label).toBe("Tidak Terdaftar");
    expect(getTypeMeta("private").label).toBe("Privat");
  });

  it("should fall back to the raw type for unknown types", () => {
    expect(getTypeMeta("secret")).toMatchObject({ value: "secret", label: "secret" });
  });

  it("should fall back to a dash when type is empty", () => {
    expect(getTypeMeta("").label).toBe("-");
    expect(getTypeMeta(undefined).label).toBe("-");
  });
});
