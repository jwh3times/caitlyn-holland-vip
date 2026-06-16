import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navigation } from "@/components/Navigation";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

describe("Navigation", () => {
  it("renders the brand and nav links", () => {
    render(<Navigation />);
    expect(screen.getByText("Caitlyn Holland")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "About" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Contact" }).length).toBeGreaterThan(0);
  });

  it("opens the mobile menu and closes it when a link is tapped", async () => {
    render(<Navigation />);
    const openBtn = screen.getByRole("button", { name: "Open menu" });
    expect(openBtn).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(openBtn);
    const closeBtn = screen.getByRole("button", { name: "Close menu" });
    expect(closeBtn).toHaveAttribute("aria-expanded", "true");
    // Desktop + mobile menus both render the link now.
    expect(screen.getAllByRole("link", { name: "About" })).toHaveLength(2);

    const aboutLinks = screen.getAllByRole("link", { name: "About" });
    await userEvent.click(aboutLinks[aboutLinks.length - 1]);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });
});
