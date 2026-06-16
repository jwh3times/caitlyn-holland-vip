import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

describe("ThemeProvider", () => {
  it("renders its children", () => {
    render(
      <ThemeProvider attribute="class">
        <p>themed child</p>
      </ThemeProvider>
    );
    expect(screen.getByText("themed child")).toBeInTheDocument();
  });
});
