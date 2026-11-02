const EXTERNAL_LINK_PROTOCOLS = new Set(['http:', 'https:'])

function parseUrl(url: string): URL | null {
  return URL.canParse(url) ? new URL(url) : null
}

// URL.origin is 'null' for custom schemes, so it can't be compared here.
function originOf(url: URL): string {
  return `${url.protocol}//${url.host}`
}

export function isExternalLinkAllowed(url: string): boolean {
  const parsedUrl = parseUrl(url)
  return parsedUrl !== null && EXTERNAL_LINK_PROTOCOLS.has(parsedUrl.protocol)
}

export function isSameOrigin(url: string, expectedUrl: string): boolean {
  const parsedUrl = parseUrl(url)
  const parsedExpectedUrl = parseUrl(expectedUrl)
  return (
    parsedUrl !== null &&
    parsedExpectedUrl !== null &&
    originOf(parsedUrl) === originOf(parsedExpectedUrl)
  )
}
