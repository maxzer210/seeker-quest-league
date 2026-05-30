// ─────────────────────────────────────────────────────────────────────────
// App version stamp — обновляется перед каждой сборкой APK
// Видимая в Home + Settings.
// ─────────────────────────────────────────────────────────────────────────

export const APP_VERSION = '1.0.0';
export const BUILD_TIME  = '2026-05-30 17:30';
export const BUILD_CODE  = 'mainnet-launch';

/** Compact label for UI: "v0.6.0 · 21:30" */
export const VERSION_LABEL = `v${APP_VERSION} · ${BUILD_TIME.split(' ')[1] ?? ''}`;

/** Full label for Settings: "v0.6.0 · 2026-05-26 21:30 · compact-home-clean" */
export const VERSION_FULL  = `v${APP_VERSION} · ${BUILD_TIME} · ${BUILD_CODE}`;
