import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/SocialIcons";

describe("SocialIcons", () => {
  it("renders the GitHub icon and merges a custom className", () => {
    const { container } = render(<GitHubIcon className="text-red-500" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("w-6", "h-6", "text-red-500");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the LinkedIn icon with the default classes", () => {
    const { container } = render(<LinkedInIcon />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveClass("w-6", "h-6");
  });
});
