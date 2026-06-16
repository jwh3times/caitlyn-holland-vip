import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutSection } from "@/components/sections/AboutSection";

describe("AboutSection", () => {
  it("renders the section heading and each subsection", () => {
    render(<AboutSection />);
    expect(screen.getByRole("heading", { name: "About Me" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Education" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Certifications" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
  });

  it("renders the mapped experience roles and skills", () => {
    render(<AboutSection />);
    expect(screen.getByText("Software Engineering Manager")).toBeInTheDocument();
    expect(screen.getByText("Test Engineer")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Systems Thinking")).toBeInTheDocument();
  });
});
