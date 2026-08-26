import type { MetadataRoute } from "next";

import { getAppUrl } from "@/lib/app-url";

const BASE = getAppUrl();

/** Marketing pages only — everything behind authentication stays out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; frequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, frequency: "weekly" },
    { path: "/how-it-works", priority: 0.9, frequency: "monthly" },
    { path: "/pricing", priority: 0.9, frequency: "monthly" },
    { path: "/about", priority: 0.6, frequency: "monthly" },
    { path: "/help", priority: 0.6, frequency: "monthly" },
    { path: "/security", priority: 0.5, frequency: "monthly" },
    { path: "/contact", priority: 0.5, frequency: "monthly" },
    { path: "/careers", priority: 0.4, frequency: "monthly" },
    { path: "/privacy", priority: 0.3, frequency: "yearly" },
    { path: "/terms", priority: 0.3, frequency: "yearly" },
  ];

  return routes.map((route) => ({
    url: `${BASE}${route.path}`,
    lastModified: now,
    changeFrequency: route.frequency,
    priority: route.priority,
  }));
}
