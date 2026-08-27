import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navigation } from "@/components/navigation";
import { profile } from "@/lib/profile";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

describe("Navigation", () => {
  it("renders the brand and nav links", () => {
    render(<Navigation />);
    expect(screen.getByText(profile.name)).toBeInTheDocument();
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

    const mobileAbout = screen.getAllByRole("link", { name: "About" }).at(-1);
    if (!mobileAbout) throw new Error("expected a mobile About link");
    await userEvent.click(mobileAbout);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("links the toggle to the menu via aria-controls", async () => {
    render(<Navigation />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const closeBtn = screen.getByRole("button", { name: "Close menu" });
    expect(closeBtn).toHaveAttribute("aria-controls", "mobile-menu");
    expect(document.getElementById("mobile-menu")).toBeInTheDocument();
  });

  it("closes the mobile menu on Escape and restores focus to the toggle", async () => {
    render(<Navigation />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    const openBtn = screen.getByRole("button", { name: "Open menu" });
    expect(openBtn).toHaveAttribute("aria-expanded", "false");
    expect(openBtn).toHaveFocus();
  });

  it("moves focus to the first menu item when opened", async () => {
    render(<Navigation />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.getElementById("mobile-menu");
    if (!menu) throw new Error("expected the mobile menu to render");
    expect(within(menu).getAllByRole("link")[0]).toHaveFocus();
  });

  it("traps Tab focus within the open menu", async () => {
    render(<Navigation />);
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const menu = document.getElementById("mobile-menu");
    if (!menu) throw new Error("expected the mobile menu to render");
    const links = within(menu).getAllByRole("link");
    const first = links.at(0);
    const last = links.at(-1);
    if (!first || !last) throw new Error("expected menu links");

    // Tab forward from the last item wraps back to the first.
    last.focus();
    await userEvent.keyboard("{Tab}");
    expect(first).toHaveFocus();

    // Shift+Tab from the first item wraps to the last.
    first.focus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    expect(last).toHaveFocus();
  });
});
