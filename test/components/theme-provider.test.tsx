import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { useTheme } from "next-themes";
import { Theme, useThemeToggle } from "@/components/theme-provider";

vi.mock("next-themes", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-themes")>();
  return {
    ...actual,
    useTheme: vi.fn(),
  };
});

const mockedUseTheme = vi.mocked(useTheme);
const setTheme = vi.fn();

function withTheme(resolvedTheme: string) {
  mockedUseTheme.mockReturnValue({
    resolvedTheme,
    setTheme,
  } as unknown as ReturnType<typeof useTheme>);
}

beforeEach(() => {
  setTheme.mockClear();
});

describe("Theme", () => {
  it("renders its children through a children-only interface", () => {
    render(
      <Theme>
        <p>themed child</p>
      </Theme>
    );
    expect(screen.getByText("themed child")).toBeInTheDocument();
  });
});

describe("useThemeToggle", () => {
  it("reports dark mode and toggles to light", () => {
    withTheme("dark");
    const { result } = renderHook(() => useThemeToggle());

    expect(result.current.mounted).toBe(true);
    expect(result.current.isDark).toBe(true);
    act(() => result.current.toggle());
    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("reports light mode and toggles to dark", () => {
    withTheme("light");
    const { result } = renderHook(() => useThemeToggle());

    expect(result.current.mounted).toBe(true);
    expect(result.current.isDark).toBe(false);
    act(() => result.current.toggle());
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
