import { describe, expect, it } from "vitest";
import manifest from "@/public/manifest.json";
import { profile } from "@/lib/profile";

describe("profile", () => {
  it("keeps the static web manifest aligned with the shared profile", () => {
    expect(manifest.name).toBe(profile.name);
    expect(manifest.short_name).toBe(profile.name);
    expect(manifest.description).toBe(profile.description);
  });
});
