import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExperienceSection } from "@/components/sections/ExperienceSection";

describe("ExperienceSection", () => {
  it("publishes every role in the Experience section", () => {
    const { container } = render(<ExperienceSection />);

    expect(container.querySelector("section")).toHaveAttribute("id", "experience");
    expect(screen.getByRole("heading", { name: /Experience/ })).toBeInTheDocument();
    expect(screen.getByText("Software Engineering Manager")).toBeInTheDocument();
    expect(screen.getByText("Manager, Software Development Engineer in Test")).toBeInTheDocument();
    expect(screen.getByText("Software Development Engineer in Test")).toBeInTheDocument();
    expect(screen.getByText("Test Engineer")).toBeInTheDocument();
  });
});
