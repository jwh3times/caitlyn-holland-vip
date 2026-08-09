import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/footer";
import { profile } from "@/lib/profile";

describe("Footer", () => {
  it("renders the copyright with the current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(`${year} ${profile.name}`))).toBeInTheDocument();
  });
});
