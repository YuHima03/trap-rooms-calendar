import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  const development = phase === PHASE_DEVELOPMENT_SERVER;
  const apiOrigin = (
    process.env.DEV_API_BASE_URL || "http://localhost:5211"
  ).replace(/\/$/, "");

  return {
    output: "export",
    trailingSlash: true,
    // Preserve RPC POST paths instead of redirecting them to a trailing slash.
    skipTrailingSlashRedirect: development,
    transpilePackages: ["proto"],
    images: {
      unoptimized: true,
    },
    // Rewrite API requests to the backend during development.
    ...(development && getRewritesForDevelopment(apiOrigin)),
  };
}

function getRewritesForDevelopment(apiOrigin: string) {
  return {
    rewrites: async () => [
      ...["room", "event", "user"].map((namespace) => ({
        source: `/${namespace}.v1.:service/:method`,
        destination: `${apiOrigin}/${namespace}.v1.:service/:method`,
      })),
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/_oauth/:path*", destination: `${apiOrigin}/_oauth/:path*` },
    ],
  }
}
