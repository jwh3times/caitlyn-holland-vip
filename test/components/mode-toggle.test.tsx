import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTheme } from "next-themes";
import { ModeToggle } from "@/components/mode-toggle";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

const mockedUseTheme = vi.mocked(useTheme);
const setTheme = vi.fn();

function withTheme(resolvedTheme: string) {
  mockedUseTheme.mockReturnValue({
    resolvedTheme,
    setTheme,
  } as unknown as ReturnType<typeof useTheme>);
}

describe("ModeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
  });

  it("offers to activate dark mode while in light mode", () => {
    withTheme("light");
    render(<ModeToggle />);
    expect(screen.getByRole("button", { name: /activate dark mode/i })).toBeInTheDocument();
  });

  it("switches to dark when clicked in light mode", async () => {
    withTheme("light");
    render(<ModeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /activate dark mode/i }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches to light when clicked in dark mode", async () => {
    withTheme("dark");
    render(<ModeToggle />);
    await userEvent.click(screen.getByRole("button", { name: /activate light mode/i }));
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
