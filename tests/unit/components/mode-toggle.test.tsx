import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useThemeToggle } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

vi.mock("@/components/theme-provider", () => ({
  useThemeToggle: vi.fn(),
}));

const mockedUseThemeToggle = vi.mocked(useThemeToggle);
const toggle = vi.fn();

function withTheme(isDark: boolean, mounted = true) {
  mockedUseThemeToggle.mockReturnValue({ mounted, isDark, toggle });
}

describe("ModeToggle", () => {
  beforeEach(() => {
    toggle.mockClear();
  });

  it("offers to activate dark mode while in light mode", () => {
    withTheme(false);
    render(<ModeToggle />);
    expect(screen.getByRole("button", { name: /activate dark mode/i })).toBeInTheDocument();
  });

  it("delegates theme changes to the theme module", async () => {
    withTheme(false);
    render(<ModeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /activate dark mode/i }));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it("offers to activate light mode while in dark mode", () => {
    withTheme(true);
    render(<ModeToggle />);
    expect(screen.getByRole("button", { name: /activate light mode/i })).toBeInTheDocument();
  });

  it("renders an inaccessible server-matching fallback before mount", () => {
    withTheme(false, false);
    render(<ModeToggle />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
