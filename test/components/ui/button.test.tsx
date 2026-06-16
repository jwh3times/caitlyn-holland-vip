import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders a button with the default variant classes", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass("bg-blue-600");
  });

  it("applies variant and size classes", () => {
    render(
      <Button variant="outline" size="lg">
        Outlined
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Outlined" });
    expect(btn).toHaveClass("border");
    expect(btn).toHaveClass("h-11");
  });

  it("merges a custom className", () => {
    render(<Button className="custom-x">Hi</Button>);
    expect(screen.getByRole("button", { name: "Hi" })).toHaveClass("custom-x");
  });

  it("exposes buttonVariants for class composition", () => {
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-gray-100");
  });
});
