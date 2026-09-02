import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { profile } from "@/lib/profile";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

describe("Home page", () => {
  it("composes the navigation, all sections, and footer", () => {
    render(<Home />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(profile.name);
    expect(screen.getByRole("heading", { name: "About Me" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Experience/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Get In Touch" })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();

    expect([...document.querySelectorAll("main > section")].map((section) => section.id)).toEqual([
      "",
      "about",
      "skills",
      "experience",
      "contact",
    ]);
  });
});
