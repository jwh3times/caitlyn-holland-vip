import type { MetadataRoute } from "next";
import { profile } from "@/lib/profile";

// Required for `output: "export"` — emit a static sitemap.xml at build time.
export const dynamic = "force-static";

// Single-page site: one entry. Generated to a static sitemap.xml at build time
// (output: "export"), so lastModified reflects the build, like Footer's year.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: profile.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
