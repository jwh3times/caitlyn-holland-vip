import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillsSection } from "@/components/sections/SkillsSection";

describe("SkillsSection", () => {
  it("publishes every skill in the Skills section", () => {
    const { container } = render(<SkillsSection />);

    expect(container.querySelector("section")).toHaveAttribute("id", "skills");
    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByText("Test Automation")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("Public Speaking")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(14);
  });
});
