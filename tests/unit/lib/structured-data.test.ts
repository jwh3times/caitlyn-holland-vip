import { describe, expect, it } from "vitest";

import { personJsonLd } from "@/lib/structured-data";

describe("personJsonLd", () => {
  it("serializes the published professional profile as valid Person JSON-LD", () => {
    const person = JSON.parse(personJsonLd()) as Record<string, unknown>;

    expect(person).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Caitlyn Holland",
      url: "https://caitlyn.holland.vip",
      jobTitle: "Software Engineering Manager",
      worksFor: {
        "@type": "Organization",
        name: "SAS",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Meredith College",
      },
      sameAs: ["https://www.linkedin.com/in/caitlyn-holland-debona-93140678/"],
    });
  });

  it("escapes opening angle brackets before embedding the JSON in HTML", () => {
    expect(personJsonLd()).not.toContain("<");
  });
});
