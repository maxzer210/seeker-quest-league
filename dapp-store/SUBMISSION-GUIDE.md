# Solana Mobile Publisher Portal Guide

Seeker Quest League releases are prepared locally and uploaded through the
authenticated [Solana Mobile Publisher Portal](https://portal.solanamobile.com).
The legacy dApp Store CLI is intentionally not installed in this repository.

## Prepare a release

1. Build a signed release APK and test the exact artifact on a real Seeker.
2. Copy the tested file to `dapp-store/media/app-release.apk`.
3. Write the player-facing change summary in `dapp-store/release-notes.txt`.
4. Set `ANDROID_HOME` or `ANDROID_SDK_ROOT`, then run:

```powershell
node dapp-store/publish.js
```

The validator rejects a missing, tiny, malformed, unsigned, or incorrectly
packaged APK. `READY` means the APK signature and package id
`com.seekerquest.league` were verified and the release notes are present.
It does not submit or upload anything.

## Upload and submit

1. Open `https://portal.solanamobile.com` with the publisher account.
2. Open Seeker Quest League and create a new release.
3. Upload `dapp-store/media/app-release.apk`.
4. Paste the contents of `dapp-store/release-notes.txt` into What's New.
5. Review the listing, screenshots, version code, and package id.
6. Submit through the portal and save the resulting release id/status in the
   private release record.

No private key, seed phrase, signing keystore, or portal credential belongs in
Git, command output, screenshots, or issue reports.

## Future releases

For every update, bump the Android version code and user-facing version, build
and test a fresh signed APK, update `dapp-store/release-notes.txt`, rerun the
validator, and upload through the Publisher Portal.

## Troubleshooting

- `ANDROID_HOME or ANDROID_SDK_ROOT is not set`: point one of them at the local
  Android SDK installation.
- `APK signature verification failed`: rebuild with the release signing config;
  do not upload the artifact.
- `unexpected package`: verify that the release uses
  `com.seekerquest.league`.
- Portal upload failure: keep the same validated APK and retry in the portal;
  do not rebuild unless the artifact itself changes.
