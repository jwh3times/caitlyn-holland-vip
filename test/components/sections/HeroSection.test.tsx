import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/sections/HeroSection";

describe("HeroSection", () => {
  it("renders the headline and the call-to-action links", () => {
    render(<HeroSection />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Caitlyn Holland");
    expect(screen.getByRole("link", { name: "About Me" })).toHaveAttribute("href", "#about");
    expect(screen.getByRole("link", { name: "Get in Touch" })).toHaveAttribute("href", "#contact");
  });
});
