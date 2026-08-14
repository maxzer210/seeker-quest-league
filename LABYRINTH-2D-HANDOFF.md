# Handoff вЂ” Abyss Labyrinth 2D + Seeker Quest League (updated 2026-07-27)

Read this first in the new chat. Then read `HANDOFF.md` (older, broader project
context) and the memory note `seeker-quest-prod-state.md`.

---

## вљЎ 2026-07-27 UPDATE вЂ” CURRENT STATE (supersedes the sections below)

Everything below in this file is historical context. Current truth:

### Committed to master (all verified except the last one):
- `040909d` batch-3b light & atmosphere (teal-&-orange grade, wall sconces, AO,
  runic traps). Verified on emulator.
- `af46480` bigger art + Guardian boss + punchy combat + procedural animation
  (squash/stretch walk, breathing, blink, pounce; 3 shade variants; boss HP bar).
  Verified on emulator AND on the user's real phone.
- `881c3c7` cinematic menu screen (animated Skia backdrop: seeker at the brink of
  a glowing abyss portal + premium UI). Verified on emulator AND real phone.
  GOTCHA: Skia `<Canvas>` needs explicit `{width,height}` вЂ” absoluteFill = black.
- **`<pending>` Seeker's Camp (shop + meta-progression)** вЂ” committed in this
  session, see below. **NOT yet visually verified** (emulator kept wedging);
  TS-clean, built into the APK. FIRST TASK IN NEW CHAT: verify the camp on
  emulator or the user's phone.

### Seeker's Camp (built by a delegated design agent, integrated by main session)
- 5 permanent ORB upgrades, 5 levels each (tables in `LABYRINTH-SHOP-DESIGN.md`,
  in Russian): рџ”¦ Abyss Torch (light 5.6в†’8.1 cells), рџ‘ў Swift Greaves (speed
  12в†’17), вќ¤пёЏвЂЌрџ”Ґ Abyssal Vigor (HP 100в†’200), вљ”пёЏ Runeblade (dmg 50в†’100),
  рџ•ЇпёЏ Second Torch (survive 1 lethal hit/run, revive 1в†’75 HP). Total ~255k ORB.
- `lib/labyrinth.ts`: `LabyrinthUpgrades` type + level tables; `createRun(upgrades?)`
  optional param (zero-default = old behavior); RunState carries effective
  maxHp/moveSpeed/attackDmg/torchCells/emberCharges; Second Torch in death check.
- `components/LabyrinthOfAbyss.tsx`: "в›є SEEKER'S CAMP" button under DESCEND в†’
  camp overlay over the live menu backdrop (upgrade cards, level pips, NOWв†’NEXT,
  buy pulse); persistence `sk_labyrinth_upgrades_v1`; Abyss Lantern SOL card
  (0.05 SOL, purpose `labyrinth_abyss_lantern`) вЂ” recolors torch to spectral cyan.
- `App.tsx`: wired `orb` / `onSpendOrb` / `onPaySol` (same pattern as SpaceRunner);
  `lib/solanaMobile.ts`: added `'labyrinth_abyss_lantern'` to `SolPurpose` union
  (purpose only lands in the free-text `status` column вЂ” no DB constraint).
- Anti-cheat follow-ups (deliberately deferred): sync camp levels to Supabase;
  record lantern purchase server-side like other SOL items.

### Phone install
Full multi-arch APK (with camp): `android/app/build/outputs/apk/release/app-release.apk`
(~138 MB, arm64 phone + x86_64 emulator). User sideloads to their real phone вЂ”
this WORKS and is how the last two batches were actually judged.

### Delegation workflow (user likes it вЂ” keep using it)
User was frustrated by slow visible progress (cause: 6-8 min builds + emulator
ANR chaos, not the code work). Agreed fix: **delegate big design/code batches to
a subagent** (it must NOT run builds/emulator; verify only with tsc), then the
main session integrates, builds ONCE, verifies. First use (the camp) worked great:
~400 lines + design doc, TS-clean first try. Next candidates for delegated
batches: missions/"game in game", full-screen relic-reveal + death/exit screens,
multi-floor descent + more Guardian variants, real PNG art pipeline.

### Emulator survival notes (this machine)
- BUILD FIRST (kill qemu), boot emulator AFTER on idle CPU; else SystemUI ANR hell.
- Fresh boot: dismiss ANR (`Wait` at ~322,1332), SKIP splash (933,170), close
  Daily-Streak popup (948,642), GAMES tab (326,2280), Labyrinth card (540,654),
  CAMP button sits under DESCEND on the menu.
- adb can hang entirely в†’ `Stop-Process qemu-system-x86_64 -Force; adb kill-server`.
- `settings put global anr_show_background 0` helps a little.

---

---

## The mission (what the user wants)

Seeker Quest League is a **live mainnet** Solana-mobile Web3 game (React Native +
Expo, TypeScript, Supabase). This is emotionally high-stakes for the user ("РІРѕРїСЂРѕСЃ
Р¶РёР·РЅРё") вЂ” they want to **earn money** from it. Current focus:

1. **Make the games genuinely beautiful** вЂ” pixel-art, "next level", not geometric
   shapes. Size is NOT a constraint; **visual quality is the #1 priority**.
2. A **SOL shop inside the game** (players spend real SOL on items).
3. **Missions / "game within a game"**, boss fights, progression.

Flagship = **Abyss Labyrinth**, a top-down pixel dungeon crawler.

Be honest, don't over-promise ("flawless"/"we'll earn money" are not guaranteeable).
Show real screenshots at each step; don't work blind.

---

## STATUS: where we are right now

### вњ… DONE and pushed (through commit `3b5941a`)
- **Abyss Labyrinth rewritten from dead 3D to working 2D pixel-art on Skia.**
  Verified rendering + playable on the emulator: hooded seeker sprite, torch light
  + fog of war, walls, combat (HP drops on trap/monster), loot, portal, death/win.
- Two visual polish passes committed (brighter/contrast floor+walls, bigger torch,
  warm firelight, tile grout, wall drop-shadow height, player light aura, dust motes).

### вњ… DONE вЂ” visual batch 3b "light & atmosphere" (2026-07-13, verified on emulator)
Cinematic lighting grade landed and screenshotted. All changes are in
`components/LabyrinthOfAbyss.tsx` `drawScene` only вЂ” PURE VISUAL, no logic/balance
change (sconces are derived deterministically from the grid at render time). TS clean.
- **Teal-&-orange grade:** warm gold torch pool at the seeker вџ· cool blue-teal
  additive fill lifts the mid-field shadows; fog fades to a deep cool-blue then black.
- **Wall sconces:** ~1-in-5 walls that have open floor below get a flickering torch
  (bracket + flame + warm additive light pool). Secondary light sources = big atmosphere.
- **Stone floor:** ambient-occlusion contact shadows on wall-adjacent edges, light
  chips, faint corner moss.
- **Runic traps:** pulsing sigil = circle + two counter-rotating triangles + bloom
  (replaced the plain red crosshair).
- **Loot bloom** + rising sparkles; **warm embers** rising from the seeker's torch.
- **batch-3b tuning (important):** the first pass (3-layer warm + hot core, all
  additive drawn last) BLEW OUT the hero to white. Fixed by making the warm/core
  gradient inner stops transparent at the centre and cutting alphas (warm 0.42,
  halo 0.32) so the sprite stays crisp inside the glow. If you touch the light,
  keep the centre additive low or the player washes out again.
Result: hero clearly lit + readable, warm/cool contrast, sconces punctuate the dark.
Preview APK rebuilt (56 MB x86_64, v1.1.4/vc15) at `android/app/build/outputs/apk/release/app-release.apk`.
NOT yet committed to git вЂ” working-tree change, awaiting user go-ahead.

### вЏ­пёЏ NEXT (in order)
1. (optional) further atmosphere micro-polish; monster/loot sprite art pass; the
   Labyrinth **menu screen is still bare** (emoji hole) вЂ” weak first impression.
2. **SOL shop inside the labyrinth** вЂ” torches/armor/potions/skins for SOL, via the
   already-hardened payment path (`paySolToTreasury`, sign-then-broadcast).
3. **Missions** chain + "game in game"; multi-floor + Guardian mini-boss.

### вљ пёЏ EMULATOR NOTE (this session)
`Medium_Phone_API_36.1` throws a recurring "System UI isn't responding" ANR on fresh
boot, and it gets MUCH worse if the emulator boots while a Gradle build is running
(CPU starvation on the 4-core PC). Lesson: **build FIRST, boot the emulator AFTER**
on an idle CPU, then it settles and stops ANR-ing. `adb root`/killing systemui is
blocked (production build). Between ANR pop-ups you can still descend + screenshot;
the game view is drawn by the app process, not SystemUI. `settings put global
anr_show_background 0` helps a little.

---

## Architecture (labyrinth)
- `lib/labyrinth.ts` вЂ” PURE game logic, no React/no Skia. Maze gen, entity spawn,
  all balance constants, `stepSimulation(run, input, dt, events)`, and the FX system
  (particles / floating numbers / screen-shake). Ported verbatim from the AI-Studio
  web prototype (`~/Downloads/seeker-quest-league (2).zip`, whose `TreasureHunt.tsx`
  is secretly a 3D maze).
- `lib/labyrinthSprites.ts` вЂ” hand-authored pixel sprites as string-art + palettes
  (SEEKER, SHADE, BRUTE, GEM, GEM_GOLD, BARREL). Easy to edit for better art.
- `components/LabyrinthOfAbyss.tsx` вЂ” Skia renderer (`createPicture` + `<Canvas><Picture>`),
  the whole scene drawn imperatively in `drawScene()`, plus the RN overlay HUD
  (HP bar, joystick via PanResponder, STRIKE/DASH buttons, menu/death/victory).
  Game loop = requestAnimationFrame в†’ stepSimulation в†’ setFrame.
- Wired into `App.tsx`: screen `'labyrinth'`, arcade card (first), fullscreen mount,
  back-map, navbar highlight. onEarnOrb uses functional setOrb (barrel blasts grant
  several rewards per frame).

---

## вљ пёЏ TOOLCHAIN GOTCHAS вЂ” do not relearn these the hard way

1. **Debug + Metro hot-reload DOES NOT WORK on this machine.** The dev-client loads a
   stale **embedded** bundle and never hits Metro (0 bundle requests). Do NOT waste
   time on `expo start` / debug builds for iteration. Use **clean release builds**.

2. **Gradle/Metro reuse STALE JS bundles** в†’ your code changes silently don't ship.
   Before every build, delete the cached bundle:
   ```
   find android/app/build -name "index.android.bundle" -delete
   find android/app/build -path "*Bundle*JsAndAssets*" -prune -exec rm -rf {} +
   ```
   (A canary: the arcade card text / any recent string change вЂ” if it's stale, the
   bundle is stale.)

3. **Preview builds:** x86_64-only is ~2Г— faster on the 4-core PC:
   ```
   & D:\sk\android\gradlew.bat -p D:\sk\android assembleRelease -PreactNativeArchitectures=x86_64
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

7. **Emulator `Medium_Phone_API_36.1` is FLAKY** вЂ” goes `offline`, hangs adb. Recovery:
   ```
   Get-Process qemu-system-x86_64 | Stop-Process -Force ; adb kill-server
   & <SDK>\emulator\emulator.exe -avd Medium_Phone_API_36.1 -no-snapshot-save -no-boot-anim
   ```
   Fresh boot shows "System UI isn't responding" вЂ” tap Wait. Boot takes ~30-160 s.

8. **Builds are slow (4-core PC).** The heavy native compile (Skia/reanimated C++) is a
   ONE-TIME cost, already done. JS-only rebuilds в‰€ 6-8 min. Tell the user honestly:
   nothing is frozen, the CPU is just chewing вЂ” it depends on their hardware.

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
TS check: `& D:\sk\node_modules\.bin\tsc.cmd -p tsconfig.json --noEmit --skipLibCheck`.

---

## Broader prod state (separate from labyrinth вЂ” see seeker-quest-prod-state.md)
Live mainnet fixes already applied/committed earlier: C1 progress-restore, C2 payment
RLS + Founder RPC (applied to live DB), check_spin_rate_limit, recovery-reuse exploit,
C3 on-chain Founder verification Edge Function (Stage 1), and the **CancellationException
в†’ sign-then-broadcast** payment fix (commit `28b38a6`). Those ship whenever a full
multi-arch APK is published (needs the user's `DAPP_STORE_API_KEY`). Supabase
Management token + anon key handling: see the memory note.

Current shipped store version is behind; the labyrinth + all fixes are on `master`
(github.com/maxzer210/seeker-quest-league) but NOT yet published to the dApp Store.
