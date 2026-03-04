import { getApiBaseUrl, getSiteUrl } from "@/lib/env";
import { resolveSlug } from "@/lib/blogs";
import type { Locale } from "@/types/content";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

type BlogSummary = {
  _id: string;
  slug?: string;
  slug_i18n?: { vi?: string; en?: string } | string;
  updatedAt?: string;
  publishedAt?: string;
  createdAt?: string;
};

type BlogListResponse = {
  items: BlogSummary[];
  total: number;
  page: number;
  limit: number;
};

function toUrlEntry({ loc, lastmod, changefreq, priority }: SitemapUrl) {
  return (
    "  <url>\n" +
    `    <loc>${xmlEscape(loc)}</loc>\n` +
    `    <lastmod>${xmlEscape(lastmod)}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority.toFixed(1)}</priority>\n` +
    "  </url>"
  );
}

async function fetchAllBlogs(locale: Locale) {
  const apiBase = getApiBaseUrl();
  const limit = 100;
  let page = 1;
  let total = 0;
  const items: BlogSummary[] = [];

  do {
    const url = new URL(`${apiBase}/public/blogs`);
    url.searchParams.set("locale", locale);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort", "-updatedAt");

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) break;
    const data = (await res.json()) as BlogListResponse;
    if (Array.isArray(data.items)) {
      items.push(...data.items);
    }
    total = typeof data.total === "number" ? data.total : items.length;
    page += 1;
  } while (items.length < total);

  return items;
}

function resolveBlogLastmod(blog: BlogSummary) {
  return (
    blog.updatedAt ||
    blog.publishedAt ||
    blog.createdAt ||
    new Date().toISOString()
  );
}

export async function GET() {
  const base = getSiteUrl();

  const now = new Date().toISOString();
  const staticUrls: SitemapUrl[] = [
    {
      loc: `${base}/`,
      lastmod: now,
      changefreq: "weekly",
      priority: 1.0,
    },
    {
      loc: `${base}/en`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.9,
    },
    {
      loc: `${base}/thuc-don`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${base}/en/menu`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${base}/chinhsach-baomat`,
      lastmod: now,
      changefreq: "yearly",
      priority: 0.5,
    },
    {
      loc: `${base}/en/privacy-policy`,
      lastmod: now,
      changefreq: "yearly",
      priority: 0.5,
    },
    {
      loc: `${base}/bai-viet`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.7,
    },
    {
      loc: `${base}/en/blog`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.7,
    },
  ];

  const blogUrls: SitemapUrl[] = [];
  try {
    const [viBlogs, enBlogs] = await Promise.all([
      fetchAllBlogs("vi"),
      fetchAllBlogs("en"),
    ]);

    viBlogs.forEach((blog) => {
      const slug = blog.slug || resolveSlug(blog.slug_i18n, "vi");
      if (!slug) return;
      blogUrls.push({
        loc: `${base}/bai-viet/${slug}`,
        lastmod: resolveBlogLastmod(blog),
        changefreq: "weekly",
        priority: 0.6,
      });
    });

    enBlogs.forEach((blog) => {
      const slug = blog.slug || resolveSlug(blog.slug_i18n, "en");
      if (!slug) return;
      blogUrls.push({
        loc: `${base}/en/blog/${slug}`,
        lastmod: resolveBlogLastmod(blog),
        changefreq: "weekly",
        priority: 0.6,
      });
    });
  } catch {
    // If API is unavailable, fall back to static URLs.
  }

  const urls = [...staticUrls, ...blogUrls].map(toUrlEntry).join("\n");
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
