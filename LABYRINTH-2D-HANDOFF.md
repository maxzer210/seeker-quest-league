# Handoff — Abyss Labyrinth 2D + Seeker Quest League (2026-07-13)

Read this first in the new chat. Then read `HANDOFF.md` (older, broader project
context) and the memory note `seeker-quest-prod-state.md`.

---

## The mission (what the user wants)

Seeker Quest League is a **live mainnet** Solana-mobile Web3 game (React Native +
Expo, TypeScript, Supabase). This is emotionally high-stakes for the user ("вопрос
жизни") — they want to **earn money** from it. Current focus:

1. **Make the games genuinely beautiful** — pixel-art, "next level", not geometric
   shapes. Size is NOT a constraint; **visual quality is the #1 priority**.
2. A **SOL shop inside the game** (players spend real SOL on items).
3. **Missions / "game within a game"**, boss fights, progression.

Flagship = **Abyss Labyrinth**, a top-down pixel dungeon crawler.

Be honest, don't over-promise ("flawless"/"we'll earn money" are not guaranteeable).
Show real screenshots at each step; don't work blind.

---

## STATUS: where we are right now

### ✅ DONE and pushed (through commit `3b5941a`)
- **Abyss Labyrinth rewritten from dead 3D to working 2D pixel-art on Skia.**
  Verified rendering + playable on the emulator: hooded seeker sprite, torch light
  + fog of war, walls, combat (HP drops on trap/monster), loot, portal, death/win.
- Two visual polish passes committed (brighter/contrast floor+walls, bigger torch,
  warm firelight, tile grout, wall drop-shadow height, player light aura, dust motes).

### 🟡 IN PROGRESS — needs verification in the new chat
- A **preview APK was just built** (x86_64-only release) at:
  `C:\sk\android\app\build\outputs\apk\release\app-release.apk` (56 MB, v1.1.4 / vc 15).
  It contains visual **batch 2** (`3b5941a`) but **has NOT been installed/screenshotted
  yet**. FIRST TASK: install it, open Games → Abyss Labyrinth → Descend, screenshot,
  and judge the new look. Then keep polishing.

### ⏭️ NEXT (in order)
1. Finish labyrinth visual polish (light readability, monster/loot sprites, maybe a
   Guardian mini-boss every N floors).
2. **SOL shop inside the labyrinth** — torches/armor/potions/skins for SOL, via the
   already-hardened payment path (`paySolToTreasury`, sign-then-broadcast).
3. **Missions** chain + "game in game".

---

## Architecture (labyrinth)
- `lib/labyrinth.ts` — PURE game logic, no React/no Skia. Maze gen, entity spawn,
  all balance constants, `stepSimulation(run, input, dt, events)`, and the FX system
  (particles / floating numbers / screen-shake). Ported verbatim from the AI-Studio
  web prototype (`~/Downloads/seeker-quest-league (2).zip`, whose `TreasureHunt.tsx`
  is secretly a 3D maze).
- `lib/labyrinthSprites.ts` — hand-authored pixel sprites as string-art + palettes
  (SEEKER, SHADE, BRUTE, GEM, GEM_GOLD, BARREL). Easy to edit for better art.
- `components/LabyrinthOfAbyss.tsx` — Skia renderer (`createPicture` + `<Canvas><Picture>`),
  the whole scene drawn imperatively in `drawScene()`, plus the RN overlay HUD
  (HP bar, joystick via PanResponder, STRIKE/DASH buttons, menu/death/victory).
  Game loop = requestAnimationFrame → stepSimulation → setFrame.
- Wired into `App.tsx`: screen `'labyrinth'`, arcade card (first), fullscreen mount,
  back-map, navbar highlight. onEarnOrb uses functional setOrb (barrel blasts grant
  several rewards per frame).

---

## ⚠️ TOOLCHAIN GOTCHAS — do not relearn these the hard way

1. **Debug + Metro hot-reload DOES NOT WORK on this machine.** The dev-client loads a
   stale **embedded** bundle and never hits Metro (0 bundle requests). Do NOT waste
   time on `expo start` / debug builds for iteration. Use **clean release builds**.

2. **Gradle/Metro reuse STALE JS bundles** → your code changes silently don't ship.
   Before every build, delete the cached bundle:
   ```
   find android/app/build -name "index.android.bundle" -delete
   find android/app/build -path "*Bundle*JsAndAssets*" -prune -exec rm -rf {} +
   ```
   (A canary: the arcade card text / any recent string change — if it's stale, the
   bundle is stale.)

3. **Preview builds:** x86_64-only is ~2× faster on the 4-core PC:
   ```
   & C:\sk\android\gradlew.bat -p C:\sk\android assembleRelease -PreactNativeArchitectures=x86_64
   ```
   Do NOT pass `--no-daemon` (cold JVM = slow). Full multi-arch build (needed for the
   user's real Seeker, which is arm64) only when shipping.

4. **Skia needs peers:** `react-native-reanimated@4.1.1` + `react-native-worklets@0.5.1`.
   `import 'react-native-reanimated'` is the FIRST line of `index.ts`. `babel-preset-expo@54`
   auto-adds the worklets plugin (no babel.config.js needed). Without these, the app
   SIGABRTs on launch: "react-native-reanimated is not installed!".

5. **expo-three** hoisted an ancient `expo-file-system@13` and broke all Android builds
   ("Autolinking is not set up" / "Plugin maven not found"). Fixed by pinning
   `expo-file-system@19.0.22` + `expo-asset@12.0.13` as direct deps. Keep them.

6. **Network drops big npm tarballs (ECONNRESET).** For big packages, download the
   tarball via curl with a sha1-verify retry loop into `C:\Users\User\_pkgs`, then
   `npm cache add` it and `npm install` by semver. (Skia tarball is 162 MB.)

7. **Emulator `Medium_Phone_API_36.1` is FLAKY** — goes `offline`, hangs adb. Recovery:
   ```
   Get-Process qemu-system-x86_64 | Stop-Process -Force ; adb kill-server
   & <SDK>\emulator\emulator.exe -avd Medium_Phone_API_36.1 -no-snapshot-save -no-boot-anim
   ```
   Fresh boot shows "System UI isn't responding" — tap Wait. Boot takes ~30-160 s.

8. **Builds are slow (4-core PC).** The heavy native compile (Skia/reanimated C++) is a
   ONE-TIME cost, already done. JS-only rebuilds ≈ 6-8 min. Tell the user honestly:
   nothing is frozen, the CPU is just chewing — it depends on their hardware.

---

## Install / preview loop (reliable)
```
ADB=<SDK>/platform-tools/adb.exe
"$ADB" install -r C:/sk/android/app/build/outputs/apk/release/app-release.apk
"$ADB" shell am start -n com.seekerquest.league/.MainActivity
# skip splash: tap top-right ~ (933,170); navigate by coords on 1080x2400
"$ADB" exec-out screencap -p > /c/sk/_shot.png   # then Read the png
```
App package: `com.seekerquest.league`. adb screencap captures the app fine
(unlike the old expo-gl 3D). Nav: GAMES tab bottom ~(326,2280); Abyss Labyrinth
card is first in arcade; DESCEND button center-lower.

SDK path: `C:\Users\User\AppData\Local\Android\Sdk`.
TS check: `& C:\sk\node_modules\.bin\tsc.cmd -p tsconfig.json --noEmit --skipLibCheck`.

---

## Broader prod state (separate from labyrinth — see seeker-quest-prod-state.md)
Live mainnet fixes already applied/committed earlier: C1 progress-restore, C2 payment
RLS + Founder RPC (applied to live DB), check_spin_rate_limit, recovery-reuse exploit,
C3 on-chain Founder verification Edge Function (Stage 1), and the **CancellationException
→ sign-then-broadcast** payment fix (commit `28b38a6`). Those ship whenever a full
multi-arch APK is published (needs the user's `DAPP_STORE_API_KEY`). Supabase
Management token + anon key handling: see the memory note.

Current shipped store version is behind; the labyrinth + all fixes are on `master`
(github.com/maxzer210/seeker-quest-league) but NOT yet published to the dApp Store.
