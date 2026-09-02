import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutSection } from "@/components/sections/AboutSection";
import { profile } from "@/lib/profile";

describe("AboutSection", () => {
  it("keeps the profile, education, and certifications in About", () => {
    const { container } = render(<AboutSection />);
    expect(container.querySelector("section")).toHaveAttribute("id", "about");
    expect(screen.getByRole("heading", { name: "About Me" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Education" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Certifications" })).toBeInTheDocument();
    expect(screen.getByText(profile.bio)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.queryByText("Software Engineering Manager")).not.toBeInTheDocument();
  });
});
