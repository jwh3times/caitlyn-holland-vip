import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";

describe("sitemap", () => {
  it("lists the homepage as the single entry", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      url: "https://caitlyn.holland.vip",
      changeFrequency: "monthly",
      priority: 1,
    });
    expect(entries[0].lastModified).toBeInstanceOf(Date);
  });
});
