// ─────────────────────────────────────────────────────────────────────────
// App version stamp — обновляется перед каждой сборкой APK
// Видимая в Home + Settings.
// ─────────────────────────────────────────────────────────────────────────

export const APP_VERSION = '1.1.2';
export const BUILD_TIME  = '2026-07-04 17:27';
export const BUILD_CODE  = 'c3-founder-onchain-verify';

/** Compact label for UI: "v1.0.0" */
export const VERSION_LABEL = `v${APP_VERSION}`;

/** Full label for Settings: "v0.6.0 · 2026-05-26 21:30 · compact-home-clean" */
export const VERSION_FULL  = `v${APP_VERSION} · ${BUILD_TIME} · ${BUILD_CODE}`;
