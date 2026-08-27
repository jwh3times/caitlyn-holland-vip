import { describe, it, expect, expectTypeOf } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, CtaLink, type ButtonProps } from "@/components/ui/button";

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

  it("applies the gradient CTA variant and cta size", () => {
    render(
      <Button variant="gradient" size="cta">
        Go
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Go" });
    expect(btn).toHaveClass("bg-gradient-to-r");
    expect(btn).toHaveClass("px-8");
    // Gradient variant overrides the base radius/weight via tailwind-merge.
    expect(btn).toHaveClass("rounded-xl");
    expect(btn).not.toHaveClass("rounded-md");
  });

  it("makes invalid CTA variant and size pairings unrepresentable", () => {
    expectTypeOf<{ variant: "gradient"; size: "cta" }>().toMatchTypeOf<ButtonProps>();
    expectTypeOf<{ variant: "gradient"; size: "default" }>().not.toMatchTypeOf<ButtonProps>();
    expectTypeOf<{ variant: "default"; size: "cta" }>().not.toMatchTypeOf<ButtonProps>();
  });
});

describe("CtaLink", () => {
  it("renders a medium primary CTA by default", () => {
    render(<CtaLink href="/next">Continue</CtaLink>);
    const link = screen.getByRole("link", { name: "Continue" });
    expect(link).toHaveAttribute("href", "/next");
    expect(link).toHaveClass("bg-gradient-to-r");
    expect(link).toHaveClass("px-8");
  });

  it("maps the secondary tone and large size", () => {
    render(
      <CtaLink href="https://example.com" tone="secondary" size="lg" target="_blank">
        Learn more
      </CtaLink>
    );
    const link = screen.getByRole("link", { name: "Learn more" });
    expect(link).toHaveClass("border-blue-600");
    expect(link).toHaveClass("px-10");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("merges a custom className", () => {
    render(
      <CtaLink href="#details" className="custom-x">
        Details
      </CtaLink>
    );
    expect(screen.getByRole("link", { name: "Details" })).toHaveClass("custom-x");
  });
});
