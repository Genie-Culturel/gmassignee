/** Drop `demo=1` from search and hash query so a reload can actually leave demo mode. */
export function stripDemoQuery(href: string): string {
  const url = new URL(href);
  url.searchParams.delete('demo');
  const hash = url.hash;
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const hashPath = hash.slice(0, qIndex);
    const hashQuery = new URLSearchParams(hash.slice(qIndex + 1));
    hashQuery.delete('demo');
    const qs = hashQuery.toString();
    url.hash = qs ? `${hashPath}?${qs}` : hashPath;
  }
  return url.toString();
}
