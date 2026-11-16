/** Only the canonical public host may advertise content to search engines. */
export const INDEXABLE_HOST = "liberture.com"

/** @param {string | null | undefined} host */
export function isIndexableHost(host) {
  return host === INDEXABLE_HOST
}

export const NON_INDEXABLE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
}
