/**
 * Canonical public origin. On Vercel SSR, `Astro.url.origin` / `url.origin`
 * is often `https://localhost` because the function is invoked internally.
 * Never emit localhost in production SEO or CSRF checks.
 */

export const PRODUCTION_SITE_URL = 'https://mi-portal-de-empleo.vercel.app';

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function hostOnly(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '').split('/')[0] || '';
}

function isLocalHost(host: string): boolean {
  const h = host.split(':')[0]!.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
}

function fromEnv(): string {
  const pub = (import.meta.env.PUBLIC_SITE_URL as string | undefined)?.trim();
  if (pub) return stripTrailingSlash(pub);

  const vercelProd = (
    import.meta.env.VERCEL_PROJECT_PRODUCTION_URL as string | undefined
  )?.trim();
  if (vercelProd) {
    const host = hostOnly(vercelProd);
    if (host && !isLocalHost(host)) return `https://${host}`;
  }
  return '';
}

/**
 * Public site origin for canonical, og:url, robots, sitemap, CSRF allowlist.
 * Prefer env; then forwarded host; then request URL if it is not localhost;
 * then the production default. In local dev, localhost is allowed.
 */
export function resolvePublicOrigin(opts?: {
  requestUrl?: URL | string;
  request?: Request;
}): string {
  const env = fromEnv();
  if (env && !isLocalHost(hostOnly(env))) return env;

  const forwardedHost =
    opts?.request?.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    opts?.request?.headers.get('host')?.split(',')[0]?.trim() ||
    '';
  if (forwardedHost && !isLocalHost(forwardedHost)) {
    const proto =
      opts?.request?.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
      'https';
    return `${proto}://${hostOnly(forwardedHost)}`;
  }

  if (opts?.requestUrl) {
    const url =
      typeof opts.requestUrl === 'string' ? new URL(opts.requestUrl) : opts.requestUrl;
    if (!isLocalHost(url.hostname)) return url.origin;
  }

  const vercelEnv = import.meta.env.VERCEL_ENV as string | undefined;
  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined;
  const isProdLike = vercelEnv === 'production' || nodeEnv === 'production';
  if (isProdLike) return PRODUCTION_SITE_URL;

  if (opts?.requestUrl) {
    const url =
      typeof opts.requestUrl === 'string' ? new URL(opts.requestUrl) : opts.requestUrl;
    return url.origin;
  }

  if (env) return env;
  return PRODUCTION_SITE_URL;
}

export function isAllowedPostOrigin(origin: string, request?: Request): boolean {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (isLocalHost(parsed.hostname)) return true;

  const allowed = new Set<string>();
  allowed.add(resolvePublicOrigin({ request }));
  allowed.add(PRODUCTION_SITE_URL);

  const vercelUrl = (import.meta.env.VERCEL_URL as string | undefined)?.trim();
  if (vercelUrl) allowed.add(`https://${hostOnly(vercelUrl)}`);

  const forwarded =
    request?.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request?.headers.get('host')?.split(',')[0]?.trim();
  if (forwarded && !isLocalHost(forwarded)) {
    const proto =
      request?.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
    allowed.add(`${proto}://${hostOnly(forwarded)}`);
  }

  return allowed.has(parsed.origin);
}
