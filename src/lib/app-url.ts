/**
 * Resolves the public app origin for metadata, sitemaps, QR codes and cookies.
 *
 * Vercel often leaves NEXT_PUBLIC_APP_URL unset (or blank) during the first
 * deploy, so we fall back to VERCEL_URL before defaulting to localhost.
 */
function normalizeOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function getAppUrl(): string {
  const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (fromEnv) return fromEnv;

  const vercel = normalizeOrigin(process.env.VERCEL_URL);
  if (vercel) {
    return vercel.startsWith("http://") || vercel.startsWith("https://")
      ? vercel
      : `https://${vercel}`;
  }

  return "http://localhost:3000";
}
