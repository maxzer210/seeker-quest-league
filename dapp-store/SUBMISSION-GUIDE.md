# dApp Store Submission Guide — Seeker Quest League

Step-by-step instructions to publish on the Solana Mobile dApp Store.

> ⏱ Total time first submission: ~1.5-2 hours
> 💰 Cost: ~0.05 SOL (Publisher NFT + Release NFT + tx fees) on mainnet

---

## Phase 0 — Prerequisites checklist

- [x] APK built and tested on real Seeker (`C:\sk\android\app\build\outputs\apk\release\app-release.apk`)
- [x] `config.yaml` filled in (see `dapp-store/config.yaml`)
- [x] Privacy Policy written (see `dapp-store/PRIVACY-POLICY.md`)
- [x] Store descriptions ready (see `dapp-store/STORE-DESCRIPTIONS.md`)
- [ ] 8 screenshots captured (see `dapp-store/SCREENSHOTS-PLAN.md`)
- [ ] Banner, feature graphic, icons prepared
- [ ] Publisher Solana wallet has ≥ 0.1 SOL mainnet
- [ ] Privacy Policy URL is **live** (e.g. `https://seekerquest.league/privacy`)
- [ ] Website domain `seekerquest.league` registered

---

## Phase 1 — One-time setup

### 1.1 Install dApp Store CLI

```powershell
cd C:\sk
npm install --save-dev @solana-mobile/dapp-store-cli
```

### 1.2 Initialize project structure

```powershell
npx dapp-store init
```

This creates the expected folder structure if not already present.

### 1.3 Create publisher keypair (one-time, keep forever)

```powershell
solana-keygen new --outfile dapp-store\publisher.json
```

**CRITICAL:**
- Back up `publisher.json` to multiple secure locations
- Add to `.gitignore` immediately (already added)
- This keypair owns all your future releases. Losing it = losing your dApp Store presence.

Verify address:
```powershell
solana-keygen pubkey dapp-store\publisher.json
```

### 1.4 Fund publisher wallet

Send ~**0.1 SOL** (mainnet) to the publisher address. This covers:
- 0.02 SOL — Publisher NFT mint
- 0.02 SOL — App NFT mint
- 0.02 SOL — first Release NFT mint
- Buffer for tx fees

---

## Phase 2 — Mint Publisher NFT (one-time)

```powershell
npx dapp-store create publisher dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  -u https://api.mainnet-beta.solana.com
```

CLI will:
1. Upload `publisher-icon.png` to permanent storage (Arweave/IPFS via SHDW)
2. Mint a Publisher NFT to your address
3. Print the NFT address — **copy it**

Paste the address into `config.yaml`:
```yaml
publisher:
  address: "<PASTE_HERE>"
```

---

## Phase 3 — Mint App NFT (one-time per app)

```powershell
npx dapp-store create app dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  -u https://api.mainnet-beta.solana.com
```

CLI will:
1. Upload `app-icon.png`
2. Mint App NFT
3. Print address — copy into `config.yaml`:
```yaml
app:
  address: "<PASTE_HERE>"
```

---

## Phase 4 — Mint Release NFT (per release)

This is what you'll repeat for every new version.

### 4.1 Build production APK
We already have it at `C:\sk\android\app\build\outputs\apk\release\app-release.apk`.

Copy to dapp-store media folder:
```powershell
Copy-Item C:\sk\android\app\build\outputs\apk\release\app-release.apk `
          C:\sk\dapp-store\media\app-release.apk
```

### 4.2 Create the release

```powershell
npx dapp-store create release dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  -u https://api.mainnet-beta.solana.com `
  -b "C:\Users\User\AppData\Local\Android\Sdk\build-tools\35.0.0"
```

CLI will:
1. Validate the APK (signing, version, package id)
2. Upload **everything**: APK, screenshots, banner, icons
3. Generate release JSON
4. Mint Release NFT
5. Print address — copy into `config.yaml`:
```yaml
release:
  address: "<PASTE_HERE>"
```

> ⏱ This step takes 5-15 min because of upload sizes.

---

## Phase 5 — Submit for review

```powershell
npx dapp-store publish submit dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  -u https://api.mainnet-beta.solana.com `
  --requestor-is-authorized `
  --complies-with-solana-dapp-store-policies
```

This sends the release to Solana Mobile for review.

You'll receive an email at the publisher email (from `config.yaml`) when:
- Review starts (usually within 24h)
- Approved or rejected with feedback

---

## Phase 6 — Listing live!

Once approved, your app appears in the Solana Mobile dApp Store on every
Seeker phone within 1-24 hours of approval.

Direct URL format (after approval):
```
https://dappstore.solanamobile.com/app/<app-nft-address>
```

---

## Future releases (after first submission)

For version 1.0.1, 1.1.0 etc:

1. Bump `versionCode` in `android/app/build.gradle` (e.g. 1 → 2)
2. Bump `versionName` in same file (e.g. "1.0.0" → "1.0.1")
3. Rebuild APK locally: `cd android && .\gradlew.bat assembleRelease`
4. Copy new APK to `dapp-store/media/app-release.apk`
5. Update `release.catalog.en-US.new_in_version` in `config.yaml`
6. Run **only** Phase 4 + Phase 5 (skip publisher/app — they're already minted)
7. Each release = ~0.02 SOL

---

## Troubleshooting

### "publisher address mismatch"
Make sure the address in `config.yaml` exactly matches the printed NFT address.

### "media upload failed"
Check internet connection. Re-run — uploads are resumable.

### "version code must be > previous"
Increment `android.defaultConfig.versionCode` in `android/app/build.gradle`.

### Reviewer asks for changes
- Read the feedback email carefully
- Make changes locally
- Bump versionCode
- Rebuild + repeat Phase 4 + 5

---

## Useful references

- Official docs: https://docs.solanamobile.com/dapp-publishing/intro
- CLI repo: https://github.com/solana-mobile/dapp-publishing
- Example apps: https://github.com/solana-mobile/dapp-store-publisher
- Policies (must comply): https://docs.solanamobile.com/dapp-publishing/policy
- Pricing & funding: https://docs.solanamobile.com/dapp-publishing/intro#publisher-fees

---

## Cost summary (mainnet)

| Item | Cost | Frequency |
|------|------|-----------|
| Publisher NFT | ~0.02 SOL | One-time |
| App NFT | ~0.02 SOL | Once per app |
| Release NFT | ~0.02 SOL | Per release |
| Storage uploads | included | Per release |
| Review | free | Per submission |

For Seeker Quest League v1.0.0: ~**0.06 SOL** total to be live.
