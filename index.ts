// Reanimated must initialize before anything that uses it (Skia's <Canvas>
// pulls it in). Keep this the very first import.
import 'react-native-reanimated';
// ── Polyfills (MUST be at the very top, before any Solana / crypto imports) ──
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Buffer } from 'buffer';
// @ts-ignore
global.Buffer = global.Buffer || Buffer;

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
