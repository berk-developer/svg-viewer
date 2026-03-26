function normalizeUrl(rawUrl?: string): string | null {
  if (!rawUrl) {
    return null;
  }

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  return `https://${rawUrl}`;
}

export const siteUrl =
  normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
  normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
  normalizeUrl(process.env.VERCEL_URL) ??
  "http://localhost:3000";

