import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "",
  // Stop `next dev` writing its managed <!-- BEGIN:nextjs-agent-rules --> block into
  // AGENTS.md. AGENTS.md is hand-authored here; see ADR-0008 and the "Next.js agent
  // rules" section of AGENTS.md, which carries the bundled-docs pointer by hand.
  agentRules: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/webpack"],
        type: "css",
      },
    },
  },
  // Security headers are served by Cloudflare Pages via public/_headers.
};

export default nextConfig;
