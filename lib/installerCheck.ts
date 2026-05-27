/**
 * Installer-based Seeker detection.
 *
 * Idea: if the app was installed from the Solana Mobile dApp Store,
 * the user is guaranteed to own a Seeker phone — the dApp Store ships
 * only on Seeker. So we can short-circuit the on-chain SGT check
 * and grant Seeker-level perks immediately.
 *
 * Sources:
 *   "com.solanamobile.dappstore"      ← Solana dApp Store (canonical)
 *   "com.solanamobile.seedvaultimpl"  ← seen on some Seeker firmwares
 *   "com.android.vending"             ← Google Play (NOT Seeker-exclusive)
 *   "com.amazon.venezia"              ← Amazon Appstore
 *   null / undefined                   ← sideloaded (adb, file manager, telegram, etc.)
 */
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

const SOLANA_INSTALLER_PACKAGES = new Set([
  'com.solanamobile.dappstore',
  'com.solanamobile.dappPublishing',
  'com.solanamobile.seedvaultimpl',
]);

export type InstallerInfo = {
  installerPackage: string | null;
  isFromSolanaSource: boolean;
  isSideloaded: boolean;
};

/**
 * Get the installer source.
 * Always returns a value (never throws). On iOS or non-Android returns sideloaded.
 */
export async function detectInstallerSource(): Promise<InstallerInfo> {
  if (Platform.OS !== 'android') {
    return { installerPackage: null, isFromSolanaSource: false, isSideloaded: true };
  }
  try {
    const installer = (await DeviceInfo.getInstallerPackageName()) ?? null;
    const isEmpty = !installer || installer === 'unknown';
    return {
      installerPackage:   isEmpty ? null : installer,
      isFromSolanaSource: !!installer && SOLANA_INSTALLER_PACKAGES.has(installer),
      isSideloaded:       isEmpty,
    };
  } catch {
    return { installerPackage: null, isFromSolanaSource: false, isSideloaded: true };
  }
}
