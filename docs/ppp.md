# Purchasing Power Parity

`app/lib/ppp.ts` maps countries to four discount tiers and exposes `checkPppAccess`. `app/lib/country.server.ts` resolves the viewer's country in three layers: the dev session override, the `CF-IPCountry` header, then an ip-api.com lookup, falling back to `null` (treated as Tier 1).

A student who purchased at a regional discount and later browses from a full-price country is flagged `pppBlocked` by `getAccess`, which removes `canViewContent`. Staff are exempt, and full-price purchases carry no geographic restriction.
