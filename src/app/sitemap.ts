import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { fetchPublishedStories } from "@/lib/firebase/stories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/cuenta/registro`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/cuenta/ingresar`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const stories = await fetchPublishedStories();
    const storyRoutes: MetadataRoute.Sitemap = stories.map((story) => ({
      url: `${base}/historia/${story.id}`,
      lastModified: story.date ? new Date(story.date) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticRoutes, ...storyRoutes];
  } catch {
    return staticRoutes;
  }
}
