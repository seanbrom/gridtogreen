import type { MetadataRoute } from "next";
import { getAllBriefings } from "@/lib/kv";
import { getBaseUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const briefings = await getAllBriefings();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/archive`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/upcoming`,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const briefingPages: MetadataRoute.Sitemap = briefings.map((b) => ({
    url: `${baseUrl}/briefings/${b.slug}`,
    lastModified: new Date(b.generatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...briefingPages];
}
