import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins multiple class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("lets the last conflicting Tailwind class win (twMerge)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignores falsy values and resolves conditional objects", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
