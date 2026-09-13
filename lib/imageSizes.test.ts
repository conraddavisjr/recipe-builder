import { describe, expect, it } from "vitest";
import { imagePathsFor, srcSetFor, variantPath } from "./imageSizes";

describe("variantPath", () => {
  it("inserts the width before the extension", () => {
    expect(variantPath("recipes/a/b.webp", 480)).toBe("recipes/a/b@480.webp");
    expect(variantPath("https://x.test/storage/recipes/a/b.webp", 960)).toBe("https://x.test/storage/recipes/a/b@960.webp");
  });
  it("leaves extension-less input alone", () => {
    expect(variantPath("recipes/a/b", 480)).toBe("recipes/a/b");
  });
});

describe("srcSetFor", () => {
  it("lists variants ascending then the native file", () => {
    expect(srcSetFor("u/p.webp", "photo")).toBe("u/p@480.webp 480w, u/p@960.webp 960w, u/p.webp 1536w");
    expect(srcSetFor("u/a.webp", "art")).toBe("u/a@96.webp 96w, u/a@192.webp 192w, u/a.webp 1024w");
  });
});

describe("imagePathsFor", () => {
  it("returns the native path and every variant so deletes remove all of them", () => {
    expect(imagePathsFor("ingredients/garlic.webp", "art")).toEqual(["ingredients/garlic.webp", "ingredients/garlic@96.webp", "ingredients/garlic@192.webp"]);
  });
});
