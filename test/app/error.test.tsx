import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import ErrorBoundary from "@/app/error";

vi.mock("next/link", () => ({
  default: function MockLink({ href, children, ...rest }: ComponentProps<"a">) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

describe("Error boundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the error UI and logs the error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
  });

  it("calls reset() when 'Try Again' is clicked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);
    await userEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("links back to the home page", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Go Home" })).toHaveAttribute("href", "/");
  });
});
