# Nostr WoT Cashu mint

The public origin is https://mint.nostrwot.com. Cloudflare forwards to nginx. Only the listed Cashu methods reach NutMix on loopback port 3348. The systemd unit permits loopback network access and Unix sockets. NutMix uses a dedicated PostgreSQL role and a dedicated LNbits wallet accessed through the Nostr WoT proxy on port 3003.

Build NutMix tag v0.7.0, commit 7a2329480b7119d5c2e9e16936462a6e7886e91c, with the checked-in patch and its upstream protobuf, templ and web asset generation steps. The patch binds loopback and serializes payments to the proxy’s existing allowlist. The LNbits backend is deprecated upstream. Verify a supported proxy-compatible adapter before upgrading. Keep the previous binary for rollback.

Run provision.cjs as root using the installed proxy dependencies. It provisions the dedicated wallet with a persistent service identity. It writes secrets to /etc/nostrwot-mint. Never regenerate the mint seed or replace this directory on upgrade. Install its config.toml for the first boot in /var/lib/nostrwotmint/nutmix/config.toml. After bootstrap the configuration lives in PostgreSQL. The wallet starts with zero balance. It receives reserves from paid invoices. Operators are responsible for liquidity and redemption.

The live mint caps each mint quote at 10,000 sats and each melt quote at 20,000 sats. nginx also limits request size, simultaneous connections, writes and request rates. Its allowlist excludes admin and wallet-management APIs. The per-payment limits do not impose a cumulative liability ceiling.

Check /v1/info and /v1/keysets plus an unpaid mainnet invoice after upgrades. Leave previous challenges pinned to their recorded mint. Users must preserve the browser signing key and wallet data to recover a paid quote.

The daily nostrwot-mint-backup timer archives the database and /etc/nostrwot-mint together. Archives are encrypted for the operator’s recovery certificate before upload under backups/nostrwot-mint/ in the private liberture bucket. The private recovery key belongs off-server. Take another backup before changes. To restore, decrypt the archive with openssl cms -decrypt -binary -inform DER and the recovery key. Restore PostgreSQL in an isolated database, check keysets and proof state, then restore the matching protected configuration. Never start a second live signer from a stale snapshot. Reconcile spends since the backup before reopening redemption.
