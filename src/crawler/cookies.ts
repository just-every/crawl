import { readFileSync } from 'fs';

export interface CookieEntry {
  domain: string;
  includeSubdomains: boolean;
  path: string;
  secure: boolean;
  expires: number; // seconds since epoch (0 for session)
  name: string;
  value: string;
}

/**
 * Parse a Netscape cookie file (.txt) as documented by curl
 * https://curl.se/docs/http-cookies.html
 */
export function parseNetscapeCookieFile(filePath: string): CookieEntry[] {
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  const cookies: CookieEntry[] = [];
  for (const line of lines) {
    const l = line.trim();
    if (!l || l.startsWith('#')) continue;
    const parts = l.split(/\t/);
    if (parts.length < 7) continue;
    const [domain, includeSubdomainsStr, path, secureStr, expiresStr, name, ...rest] = parts;
    const value = rest.join('\t'); // value may contain tabs
    cookies.push({
      domain,
      includeSubdomains: /true/i.test(includeSubdomainsStr),
      path,
      secure: /true/i.test(secureStr),
      expires: Number(expiresStr) || 0,
      name,
      value,
    });
  }
  return cookies;
}

export function buildCookieHeaderForUrl(urlStr: string, jar: CookieEntry[]): string | undefined {
  let url: URL;
  try { url = new URL(urlStr); } catch { return undefined; }
  const now = Math.floor(Date.now() / 1000);
  const hostname = url.hostname.toLowerCase();
  const isHttps = url.protocol === 'https:';
  const reqPath = url.pathname || '/';

  const matches = jar.filter(c => {
    if (c.expires && c.expires < now) return false; // expired
    if (c.secure && !isHttps) return false; // secure requires https
    // domain match
    const cookieDomain = c.domain.toLowerCase();
    const hostMatch = cookieDomain.startsWith('.')
      ? (hostname === cookieDomain.slice(1) || hostname.endsWith(cookieDomain))
      : (hostname === cookieDomain || (c.includeSubdomains && hostname.endsWith('.' + cookieDomain)));
    if (!hostMatch) return false;
    // path match
    if (!reqPath.startsWith(c.path)) return false;
    return true;
  });

  if (matches.length === 0) return undefined;
  return matches.map(c => `${c.name}=${c.value}`).join('; ');
}

