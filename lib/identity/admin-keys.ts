const DEFAULT_ADMIN_PUBKEYS = [
  "d9590d95a7811e1cb312be66edd664d7e3e6ed57822ad9f213ed620fc6748be8",
  "419b7df0b0701bc75c7a105722549dd16220c41f51e79d92b7697d6e7124181a",
]

export function adminPubkeys(): string[] {
  const extra = (process.env.ADMIN_NOSTR_PUBKEYS ?? "")
    .split(",")
    .map((key) => key.trim().toLowerCase())
    .filter(Boolean)
  return [...DEFAULT_ADMIN_PUBKEYS, ...extra]
}

