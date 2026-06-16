import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactSection } from "@/components/sections/ContactSection";

describe("ContactSection", () => {
  it("renders the email and LinkedIn links", () => {
    render(<ContactSection />);
    expect(screen.getByRole("link", { name: "Send Me an Email" })).toHaveAttribute(
      "href",
      "mailto:caitlyn.holland121@gmail.com"
    );
    const linkedin = screen.getByRole("link", { name: "LinkedIn" });
    expect(linkedin.getAttribute("href")).toContain("linkedin.com");
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
  });
});
