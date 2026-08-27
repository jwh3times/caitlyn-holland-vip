import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import NotFound from "@/app/not-found";

vi.mock("next/link", () => ({
  default: function MockLink({ href, children, ...rest }: ComponentProps<"a">) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

describe("NotFound", () => {
  it("renders the 404 page with a link home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "404" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Page Not Found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
  });
});
