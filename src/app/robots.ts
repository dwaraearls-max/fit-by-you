import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/app-url";

const BASE = getAppUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing behind authentication should ever be indexed.
      disallow: ["/app", "/app/", "/onboarding", "/login", "/signup", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
