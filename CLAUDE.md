# CLAUDE.md

Fork of `snapshot-labs/snapshot-sequencer`, the write path of a self-hosted Snapshot
deployment for a shareholder voting product on Robinhood Chain (RHC, chain id 4663).
It accepts EIP-712-signed votes and proposals and writes them to MySQL. Deploys to
Railway from GitHub.

## HARD RULES, NON-NEGOTIABLE

- The user never runs anything on their machine. Never output a command for them to
  run locally. No npm, no git clone, no CLI, no scripts, no downloads. Their machine
  holds wallets. Zero risk.
- All work happens in the cloud session and in Railway. Deploys are
  Railway-from-GitHub only.
- Never ask for, log, or handle private keys or seed phrases. `RELAYER_PK` is a
  Railway environment variable — refer to it by name, never request or print its
  value.
- Before anything that involves a wallet, funds, secrets, a paid API, or an external
  account, stop and ask. List exactly what you need, why, and where the user enters
  it (Railway UI, Remix, GitHub UI). Do not proceed until answered.

## One space per whitelisted ticker

Space ids are lowercase ticker symbols — `nvda`, `aapl`. No other space may exist.

Space control is `SPACE_ALLOWLIST`, comma-separated `space:address` pairs, read by
`parseSpaceAllowlist()` in `src/helpers/utils.ts`. It replaces the upstream ENS
controller lookup, which cannot resolve on RHC — there is no ENS deployment there.

It fails closed: an unset or empty `SPACE_ALLOWLIST` rejects every space write.
`src/writer/settings.ts` rejects any space outside the allowlist before the admin
check, so an address already recorded as an admin cannot keep editing a space that
has been de-listed. Any feature that would create a space outside the allowlist is
out of scope.

## Environment

| Name | Notes |
| --- | --- |
| `PORT` | 3001 |
| `NETWORK` | `mainnet` |
| `HUB_DATABASE_URL` | MySQL, database `snapshot_hub` |
| `SEQ_DATABASE_URL` | MySQL, database `snapshot_sequencer` |
| `DEFAULT_NETWORK` | `4663` |
| `SCORE_API_URL` | score-api public URL |
| `BROVIDER_URL` | optional; the default `https://rpc.snapshot.org` already serves 4663 with archive state |
| `RELAYER_PK` | secret, Railway only |
| `SPACE_ALLOWLIST` | e.g. `nvda:0xabc…,aapl:0xdef…` |

`@snapshot-labs/snapshot.js` is pinned to `^0.17.2`. That is the first published
version whose `networks.json` carries RHC 4663 — 0.17.1 and earlier will reject a
space with `network not allowed`.

## Schema

Nothing migrates on boot. `src/helpers/mysql.ts` only opens a pool and
`src/index.ts` never runs a migration, so `src/helpers/schema.sql` is loaded by hand
into the `snapshot_sequencer` database through Railway's query console. Same for the
hub's own schema into `snapshot_hub`.

## Reporting

After each task: what you did, what's blocked, what you need from the user, in that
order. Short.
