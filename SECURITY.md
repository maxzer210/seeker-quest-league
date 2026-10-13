# Security Policy

## Supported code

Security fixes are applied to the current default branch. Release APKs are
produced from reviewed commits and uploaded through the authenticated Solana
Mobile Publisher Portal.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. Do
not open a public issue containing credentials, private keys, wallet seed
phrases, personal data, or exploit details.

## Secrets and signing material

Secrets are never required in source control. Supabase service credentials are
read from environment variables. Mint authorities, distribution wallets,
publisher keypairs, signing keystores, and local environment files are excluded
by `.gitignore` and must remain on the operator's machine.

Public Solana addresses, mint addresses, transaction signatures, and on-chain
balances are public identifiers rather than secret key material. Admin scripts
must never log private key bytes, seed phrases, service-role keys, or complete
credential-bearing configuration objects.

## Dependency boundaries

The Android runtime and local publishing or administration tools have separate
security boundaries. An advisory in a build-time package is still tracked, but
it is not automatically reachable from the APK. Runtime impact is assessed
from the production bundle and the code path that processes untrusted input.

The app currently uses the maintained `1.98.x` line of `@solana/web3.js` because
the Solana Mobile wallet adapter, Seeker SDK, and SPL Token packages expose the
Web3 v1 API. Migration to the newer Solana Kit API will be coordinated with
those integrations rather than performed as an unsafe partial replacement.
