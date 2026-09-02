import { profile } from "@/lib/profile";

export interface PersonStructuredData {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string;
  url: string;
  jobTitle: string;
  worksFor: {
    "@type": "Organization";
    name: string;
  };
  alumniOf: {
    "@type": "CollegeOrUniversity";
    name: string;
  };
  sameAs: string[];
}

const person: PersonStructuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  url: profile.siteUrl,
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
};

export const personJsonLd = () => JSON.stringify(person).replace(/</g, "\\u003c");
