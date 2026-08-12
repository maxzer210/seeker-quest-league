# Р РµРІСЊСЋ РјРёРЅРё-РёРіСЂС‹ В«Р›Р°Р±РёСЂРёРЅС‚ Р‘РµР·РґРЅС‹В» (Abyss Labyrinth)

> **РћС‚РІРµС‡Р°Р№ РїРѕ-СЂСѓСЃСЃРєРё.** РўС‹ вЂ” senior game designer + С‚РµС…РЅРёС‡РµСЃРєРёР№ РґРёСЂРµРєС‚РѕСЂ РјРѕР±РёР»СЊРЅС‹С…
> free-to-play РёРіСЂ. РќРёР¶Рµ вЂ” РїРѕР»РЅС‹Р№ РёСЃС…РѕРґРЅС‹Р№ РєРѕРґ РѕРґРЅРѕР№ РјРёРЅРё-РёРіСЂС‹ Рё РєРѕРЅС‚РµРєСЃС‚.
> РњРЅРµ РЅСѓР¶РµРЅ Р¶С‘СЃС‚РєРёР№, С‡РµСЃС‚РЅС‹Р№ СЂР°Р·Р±РѕСЂ: **РјРµС…Р°РЅРёРєР° Рё РґРёР·Р°Р№РЅ РјРЅРµ РЅРµ РЅСЂР°РІСЏС‚СЃСЏ**, С…РѕС‡Сѓ
> РїРѕРЅСЏС‚СЊ С‡С‚Рѕ РёРјРµРЅРЅРѕ РЅРµ С‚Р°Рє Рё РєР°Рє СЌС‚Рѕ С‡РёРЅРёС‚СЊ.

---

## Р§С‚Рѕ СЌС‚Рѕ Р·Р° РёРіСЂР°

**В«Р›Р°Р±РёСЂРёРЅС‚ Р‘РµР·РґРЅС‹В»** вЂ” С„Р»Р°РіРјР°РЅСЃРєР°СЏ РјРёРЅРё-РёРіСЂР° РІРЅСѓС‚СЂРё РјРѕР±РёР»СЊРЅРѕРіРѕ Web3-РїСЂРёР»РѕР¶РµРЅРёСЏ
**Seeker Quest League** (Solana Mobile, Р¶РёРІРѕР№ mainnet, ~82 СЂРµР°Р»СЊРЅС‹С… РёРіСЂРѕРєР°).
Р–Р°РЅСЂ: **top-down 2D pixel-art СЂРѕРіР°Р»РёРє-РґР°РЅР¶РµРЅ-РєСЂРѕСѓР»РµСЂ**.

РРіСЂР° СѓР¶Рµ СЂР°Р±РѕС‚Р°РµС‚ Рё РёРіСЂР°РµС‚СЃСЏ РЅР° СЂРµР°Р»СЊРЅРѕРј С‚РµР»РµС„РѕРЅРµ. Р—Р°РґР°С‡Р° РЅРµ В«РїРµСЂРµРїРёСЃР°С‚СЊ СЃ РЅСѓР»СЏВ»,
Р° РїРѕРЅСЏС‚СЊ **РєР°Рє СЃРґРµР»Р°С‚СЊ РµС‘ РёРЅС‚РµСЂРµСЃРЅРѕР№ Рё РєСЂР°СЃРёРІРѕР№** РІ С‚РµРєСѓС‰РёС… С‚РµС…РЅРёС‡РµСЃРєРёС… СЂР°РјРєР°С….

## РўРµС…РЅРёС‡РµСЃРєРёР№ СЃС‚РµРє Рё Р–РЃРЎРўРљРР• РѕРіСЂР°РЅРёС‡РµРЅРёСЏ

- **React Native + Expo SDK 54, TypeScript strict.** РќРёРєР°РєРѕРіРѕ РёРіСЂРѕРІРѕРіРѕ РґРІРёР¶РєР°
  (РЅРµС‚ Unity/Godot/Phaser). РќРµ РїСЂРµРґР»Р°РіР°Р№ РёС… вЂ” СЌС‚Рѕ РЅРµ РІР°СЂРёР°РЅС‚.
- Р РµРЅРґРµСЂ вЂ” **@shopify/react-native-skia**: РІСЃСЏ СЃС†РµРЅР° СЂРёСЃСѓРµС‚СЃСЏ РёРјРїРµСЂР°С‚РёРІРЅРѕ
  РІ РѕРґРёРЅ `createPicture` РєР°Р¶РґС‹Р№ РєР°РґСЂ (`drawScene`), РїРѕРІРµСЂС… вЂ” РѕР±С‹С‡РЅС‹Р№ RN-РѕРІРµСЂР»РµР№
  РґР»СЏ HUD/РјРµРЅСЋ.
- РРіСЂРѕРІРѕР№ С†РёРєР» вЂ” `requestAnimationFrame` в†’ `stepSimulation(run, input, dt, events)`.
  Р’СЃСЏ Р»РѕРіРёРєР° С‡РёСЃС‚Р°СЏ, Р±РµР· React, РІ `lib/labyrinth.ts`.
- РЎРїСЂР°Р№С‚С‹ вЂ” **string-art**: РјР°СЃСЃРёРІ СЃС‚СЂРѕРє СЃРёРјРІРѕР»РѕРІ + РїР°Р»РёС‚СЂР°, РєР°Р¶РґС‹Р№ РїРёРєСЃРµР»СЊ
  СЂРёСЃСѓРµС‚СЃСЏ РєР°Рє `drawRect`. РќРµС‚ PNG-Р°СЃСЃРµС‚РѕРІ (РїРѕРєР°).
- Р¦РµР»РµРІРѕРµ Р¶РµР»РµР·Рѕ вЂ” РѕР±С‹С‡РЅС‹Рµ Android-С‚РµР»РµС„РѕРЅС‹, **РЅСѓР¶РЅРѕ РґРµСЂР¶Р°С‚СЊ 60 fps**.
- РќРѕРІС‹Рµ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё РєСЂР°Р№РЅРµ РЅРµР¶РµР»Р°С‚РµР»СЊРЅС‹ (РєР°Р¶РґР°СЏ = РЅР°С‚РёРІРЅР°СЏ РїРµСЂРµСЃР±РѕСЂРєР°, Р° СЃР±РѕСЂРєР°
  РЅР° СЃР»Р°Р±РѕРј РџРљ Р·Р°РЅРёРјР°РµС‚ 8-15 РјРёРЅСѓС‚).
- Р¤РёР·РёРєР° вЂ” РїСЂРѕСЃС‚РѕР№ grid push-out (РІС‹С‚Р°Р»РєРёРІР°РЅРёРµ РєСЂСѓРіР° РёР· РєР»РµС‚РѕРє-СЃС‚РµРЅ), РЅРµ РґРІРёР¶РѕРє.

## РўРµРєСѓС‰Р°СЏ РјРµС…Р°РЅРёРєР° (С‡С‚РѕР±С‹ РЅРµ СЂРµРІРµСЂСЃРёС‚СЊ РєРѕРґ)

**Р¦РёРєР» Р·Р°Р±РµРіР°:**
1. Р’С…РѕРґ СЃС‚РѕРёС‚ 30 СЌРЅРµСЂРіРёРё. Р“РµРЅРµСЂРёСЂСѓРµС‚СЃСЏ Р»Р°Р±РёСЂРёРЅС‚ 40Г—40 Р»РѕРіРёС‡РµСЃРєРёС… РєР»РµС‚РѕРє
   (СЃРµС‚РєР° 81Г—81): РєРѕСЂРёРґРѕСЂС‹ Р°Р»РіРѕСЂРёС‚РјРѕРј recursive backtracker + ~15% В«РїРµСЂРµРїР»РµС‚РµРЅРёСЏВ»
   (Р»РёС€РЅРёРµ РїСЂРѕС…РѕРґС‹ в†’ РїРµС‚Р»Рё) + 12 РІС‹СЂРµР·Р°РЅРЅС‹С… Р·Р°Р»РѕРІ-Р°СЂРµРЅ.
2. РРіСЂРѕРє вЂ” СЃРёРєРµСЂ СЃ С„Р°РєРµР»РѕРј. **РўСѓРјР°РЅ РІРѕР№РЅС‹**: РІРёРґРЅРѕ С‚РѕР»СЊРєРѕ РІ СЂР°РґРёСѓСЃРµ СЃРІРµС‚Р°
   (5.6 РєР»РµС‚РѕРє Р±Р°Р·РѕРІРѕ, РґРѕ 8.1 СЃ Р°РїРіСЂРµР№РґР°РјРё). Р•СЃС‚СЊ РјРёРЅРё-РєР°СЂС‚Р° РёСЃСЃР»РµРґРѕРІР°РЅРЅРѕРіРѕ.
3. **Р¦РµР»СЊ:** СЃРѕР±СЂР°С‚СЊ **15 Р°СЂС‚РµС„Р°РєС‚РѕРІ**, СЂР°Р·Р±СЂРѕСЃР°РЅРЅС‹С… РїРѕ РІСЃРµРјСѓ Р»Р°Р±РёСЂРёРЅС‚Сѓ, Р·Р°С‚РµРј
   РґРѕР№С‚Рё РґРѕ РѕС‚РєСЂС‹РІС€РµРіРѕСЃСЏ РїРѕСЂС‚Р°Р»Р° Рё РІС‹Р№С‚Рё.
4. **Р‘РѕР№:** РјРµС‡ (СѓСЂРѕРЅ 50, РєРѕРЅСѓСЃ 120В°, РєСѓР»РґР°СѓРЅ 0.4СЃ, РґР°Р»СЊРЅРѕСЃС‚СЊ 7), СЂС‹РІРѕРє DASH
   (0.2СЃ РЅРµСѓСЏР·РІРёРјРѕСЃС‚Рё, РєСѓР»РґР°СѓРЅ 1СЃ). Р’СЂР°РіРё: 55 РјРѕРЅСЃС‚СЂРѕРІ вЂ” РѕР±С‹С‡РЅС‹Рµ С‚РµРЅРё (60 HP,
   СѓСЂРѕРЅ 5) Рё СЌР»РёС‚РЅС‹Рµ Р±СѓРіР°Рё (150 HP, СѓСЂРѕРЅ 15), РїР»СЋСЃ **РѕРґРёРЅ Р±РѕСЃСЃ-РЎС‚СЂР°Р¶** (700 HP,
   СѓСЂРѕРЅ 24, РЅР°РіСЂР°РґР° 3000 ORB). Р’СЃРµ РІСЂР°РіРё С‚СѓРїРѕ Р±РµРіСѓС‚ РЅР° РёРіСЂРѕРєР° РїРѕ РїСЂСЏРјРѕР№ РїСЂРё
   Р°РіСЂРµ РІ 30 СЋРЅРёС‚РѕРІ (РЅРµС‚ pathfinding вЂ” СѓРїРёСЂР°СЋС‚СЃСЏ РІ СЃС‚РµРЅС‹).
5. Р•С‰С‘ РЅР° РєР°СЂС‚Рµ: 45 Р»РѕРІСѓС€РµРє (СЃС‚Р°С†РёРѕРЅР°СЂРЅС‹Рµ, СѓСЂРѕРЅ 10 РїСЂРё РєР°СЃР°РЅРёРё), 30 РІР·СЂС‹РІРЅС‹С…
   Р±РѕС‡РµРє (СѓСЂРѕРЅ 100 РјРѕРЅСЃС‚СЂР°Рј, 30 РёРіСЂРѕРєСѓ РІ СЂР°РґРёСѓСЃРµ 15).
6. РЎРјРµСЂС‚СЊ = РєРѕРЅРµС† Р·Р°Р±РµРіР° (РЅРµСЃРѕР±СЂР°РЅРЅРѕРµ С‚РµСЂСЏРµС‚СЃСЏ). Р•СЃС‚СЊ Р°РїРіСЂРµР№Рґ В«Р’С‚РѕСЂРѕР№ С„Р°РєРµР»В» вЂ”
   РїРµСЂРµР¶РёРІР°РµС‚ 1 СЃРјРµСЂС‚РµР»СЊРЅС‹Р№ СѓРґР°СЂ Р·Р° Р·Р°Р±РµРі.
7. РќР°РіСЂР°РґС‹: РѕР±С‹С‡РЅС‹Р№ РјРѕРЅСЃС‚СЂ 150 ORB, СЌР»РёС‚Р° 400, Р±РѕСЃСЃ 3000, СЃРѕРєСЂРѕРІРёС‰Рµ 200,
   Р°СЂС‚РµС„Р°РєС‚ 500, Р±РѕРЅСѓСЃ Р·Р° РїРѕР±РµРі 1000. ORB вЂ” РІРЅСѓС‚СЂРёРёРіСЂРѕРІР°СЏ РІР°Р»СЋС‚Р° РІСЃРµРіРѕ РїСЂРёР»РѕР¶РµРЅРёСЏ.

**РњРµС‚Р°-РїСЂРѕРіСЂРµСЃСЃРёСЏ (В«Р›Р°РіРµСЂСЊ РЎРёРєРµСЂР°В»)** вЂ” 5 РїРѕСЃС‚РѕСЏРЅРЅС‹С… Р°РїРіСЂРµР№РґРѕРІ РїРѕ 5 СѓСЂРѕРІРЅРµР№
Р·Р° ORB: СЂР°РґРёСѓСЃ СЃРІРµС‚Р°, СЃРєРѕСЂРѕСЃС‚СЊ, РјР°РєСЃ HP, СѓСЂРѕРЅ РјРµС‡Р°, СЃС‚СЂР°С…РѕРІРєР° РѕС‚ СЃРјРµСЂС‚Рё.
РџРѕР»РЅР°СЏ РїСЂРѕРєР°С‡РєР° в‰€ 255 000 ORB в‰€ 10-13 С‡Р°СЃРѕРІ РёРіСЂС‹. РџР»СЋСЃ РѕРґРЅР° РєРѕСЃРјРµС‚РёРєР° Р·Р°
СЂРµР°Р»СЊРЅС‹Рµ 0.05 SOL (РїРµСЂРµРєСЂР°С€РёРІР°РµС‚ С„Р°РєРµР»).

## Р§С‚Рѕ РјРЅРµ РќР• РЅСЂР°РІРёС‚СЃСЏ (Рё С‡С‚Рѕ РЅСѓР¶РЅРѕ РѕС‚ С‚РµР±СЏ)

1. **РњРµС…Р°РЅРёРєР° СЃРєСѓС‡РЅР°СЏ.** Р­С‚Рѕ РїРѕ СЃСѓС‚Рё В«СЃРѕР±РµСЂРё 15 С€С‚СѓРє РЅР° Р±РѕР»СЊС€РѕР№ РєР°СЂС‚Рµ, РїРѕРєР°
   РІ С‚РµР±СЏ С‚С‹С‡СѓС‚СЃСЏ РѕРґРЅРѕРѕР±СЂР°Р·РЅС‹Рµ РІСЂР°РіРёВ». РќРµС‚ РЅР°РїСЂСЏР¶РµРЅРёСЏ, РЅРµС‚ РІС‹Р±РѕСЂРѕРІ, РЅРµС‚
   РЅР°СЂР°СЃС‚Р°РЅРёСЏ. Р’СЂР°РіРё С‚СѓРїС‹Рµ (Р±РµРіСѓС‚ РїРѕ РїСЂСЏРјРѕР№). Р›РѕРІСѓС€РєРё СЃС‚Р°С‚РёС‡РЅС‹ Рё РЅРµ С‡РёС‚Р°СЋС‚СЃСЏ
   РєР°Рє СѓРіСЂРѕР·Р°. Р‘РѕС‡РєРё вЂ” РµРґРёРЅСЃС‚РІРµРЅРЅР°СЏ С‚Р°РєС‚РёРєР°. Р‘РѕСЃСЃ РїСЂРѕСЃС‚Рѕ В«РјРµС€РѕРє СЃ HPВ».
2. **Р”РёР·Р°Р№РЅ РЅРµ С‚СЏРЅРµС‚ РЅР° RPG/AAA.** РџРёРєСЃРµР»СЊ-РёРєРѕРЅРєРё РЅР°СЂРёСЃРѕРІР°РЅС‹ РІСЂСѓС‡РЅСѓСЋ,
   РѕСЂРЅР°РјРµРЅС‚РЅС‹Рµ СЂР°РјРєРё РµСЃС‚СЊ, РЅРѕ РѕР±С‰РµРµ РѕС‰СѓС‰РµРЅРёРµ вЂ” В«РјРѕР±РёР»СЊРЅР°СЏ РїРѕРґРµР»РєР°В», Р° РЅРµ
   Diablo/Hades. РҐРѕС‡Сѓ РїРѕРЅСЏС‚СЊ, С‡С‚Рѕ РєРѕРЅРєСЂРµС‚РЅРѕ РґР°С‘С‚ СЌС‚РѕС‚ РґРµС€С‘РІС‹Р№ РІРёРґ.
3. Р—Р°Р±РµРі РѕС‰СѓС‰Р°РµС‚СЃСЏ **СЃР»РёС€РєРѕРј РґР»РёРЅРЅС‹Рј Рё РѕРґРЅРѕРѕР±СЂР°Р·РЅС‹Рј** (15 Р°СЂС‚РµС„Р°РєС‚РѕРІ РЅР° РєР°СЂС‚Рµ
   40Г—40 РїСЂРё РјРµРґР»РµРЅРЅРѕР№ С…РѕРґСЊР±Рµ).

### РћС‚РІРµС‚СЊ СЃС‚СЂРѕРіРѕ РїРѕ РїСѓРЅРєС‚Р°Рј:

**A. РњР•РҐРђРќРРљРђ вЂ” С‡С‚Рѕ СѓР±РёРІР°РµС‚ РёРЅС‚РµСЂРµСЃ (5-8 РєРѕРЅРєСЂРµС‚РЅС‹С… РїСѓРЅРєС‚РѕРІ).**
Р”Р»СЏ РєР°Р¶РґРѕРіРѕ: С‡С‚Рѕ РёРјРµРЅРЅРѕ СЃР»РѕРјР°РЅРѕ в†’ РїРѕС‡РµРјСѓ СЌС‚Рѕ СЃРєСѓС‡РЅРѕ в†’ **РєРѕРЅРєСЂРµС‚РЅРѕРµ СЂРµС€РµРЅРёРµ**
СЃ С‡РёСЃР»Р°РјРё (С‡С‚Рѕ РїРѕРјРµРЅСЏС‚СЊ РІ Р±Р°Р»Р°РЅСЃРµ/РїСЂР°РІРёР»Р°С…). РћСЃРѕР±РµРЅРЅРѕ РёРЅС‚РµСЂРµСЃСѓРµС‚:
- РљР°Рє РґРѕР±Р°РІРёС‚СЊ **РЅР°РїСЂСЏР¶РµРЅРёРµ Рё РІС‹Р±РѕСЂС‹** (СЃРµР№С‡Р°СЃ РёС… РЅРµС‚)
- Р§С‚Рѕ РґРµР»Р°С‚СЊ СЃ РР РІСЂР°РіРѕРІ (Р±РµР· РґРѕСЂРѕРіРѕРіРѕ pathfinding вЂ” РµСЃС‚СЊ Р»Рё РґРµС€С‘РІС‹Рµ РїСЂРёС‘РјС‹,
  РґР°СЋС‰РёРµ РѕС‰СѓС‰РµРЅРёРµ СѓРјРЅРѕРіРѕ РїРѕРІРµРґРµРЅРёСЏ?)
- РљР°Рє РїРµСЂРµРґРµР»Р°С‚СЊ СЃС‚СЂСѓРєС‚СѓСЂСѓ Р·Р°Р±РµРіР°, С‡С‚РѕР±С‹ РѕРЅ Р±С‹Р» РєРѕСЂРѕС‡Рµ/РїР»РѕС‚РЅРµРµ, РЅРѕ РіР»СѓР±Р¶Рµ
- РљР°Рє СЃРґРµР»Р°С‚СЊ Р±РѕСЃСЃР° РёРЅС‚РµСЂРµСЃРЅС‹Рј (С„Р°Р·С‹? РїР°С‚С‚РµСЂРЅС‹? Р°СЂРµРЅР°?)
- РЎС‚РѕРёС‚ Р»Рё РїРµСЂРµС…РѕРґРёС‚СЊ РЅР° **РјРЅРѕРіРѕСЌС‚Р°Р¶РЅС‹Р№ СЃРїСѓСЃРє** РІРјРµСЃС‚Рѕ РѕРґРЅРѕР№ Р±РѕР»СЊС€РѕР№ РєР°СЂС‚С‹?

**B. Р”РР—РђР™Рќ вЂ” С‡С‚Рѕ РґР°С‘С‚ В«РґРµС€С‘РІС‹Р№В» РІРёРґ (5-8 РїСѓРЅРєС‚РѕРІ).**
Р§С‚Рѕ РєРѕРЅРєСЂРµС‚РЅРѕ РІ СЂРµРЅРґРµСЂРµ/UI РІС‹РіР»СЏРґРёС‚ РЅРµРїСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅРѕ Рё РєР°Рє СЌС‚Рѕ С‡РёРЅРёС‚СЊ
**СЃСЂРµРґСЃС‚РІР°РјРё Skia + string-art СЃРїСЂР°Р№С‚РѕРІ** (Р±РµР· PNG-Р°СЃСЃРµС‚РѕРІ). Р•СЃР»Рё РєР°РєРёРµ-С‚Рѕ
РІРµС‰Рё РїСЂРёРЅС†РёРїРёР°Р»СЊРЅРѕ РЅРµРґРѕСЃС‚РёР¶РёРјС‹ Р±РµР· РЅР°СЂРёСЃРѕРІР°РЅРЅС‹С… Р°СЃСЃРµС‚РѕРІ вЂ” СЃРєР°Р¶Рё РїСЂСЏРјРѕ, РєР°РєРёРµ
РёРјРµРЅРЅРѕ Рё С‡С‚Рѕ РІРјРµСЃС‚Рѕ РЅРёС….

**C. РџР РРћР РРўР•РўР«.** РћС‚СЃРѕСЂС‚РёСЂСѓР№ РІСЃРµ СЃРІРѕРё РїСЂРµРґР»РѕР¶РµРЅРёСЏ РїРѕ В«СЌС„С„РµРєС‚ / С‚СЂСѓРґРѕР·Р°С‚СЂР°С‚С‹В».
Р§С‚Рѕ РґР°СЃС‚ РјР°РєСЃРёРјР°Р»СЊРЅС‹Р№ СЃРєР°С‡РѕРє РѕС‰СѓС‰РµРЅРёСЏ Р·Р° РјРёРЅРёРјСѓРј СЂР°Р±РѕС‚С‹? Р”Р°Р№ С‚РѕРї-5 РІ РїРѕСЂСЏРґРєРµ
РІРЅРµРґСЂРµРЅРёСЏ.

**D. Р§С‚Рѕ СЏ РґРµР»Р°СЋ РџР РђР’РР›Р¬РќРћ** вЂ” С‡С‚Рѕ РЅРµ РЅР°РґРѕ С‚СЂРѕРіР°С‚СЊ (С‡С‚РѕР±С‹ РЅРµ СЃР»РѕРјР°С‚СЊ С…РѕСЂРѕС€РµРµ).

РќРµ Р¶Р°Р»РµР№ РјРµРЅСЏ, РЅСѓР¶РЅР° С‡РµСЃС‚РЅРѕСЃС‚СЊ. Р•СЃР»Рё С„СѓРЅРґР°РјРµРЅС‚ РјРµС…Р°РЅРёРєРё РїРѕСЂРѕС‡РµРЅ вЂ” СЃРєР°Р¶Рё СЌС‚Рѕ
РїСЂСЏРјРѕ Рё РїСЂРµРґР»РѕР¶Рё, РЅР° С‡С‚Рѕ РµРіРѕ РјРµРЅСЏС‚СЊ.

---

## Р¤Р°Р№Р»С‹ РІ СЌС‚РѕРј РїР°РєРµС‚Рµ

| Р¤Р°Р№Р» | Р§С‚Рѕ СЌС‚Рѕ |
|---|---|
| `01-labyrinth-logic.ts` | `lib/labyrinth.ts` вЂ” РІСЃСЏ РёРіСЂРѕРІР°СЏ Р»РѕРіРёРєР°, Р±Р°Р»Р°РЅСЃ, РіРµРЅРµСЂР°С†РёСЏ Р»Р°Р±РёСЂРёРЅС‚Р°, СЃРёРјСѓР»СЏС†РёСЏ |
| `02-sprites.ts` | `lib/labyrinthSprites.ts` вЂ” СЃРїСЂР°Р№С‚С‹ РїРµСЂСЃРѕРЅР°Р¶РµР№/РІСЂР°РіРѕРІ/РёРєРѕРЅРѕРє (string-art) |
| `03-game-component.tsx` | `components/LabyrinthOfAbyss.tsx` вЂ” Skia-СЂРµРЅРґРµСЂ СЃС†РµРЅС‹ + РІРµСЃСЊ UI (РјРµРЅСЋ, Р»Р°РіРµСЂСЊ, HUD, СЌРєСЂР°РЅС‹ СЃРјРµСЂС‚Рё) |
| `04-ui-primitives.tsx` | `components/LabyrinthUI.tsx` вЂ” РїРµСЂРµРёСЃРїРѕР»СЊР·СѓРµРјС‹Рµ UI-РїСЂРёРјРёС‚РёРІС‹ (РёРєРѕРЅРєРё, СЂР°РјРєРё, СЂСѓРЅ-РєРЅРѕРїРєРё) |
| `05-shop-design.md` | РґРёР·Р°Р№РЅ-РґРѕРєСѓРјРµРЅС‚ СЌРєРѕРЅРѕРјРёРєРё Р°РїРіСЂРµР№РґРѕРІ |



---

# ИСХОДНЫЙ КОД


## lib/labyrinth.ts — игровая логика, баланс, генерация, симуляция

```ts
/**
 * Abyss Labyrinth вЂ” pure game logic (no React, no three.js).
 *
 * Ported 1:1 from the AI-Studio web prototype (TreasureHunt.tsx 3D maze):
 * maze generation, entity spawning, and all balance numbers. Rendering and
 * the frame loop live in components/LabyrinthOfAbyss.tsx; physics is a simple
 * grid push-out (the web build used the Rapier WASM engine, which does not
 * run in React Native).
 */

// в”Ђв”Ђ Balance (from the web prototype) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const CELL_SIZE       = 5;
export const WALL_HEIGHT     = 4;
export const MAZE_W          = 40;          // logical cells; grid = 2n+1
export const MAZE_H          = 40;
export const ENTRY_ENERGY    = 30;

export const PLAYER_MAX_HP   = 100;
export const PLAYER_SPEED    = 12;          // units/sec
export const PLAYER_RADIUS   = 1.2;
export const DASH_SPEED      = 40;          // impulse 35 over 0.2s в‰€ sustained 40
export const DASH_TIME       = 0.2;         // s of i-frames + burst
export const DASH_COOLDOWN   = 1.0;

export const ATTACK_RANGE    = 7;
export const ATTACK_ARC_COS  = Math.cos(Math.PI / 1.5); // 120В° cone
export const ATTACK_DMG      = 50;
export const ATTACK_COOLDOWN = 0.4;
export const KNOCKBACK_FORCE = 10;
export const SWING_TIME      = 0.28;        // blade-arc duration for the render

export const MONSTER_COUNT   = 55;
export const BRUTE_CHANCE    = 0.25;
export const MONSTER_AGGRO   = 30;          // starts chasing
export const MONSTER_HIT_DIST= 2.5;
export const MONSTER_ATK_CD  = 1.0;
export const BRUTE_HP        = 150;
export const BRUTE_SPEED     = 3;
export const BRUTE_DMG       = 15;
export const BRUTE_REWARD    = 400;
export const NORMAL_HP       = 60;
export const NORMAL_SPEED    = 5.5;
export const NORMAL_DMG      = 5;
export const NORMAL_REWARD   = 150;

// The Guardian вЂ” one slow, heavily-armoured mini-boss per run. Big HP, big hurt,
// big payout. Rendered large with its own boss HP bar.
export const GUARDIAN_HP     = 700;
export const GUARDIAN_SPEED  = 3.6;
export const GUARDIAN_DMG    = 24;
export const GUARDIAN_REWARD = 3000;

export const ITEM_COUNT      = 15;
export const TREASURE_ORB    = 200;
export const ARTIFACT_ORB    = 500;
export const ARTIFACT_CHANCE = 0.4;         // else treasure
export const COLLECT_DIST    = 2.2;

export const TRAP_COUNT      = 45;
export const TRAP_DMG        = 10;
export const TRAP_DIST       = 2.0;

export const BARREL_COUNT    = 30;
export const BARREL_BLAST_R  = 15;
export const BARREL_MONSTER_DMG = 100;
export const BARREL_PLAYER_DMG  = 30;

export const PORTAL_DIST     = 3.0;
export const WIN_BONUS_ORB   = 1000;
export const WIN_TOURNAMENT_PTS = 60;

// в”Ђв”Ђ Camp upgrades (permanent meta-progression, bought with ORB) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// Five axes, levels 0-5 each. Index every table by level; level 0 must equal
// the base balance constants above so a run without upgrades is byte-identical
// to the pre-camp game.
export const UPGRADE_MAX_LEVEL   = 5;
export const TORCH_LEVELS        = [5.6, 6.1, 6.6, 7.1, 7.6, 8.1];      // light radius, cells
export const SPEED_LEVELS        = [12, 13, 14, 15, 16, 17];             // units/sec
export const MAX_HP_LEVELS       = [100, 120, 140, 160, 180, 200];
export const SWORD_DMG_LEVELS    = [50, 60, 70, 80, 90, 100];
export const EMBER_REVIVE_HP     = [0, 1, 20, 35, 50, 75];               // Second Torch: HP restored (0 = locked)
export const LANTERN_TORCH_BONUS = 0.4;                                  // Abyss Lantern (SOL cosmetic) light bonus

/** Permanent camp-upgrade levels (0-5 per axis) applied to a run at creation. */
export type LabyrinthUpgrades = {
  torch: number;      // fog-of-war light radius
  speed: number;      // move speed
  vigor: number;      // max HP
  blade: number;      // sword damage
  ember: number;      // "Second Torch" вЂ” survive one lethal hit per run
  /** Abyss Lantern cosmetic (SOL): small extra light radius; tint is render-side. */
  lantern?: boolean;
};

// в”Ђв”Ђ Types в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export type Vec2 = { x: number; z: number };

export type MonsterType = 'brute' | 'normal' | 'guardian';

export type Monster = {
  id: number;
  pos: Vec2;
  hp: number;
  maxHp: number;           // for damage bars (boss)
  type: MonsterType;
  variant: number;         // picks the sprite among normal-monster variants
  speed: number;
  dead: boolean;
  lastAttack: number;      // run-clock seconds
  damageFlash: number;     // seconds remaining of white flash
  knockback: Vec2;         // decaying velocity
};

/** ORB payout / contact damage for a monster type. */
export function rewardFor(t: MonsterType): number {
  return t === 'guardian' ? GUARDIAN_REWARD : t === 'brute' ? BRUTE_REWARD : NORMAL_REWARD;
}
export function dmgFor(t: MonsterType): number {
  return t === 'guardian' ? GUARDIAN_DMG : t === 'brute' ? BRUTE_DMG : NORMAL_DMG;
}
export function monsterName(t: MonsterType): string {
  return t === 'guardian' ? 'The Guardian' : t === 'brute' ? 'Brute' : 'Shade';
}

export type LootItem = {
  id: number;
  pos: Vec2;
  type: 'treasure' | 'artifact';
  collected: boolean;
};

export type Trap   = { id: number; pos: Vec2; triggered: boolean };
export type Barrel = { id: number; pos: Vec2; exploded: boolean };

// Transient FX for juice (spark bursts, floating damage/reward numbers)
export type Particle = { x: number; z: number; vx: number; vz: number; life: number; max: number; color: string; size: number };
export type FloatText = { x: number; z: number; text: string; life: number; max: number; color: string; vy: number };

export type RunState = {
  grid: number[][];        // 1 = wall
  gridW: number;
  gridH: number;
  player: {
    pos: Vec2;
    dir: Vec2;             // facing (normalized)
    hp: number;
    attackCooldown: number;
    isDashing: boolean;
    dashTime: number;
    dashCooldown: number;
    moving: boolean;       // for the walk-cycle animation
    stepPhase: number;     // advances only while moving в†’ bouncy stride
  };
  monsters: Monster[];
  items: LootItem[];
  traps: Trap[];
  barrels: Barrel[];
  portalActive: boolean;
  portalPos: Vec2;
  clock: number;           // run time, seconds
  kills: number;
  runOrb: number;          // ORB earned this run (already granted via callback)
  // Effective per-run stats вЂ” the base constants after camp upgrades. The
  // simulation and renderer read these instead of the raw constants.
  maxHp: number;
  moveSpeed: number;
  attackDmg: number;
  torchCells: number;      // light radius in cells (renderer adds flicker on top)
  emberCharges: number;    // Second Torch: lethal-hit saves left this run
  emberReviveHp: number;   // HP restored when the Second Torch flares
  explored: number[][];    // fog-of-war memory (1 = seen) вЂ” feeds the minimap
  // FX
  particles: Particle[];
  floats: FloatText[];
  shake: number;           // decaying screen-shake magnitude
  swordSwing: number;      // 1 в†’ 0 over a swing, for the blade arc
};

// в”Ђв”Ђ Maze generation в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
/**
 * A REAL labyrinth, not wall noise: recursive-backtracker corridors over the
 * logical cell lattice, braided (extra openings) so it is not a punishing
 * perfect maze, with carved halls for fights. Reads as "corridors and rooms" вЂ”
 * the coherent structure the old random-sprinkle generator never had.
 */
export function generateMaze(w: number, h: number) {
  const gridW = w * 2 + 1;
  const gridH = h * 2 + 1;
  // start solid; corridors are carved out
  const grid: number[][] = Array.from({ length: gridH }, () => Array(gridW).fill(1));

  // 1) depth-first corridor carve over logical cells (odd grid coords)
  const visited: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
  const stack: Array<[number, number]> = [];
  let sx = Math.floor(w / 2), sy = Math.floor(h / 2);
  visited[sy][sx] = true;
  grid[sy * 2 + 1][sx * 2 + 1] = 0;
  stack.push([sx, sy]);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nbrs: Array<[number, number, number, number]> = [];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && !visited[ny][nx]) nbrs.push([nx, ny, dx, dy]);
    }
    if (!nbrs.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nbrs[Math.floor(Math.random() * nbrs.length)];
    visited[ny][nx] = true;
    grid[y * 2 + 1 + dy][x * 2 + 1 + dx] = 0;   // knock down the wall between
    grid[ny * 2 + 1][nx * 2 + 1] = 0;
    stack.push([nx, ny]);
  }

  // 2) braid: open ~15% of walls that separate two corridors в†’ loops, fewer
  //    dead ends, alternate routes around monsters
  for (let y = 1; y < gridH - 1; y++) {
    for (let x = 1; x < gridW - 1; x++) {
      if (grid[y][x] !== 1 || Math.random() >= 0.15) continue;
      const horiz = grid[y][x - 1] === 0 && grid[y][x + 1] === 0;
      const vert  = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
      if (horiz || vert) grid[y][x] = 0;
    }
  }

  // 3) carve halls вЂ” arena rooms for fights and loot clusters
  for (let i = 0; i < 12; i++) {
    const rw = Math.floor(Math.random() * 5) + 4;
    const rh = Math.floor(Math.random() * 4) + 3;
    const rx = Math.floor(Math.random() * (gridW - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (gridH - rh - 2)) + 1;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) grid[y][x] = 0;
    }
  }

  // 4) spawn clearing in the centre
  const cx = Math.floor(gridW / 2);
  const cy = Math.floor(gridH / 2);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (grid[cy + dy]?.[cx + dx] !== undefined) grid[cy + dy][cx + dx] = 0;
    }
  }

  // 5) keep the outer ring solid so halls never breach the boundary
  for (let x = 0; x < gridW; x++) { grid[0][x] = 1; grid[gridH - 1][x] = 1; }
  for (let y = 0; y < gridH; y++) { grid[y][0] = 1; grid[y][gridW - 1] = 1; }

  return { grid, gridW, gridH };
}

// в”Ђв”Ђ Coordinate helpers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function cellToWorld(cx: number, cz: number, gridW: number, gridH: number): Vec2 {
  return {
    x: cx * CELL_SIZE - ((gridW - 1) * CELL_SIZE) / 2,
    z: cz * CELL_SIZE - ((gridH - 1) * CELL_SIZE) / 2,
  };
}

export function worldToCell(x: number, z: number, gridW: number, gridH: number) {
  return {
    cx: Math.round((x + ((gridW - 1) * CELL_SIZE) / 2) / CELL_SIZE),
    cz: Math.round((z + ((gridH - 1) * CELL_SIZE) / 2) / CELL_SIZE),
  };
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Grid collision: push a circle of `radius` out of any wall cells around it.
 * Replaces the web build's Rapier rigid bodies вЂ” for an axis-aligned cell
 * maze a per-axis AABB push-out is indistinguishable in play.
 */
export function resolveWallCollision(
  grid: number[][], gridW: number, gridH: number,
  pos: Vec2, radius: number,
): Vec2 {
  const { cx, cz } = worldToCell(pos.x, pos.z, gridW, gridH);
  let { x, z } = pos;
  const half = CELL_SIZE / 2;

  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const gx = cx + dx, gz = cz + dz;
      if (gx < 0 || gz < 0 || gx >= gridW || gz >= gridH) continue;
      if (grid[gz][gx] !== 1) continue;
      const c = cellToWorld(gx, gz, gridW, gridH);
      // Closest point on the wall AABB to the circle centre
      const nx = Math.max(c.x - half, Math.min(x, c.x + half));
      const nz = Math.max(c.z - half, Math.min(z, c.z + half));
      const ddx = x - nx, ddz = z - nz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 < radius * radius) {
        const d = Math.sqrt(d2) || 0.0001;
        const push = (radius - d) / d;
        x += ddx * push;
        z += ddz * push;
      }
    }
  }
  return { x, z };
}

/** Keep the point inside the outer bounds of the maze. */
export function clampToBounds(pos: Vec2, gridW: number, gridH: number): Vec2 {
  const hx = ((gridW - 1) * CELL_SIZE) / 2 - PLAYER_RADIUS;
  const hz = ((gridH - 1) * CELL_SIZE) / 2 - PLAYER_RADIUS;
  return {
    x: Math.max(-hx, Math.min(hx, pos.x)),
    z: Math.max(-hz, Math.min(hz, pos.z)),
  };
}

// в”Ђв”Ђ Run factory в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function createRun(upgrades?: Partial<LabyrinthUpgrades>): RunState {
  const { grid, gridW, gridH } = generateMaze(MAZE_W, MAZE_H);

  // Clamp each axis to a valid table index; omitted axes fall back to level 0,
  // so `createRun()` behaves exactly as before the camp existed.
  const lv = (n: number | undefined) =>
    Math.max(0, Math.min(UPGRADE_MAX_LEVEL, Math.floor(n ?? 0)));
  const maxHp      = MAX_HP_LEVELS[lv(upgrades?.vigor)];
  const moveSpeed  = SPEED_LEVELS[lv(upgrades?.speed)];
  const attackDmg  = SWORD_DMG_LEVELS[lv(upgrades?.blade)];
  const torchCells = TORCH_LEVELS[lv(upgrades?.torch)]
                   + (upgrades?.lantern ? LANTERN_TORCH_BONUS : 0);
  const emberLv    = lv(upgrades?.ember);

  const emptyPos = (): Vec2 => {
    for (let tries = 0; tries < 4000; tries++) {
      const cx = Math.floor(Math.random() * (gridW - 2)) + 1;
      const cz = Math.floor(Math.random() * (gridH - 2)) + 1;
      if (grid[cz][cx] === 0) return cellToWorld(cx, cz, gridW, gridH);
    }
    return { x: 0, z: 0 };
  };

  return {
    grid, gridW, gridH,
    player: {
      pos: { x: 0, z: 0 },
      dir: { x: 0, z: -1 },
      hp: maxHp,
      attackCooldown: 0,
      isDashing: false, dashTime: 0, dashCooldown: 0,
      moving: false, stepPhase: 0,
    },
    monsters: [
      ...Array.from({ length: MONSTER_COUNT }, (_, i): Monster => {
        const isBrute = Math.random() < BRUTE_CHANCE;
        const hp = isBrute ? BRUTE_HP : NORMAL_HP;
        return {
          id: i,
          pos: emptyPos(),
          hp, maxHp: hp,
          type: isBrute ? 'brute' : 'normal',
          variant: Math.floor(Math.random() * 3),
          speed: isBrute ? BRUTE_SPEED : NORMAL_SPEED,
          dead: false, lastAttack: 0, damageFlash: 0,
          knockback: { x: 0, z: 0 },
        };
      }),
      // The Guardian mini-boss вЂ” spawned far from the centre so the descent
      // builds toward the encounter.
      {
        id: MONSTER_COUNT,
        pos: emptyPos(),
        hp: GUARDIAN_HP, maxHp: GUARDIAN_HP,
        type: 'guardian', variant: 0,
        speed: GUARDIAN_SPEED,
        dead: false, lastAttack: 0, damageFlash: 0,
        knockback: { x: 0, z: 0 },
      },
    ],
    items: Array.from({ length: ITEM_COUNT }, (_, i) => ({
      id: i,
      pos: emptyPos(),
      type: Math.random() > ARTIFACT_CHANCE ? 'treasure' as const : 'artifact' as const,
      collected: false,
    })),
    traps: Array.from({ length: TRAP_COUNT }, (_, i) => ({
      id: i, pos: emptyPos(), triggered: false,
    })),
    barrels: Array.from({ length: BARREL_COUNT }, (_, i) => ({
      id: i, pos: emptyPos(), exploded: false,
    })),
    portalActive: false,
    portalPos: { x: 0, z: 0 },
    clock: 0,
    kills: 0,
    runOrb: 0,
    maxHp,
    moveSpeed,
    attackDmg,
    torchCells,
    emberCharges: emberLv > 0 ? 1 : 0,
    emberReviveHp: EMBER_REVIVE_HP[emberLv],
    explored: Array.from({ length: gridH }, () => Array(gridW).fill(0)),
    particles: [],
    floats: [],
    shake: 0,
    swordSwing: 0,
  };
}

// в”Ђв”Ђ FX helpers в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function spawnBurst(run: RunState, x: number, z: number, color: string, count: number, speed: number) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    run.particles.push({
      x, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s,
      life: 0.5 + Math.random() * 0.35, max: 0.85,
      color, size: 2 + Math.random() * 2.5,
    });
  }
  if (run.particles.length > 240) run.particles.splice(0, run.particles.length - 240);
}

export function addFloat(run: RunState, x: number, z: number, text: string, color: string) {
  run.floats.push({ x, z, text, life: 1, max: 1, color, vy: 1.4 });
  if (run.floats.length > 40) run.floats.splice(0, run.floats.length - 40);
}

export type SimInput = { jx: number; jz: number; attack: boolean; dash: boolean };
export type SimEvents = {
  setHp: (hp: number) => void;
  setCollected: (n: number) => void;
  setRunOrb: (n: number) => void;
  setMsg: (m: string) => void;
  onHitFlash: () => void;
  onEnd: (won: boolean) => void;
  playSound: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  earnOrb: (n: number) => void;
};

/**
 * Advance the whole simulation by `dt` seconds. Pure logic + FX; the renderer
 * only reads state. Ported verbatim from the original 3D useFrame loop, plus
 * particle/float/shake juice.
 */
export function stepSimulation(run: RunState, input: SimInput, dt: number, ev: SimEvents) {
  const r = run;
  const p = r.player;
  r.clock += dt;

  // decay FX
  if (r.shake > 0) r.shake = Math.max(0, r.shake - dt * 22);
  if (r.swordSwing > 0) r.swordSwing = Math.max(0, r.swordSwing - dt / SWING_TIME);
  for (let i = r.particles.length - 1; i >= 0; i--) {
    const pa = r.particles[i];
    pa.life -= dt;
    if (pa.life <= 0) { r.particles.splice(i, 1); continue; }
    pa.x += pa.vx * dt; pa.z += pa.vz * dt;
    pa.vx *= (1 - 3 * dt); pa.vz *= (1 - 3 * dt);
  }
  for (let i = r.floats.length - 1; i >= 0; i--) {
    const f = r.floats[i];
    f.life -= dt * 1.1;
    if (f.life <= 0) { r.floats.splice(i, 1); continue; }
    f.z -= f.vy * dt;
  }

  // timers
  if (p.attackCooldown > 0) p.attackCooldown -= dt;
  if (p.dashCooldown  > 0) p.dashCooldown  -= dt;
  if (p.dashTime > 0) { p.dashTime -= dt; if (p.dashTime <= 0) p.isDashing = false; }

  // movement
  let dx = input.jx, dz = input.jz;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len > 1) { dx /= len; dz /= len; }

  // Dash always fires: along the stick if held, else along the facing
  // direction вЂ” a bare tap must never feel like a dead button.
  if (input.dash && p.dashCooldown <= 0) {
    if (len > 0.15) {
      const inv = 1 / (Math.sqrt(dx * dx + dz * dz) || 1);
      p.dir = { x: dx * inv, z: dz * inv };
    }
    p.isDashing = true;
    p.dashTime = DASH_TIME;
    p.dashCooldown = DASH_COOLDOWN;
    spawnBurst(r, p.pos.x, p.pos.z, '#c4b5fd', 8, 6);
    ev.playSound('tap');
  }
  input.dash = false;

  const speed = p.isDashing ? DASH_SPEED : r.moveSpeed;
  if (len > 0.15 || p.isDashing) {
    p.moving = true;
    p.stepPhase += dt * (p.isDashing ? 30 : 17);   // stride cadence
    const mx = p.isDashing ? p.dir.x : dx;
    const mz = p.isDashing ? p.dir.z : dz;
    let next = { x: p.pos.x + mx * speed * dt, z: p.pos.z + mz * speed * dt };
    next = resolveWallCollision(r.grid, r.gridW, r.gridH, next, PLAYER_RADIUS);
    p.pos = clampToBounds(next, r.gridW, r.gridH);
    if (len > 0.15) {
      const inv = 1 / (Math.sqrt(dx * dx + dz * dz) || 1);
      p.dir = { x: dx * inv, z: dz * inv };
    }
  } else {
    p.moving = false;
  }

  // fog-of-war memory: remember every cell the torch has revealed (minimap)
  {
    const pc = worldToCell(p.pos.x, p.pos.z, r.gridW, r.gridH);
    const R = Math.ceil(r.torchCells);
    for (let mz = -R; mz <= R; mz++) {
      for (let mx = -R; mx <= R; mx++) {
        if (mx * mx + mz * mz > R * R) continue;
        const gz = pc.cz + mz, gx = pc.cx + mx;
        if (gz >= 0 && gx >= 0 && gz < r.gridH && gx < r.gridW) r.explored[gz][gx] = 1;
      }
    }
  }

  // attack
  if (input.attack) {
    input.attack = false;
    if (p.attackCooldown <= 0) {
      p.attackCooldown = ATTACK_COOLDOWN;
      r.swordSwing = 1;
      // a quick arc of sparks so even a whiffed swing has weight
      spawnBurst(r, p.pos.x + p.dir.x * 3.5, p.pos.z + p.dir.z * 3.5, '#e0f2fe', 5, 6);
      let hit = false;

      for (const b of r.barrels) {
        if (b.exploded || dist(b.pos, p.pos) > ATTACK_RANGE) continue;
        const tb = { x: b.pos.x - p.pos.x, z: b.pos.z - p.pos.z };
        const tl = Math.sqrt(tb.x * tb.x + tb.z * tb.z) || 1;
        if ((tb.x / tl) * p.dir.x + (tb.z / tl) * p.dir.z < ATTACK_ARC_COS) continue;
        b.exploded = true; hit = true;
        r.shake = Math.max(r.shake, 9);
        spawnBurst(r, b.pos.x, b.pos.z, '#f97316', 22, 12);
        for (const m of r.monsters) {
          if (m.dead || dist(m.pos, b.pos) > BARREL_BLAST_R) continue;
          m.hp -= BARREL_MONSTER_DMG;
          m.damageFlash = 0.5;
          const kb = { x: m.pos.x - b.pos.x, z: m.pos.z - b.pos.z };
          const kl = Math.sqrt(kb.x * kb.x + kb.z * kb.z) || 1;
          m.knockback = { x: (kb.x / kl) * 20, z: (kb.z / kl) * 20 };
          if (m.hp <= 0 && !m.dead) {
            m.dead = true; r.kills += 1;
            const reward = rewardFor(m.type);
            r.runOrb += reward; ev.earnOrb(reward); ev.setRunOrb(r.runOrb);
            addFloat(r, m.pos.x, m.pos.z, `+${reward}`, '#facc15');
            spawnBurst(r, m.pos.x, m.pos.z, '#ef4444', 12, 8);
            if (m.type === 'guardian') { r.shake = Math.max(r.shake, 16); spawnBurst(r, m.pos.x, m.pos.z, '#22d3ee', 40, 15); ev.setMsg('THE GUARDIAN FALLS В· +3000 ORB'); ev.playSound('jackpot'); }
          }
        }
        if (dist(p.pos, b.pos) < BARREL_BLAST_R) {
          p.hp -= BARREL_PLAYER_DMG;
          ev.setHp(Math.max(0, p.hp));
          addFloat(r, p.pos.x, p.pos.z, `-${BARREL_PLAYER_DMG}`, '#ef4444');
          ev.onHitFlash();
        }
      }

      for (const m of r.monsters) {
        if (m.dead || dist(m.pos, p.pos) > ATTACK_RANGE) continue;
        const tm = { x: m.pos.x - p.pos.x, z: m.pos.z - p.pos.z };
        const tl = Math.sqrt(tm.x * tm.x + tm.z * tm.z) || 1;
        if ((tm.x / tl) * p.dir.x + (tm.z / tl) * p.dir.z < ATTACK_ARC_COS) continue;
        m.hp -= r.attackDmg;
        m.damageFlash = 0.22;
        const kbForce = m.type === 'guardian' ? 2 : m.type === 'brute' ? 6 : KNOCKBACK_FORCE;
        m.knockback = { x: p.dir.x * kbForce, z: p.dir.z * kbForce };
        hit = true;
        r.shake = Math.max(r.shake, 3);                 // every clean hit thumps
        addFloat(r, m.pos.x, m.pos.z, String(r.attackDmg), '#ffffff');
        spawnBurst(r, m.pos.x, m.pos.z, '#fca5a5', 10, 9);
        spawnBurst(r, m.pos.x, m.pos.z, '#ffffff', 4, 12);   // bright impact flash
        if (m.hp <= 0) {
          m.dead = true; r.kills += 1;
          const reward = rewardFor(m.type);
          r.runOrb += reward; ev.earnOrb(reward); ev.setRunOrb(r.runOrb);
          addFloat(r, m.pos.x, m.pos.z - 0.6, `+${reward}`, '#facc15');
          if (m.type === 'guardian') {
            r.shake = Math.max(r.shake, 16);
            spawnBurst(r, m.pos.x, m.pos.z, '#22d3ee', 44, 16);
            spawnBurst(r, m.pos.x, m.pos.z, '#ffffff', 18, 10);
            ev.setMsg('THE GUARDIAN FALLS В· +3000 ORB');
            ev.playSound('jackpot');
          } else {
            r.shake = Math.max(r.shake, 8);
            spawnBurst(r, m.pos.x, m.pos.z, '#ef4444', 16, 11);
            ev.setMsg(`${monsterName(m.type)} slain В· +${reward} ORB`);
          }
        }
      }
      ev.playSound(hit ? 'crit' : 'tap');
    }
  }

  // monsters
  for (const m of r.monsters) {
    if (m.dead) continue;
    if (m.damageFlash > 0) m.damageFlash -= dt;
    if (m.knockback.x !== 0 || m.knockback.z !== 0) {
      m.pos.x += m.knockback.x * dt;
      m.pos.z += m.knockback.z * dt;
      const decay = Math.max(0, 1 - 4 * dt);
      m.knockback.x *= decay; m.knockback.z *= decay;
      if (Math.abs(m.knockback.x) + Math.abs(m.knockback.z) < 0.1) m.knockback = { x: 0, z: 0 };
    }
    const d = dist(m.pos, p.pos);
    if (d < MONSTER_AGGRO && d > MONSTER_HIT_DIST * 0.8) {
      const ux = (p.pos.x - m.pos.x) / d;
      const uz = (p.pos.z - m.pos.z) / d;
      let next = { x: m.pos.x + ux * m.speed * dt, z: m.pos.z + uz * m.speed * dt };
      next = resolveWallCollision(r.grid, r.gridW, r.gridH, next, 1.0);
      m.pos = next;
    }
    if (d <= MONSTER_HIT_DIST && r.clock - m.lastAttack > MONSTER_ATK_CD) {
      m.lastAttack = r.clock;
      if (!p.isDashing) {
        const dmg = dmgFor(m.type);
        p.hp -= dmg;
        ev.setHp(Math.max(0, p.hp));
        r.shake = Math.max(r.shake, m.type === 'guardian' ? 9 : 4);
        addFloat(r, p.pos.x, p.pos.z, `-${dmg}`, '#ef4444');
        spawnBurst(r, p.pos.x, p.pos.z, '#ef4444', 6, 6);
        ev.onHitFlash();
        ev.playSound('dead');
      }
    }
  }

  // traps
  if (!p.isDashing) {
    for (const t of r.traps) {
      if (t.triggered || dist(t.pos, p.pos) > TRAP_DIST) continue;
      t.triggered = true;
      p.hp -= TRAP_DMG;
      ev.setHp(Math.max(0, p.hp));
      r.shake = Math.max(r.shake, 4);
      addFloat(r, p.pos.x, p.pos.z, `-${TRAP_DMG}`, '#f43f5e');
      ev.onHitFlash();
      ev.setMsg('Trap sprung В· -10 HP');
    }
  }

  // loot
  for (const it of r.items) {
    if (it.collected || dist(it.pos, p.pos) > COLLECT_DIST) continue;
    it.collected = true;
    const orb = it.type === 'artifact' ? ARTIFACT_ORB : TREASURE_ORB;
    r.runOrb += orb; ev.earnOrb(orb); ev.setRunOrb(r.runOrb);
    const col = it.type === 'artifact' ? '#22d3ee' : '#facc15';
    addFloat(r, it.pos.x, it.pos.z, `+${orb}`, col);
    spawnBurst(r, it.pos.x, it.pos.z, col, 16, 8);
    const left = r.items.filter(x => !x.collected).length;
    if (left === 0) {
      r.portalActive = true;
      let pp = { x: p.pos.x, z: p.pos.z + 10 };
      pp = resolveWallCollision(r.grid, r.gridW, r.gridH, pp, 2);
      r.portalPos = clampToBounds(pp, r.gridW, r.gridH);
      ev.setMsg('All artifacts found В· reach the portal!');
      ev.playSound('levelup');
    } else {
      ev.playSound('tap');
    }
    ev.setCollected(ITEM_COUNT - left);
  }

  // portal / win
  if (r.portalActive && dist(r.portalPos, p.pos) < PORTAL_DIST) {
    r.runOrb += WIN_BONUS_ORB;
    ev.earnOrb(WIN_BONUS_ORB); ev.setRunOrb(r.runOrb);
    ev.playSound('jackpot');
    ev.onEnd(true);
    return;
  }

  // death вЂ” unless the Second Torch flares (camp insurance, once per run):
  // the seeker is pulled back from the brink, nearby shades are blasted away,
  // and every monster's attack timer is pushed out for a short grace window.
  if (p.hp <= 0) {
    if (r.emberCharges > 0) {
      r.emberCharges -= 1;
      p.hp = Math.max(1, r.emberReviveHp);
      ev.setHp(p.hp);
      r.shake = Math.max(r.shake, 12);
      spawnBurst(r, p.pos.x, p.pos.z, '#fbbf24', 26, 13);
      spawnBurst(r, p.pos.x, p.pos.z, '#ffffff', 10, 8);
      addFloat(r, p.pos.x, p.pos.z, `+${Math.max(1, r.emberReviveHp)}`, '#fbbf24');
      for (const m of r.monsters) {
        if (m.dead) continue;
        m.lastAttack = r.clock + 1.4;          // grace period before the next hit
        const d = dist(m.pos, p.pos);
        if (d < 14) {                          // flare shockwave shoves the pack back
          const ux = (m.pos.x - p.pos.x) / (d || 1);
          const uz = (m.pos.z - p.pos.z) / (d || 1);
          m.knockback = { x: ux * 22, z: uz * 22 };
        }
      }
      ev.setMsg('THE SECOND TORCH FLARES В· DEATH DENIED');
      ev.playSound('levelup');
      ev.onHitFlash();
      return;
    }
    ev.playSound('dead');
    ev.onEnd(false);
  }
}

/** Build wall instance positions (world coords) for rendering. */
export function collectWallCells(grid: number[][], gridW: number, gridH: number): Vec2[] {
  const walls: Vec2[] = [];
  for (let z = 0; z < gridH; z++) {
    for (let x = 0; x < gridW; x++) {
      if (grid[z][x] === 1) walls.push(cellToWorld(x, z, gridW, gridH));
    }
  }
  return walls;
}

```

## lib/labyrinthSprites.ts — спрайты (string-art)

```ts
/**
 * Pixel-art sprites for the Abyss Labyrinth, authored as string art.
 *
 * Each sprite is an array of equal-width rows; every character maps to a color
 * in the sprite's palette ('.' / ' ' = transparent). The renderer draws each
 * pixel as a filled Skia rect, so sprites scale crisply (chunky = pixel art)
 * and can be recolored/flashed at draw time. Bigger grids = finer detail at
 * the same on-screen size.
 */
export type Sprite = { rows: string[]; pal: Record<string, string> };

// в”Ђв”Ђ Seeker (player) вЂ” hooded blade-bearer, cyan eyes, flowing cloak в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const SEEKER: Sprite = {
  pal: {
    H: '#241046', // dark hood / self-outline
    h: '#5b21b6', // hood mid
    m: '#7c3aed', // cloak
    M: '#a855f7', // cloak highlight
    F: '#150a2e', // face shadow under the hood
    E: '#22d3ee', // glowing eyes
    r: '#c4b5fd', // torch rim-light
  },
  rows: [
    '.....HHHH.....',
    '...HHhhhhHH...',
    '.rHhhhhhhhhHH.',
    '.HhhFFFFFFhhH.',
    '.HhFEEFFEEFhH.',
    '.HhhFFFFFFhhH.',
    '.HhhhhhhhhhH..',
    '..HmmMMMMmmH..',
    '.HmMmmmmmmMmH.',
    '.rmMmmmmmmMmH.',
    '.HmMmmmmmmMmH.',
    '..HmMMMMMMmH..',
    '..HmmmmmmmmH..',
    '...Hmm..mmH...',
    '...HH....HH...',
  ],
};

// в”Ђв”Ђ Shade (fast wisp) вЂ” tattered spectre, yellow eyes в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const SHADE: Sprite = {
  pal: { D: '#1e1b4b', d: '#312e81', Y: '#fde047', y: '#fef9c3' },
  rows: [
    '...DDDDDD...',
    '..DDddddDD..',
    '.DDddddddDD.',
    '.DddddddddD.',
    '.DdYYddYYdD.',
    '.DdyYddYYydD',
    '.DddddddddD.',
    '..DdddddddD.',
    '..dDddddDd..',
    '...dDddDd...',
    '...d.dd.d...',
    '....d..d....',
  ],
};

// в”Ђв”Ђ Wraith (tall spectre) вЂ” teal ghost, hollow glowing eyes в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const WRAITH: Sprite = {
  pal: { G: '#064e3b', g: '#065f46', c: '#10b981', Y: '#a7f3d0' },
  rows: [
    '....GGGG....',
    '...GggggG...',
    '..GggggggG..',
    '.GgcggggcgG.',
    '.GgYYggYYgG.',
    '.GggggggggG.',
    '.GgcggggcgG.',
    '.GggggggggG.',
    '..GggggggG..',
    '..cGggggGc..',
    '...c.gg.c...',
    '....g..g....',
  ],
};

// в”Ђв”Ђ Crawler (low brute) вЂ” squat red horror, many eyes + legs в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const CRAWLER: Sprite = {
  pal: { R: '#450a0a', r: '#7f1d1d', o: '#ea580c', Y: '#fca5a5' },
  rows: [
    '...RRRRRR...',
    '..RrrrrrrR..',
    '.RrrrrrrrrR.',
    '.RrYrrrrYrR.',
    '.RrrooorrrR.',
    '.RrrrrrrrrR.',
    'RRrrrrrrrrRR',
    'R.R.rrrr.R.R',
    'R...R..R...R',
  ],
};

// в”Ђв”Ђ Brute (elite) вЂ” hulking red bruiser, horns, molten chest в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const BRUTE: Sprite = {
  pal: { R: '#3f0d0d', r: '#7f1d1d', k: '#1c0a0a', O: '#fb923c', o: '#f97316' },
  rows: [
    '.k..........k.',
    '.kk........kk.',
    '..kRRRRRRRRk..',
    '..RRRRRRRRRR..',
    '.RROOrrrrOORR.',
    '.RRRRRRRRRRRR.',
    '.RRrrrrrrrrRR.',
    '.RrrrrrrrrrrR.',
    '.RrroooooorrR.',
    '.RrrrrrrrrrrR.',
    '..RRrrrrrrRR..',
    '..RR.rrrr.RR..',
    '..RR......RR..',
    '.RRR......RRR.',
  ],
};

// в”Ђв”Ђ Guardian (boss) вЂ” towering armoured sentinel with a burning cyan core в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const GUARDIAN: Sprite = {
  pal: {
    k: '#0b0820', // outline
    A: '#1e1b4b', // armour dark
    a: '#3730a3', // armour
    s: '#6366f1', // armour highlight
    C: '#22d3ee', // core glow
    c: '#a5f3fc', // core hot
    O: '#f472b6', // eyes
  },
  rows: [
    '......kAAAAk......',
    '....kAAaaaaAAk....',
    '...kAaaaaaaaaAk...',
    '..kAaaOaaaaOaaAk..',
    '..kAasaaaaaasaAk..',
    '.kAaaaaaaaaaaaaAk.',
    '.kAaaaaCCCCaaaaAk.',
    '.kAaaaCCccCCaaaAk.',
    '.kAaaaCCccCCaaaAk.',
    '.kAaaaaCCCCaaaaAk.',
    '.ksaaaaaaaaaaaask.',
    '.kAssaaaaaaaassAk.',
    '..kAaaaaaaaaaaAk..',
    '..AaaaA....AaaaA..',
    '..AaaaA....AaaaA..',
    '..kAAk......kAAk..',
  ],
};

// в”Ђв”Ђ Loot: artifact (cyan) and treasure (gold) вЂ” faceted, shinier gem в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const GEM: Sprite = {
  pal: { c: '#67e8f9', C: '#22d3ee', e: '#0e7490', w: '#ffffff', l: '#cffafe' },
  rows: [
    '....ww....',
    '..ccllcc..',
    '.cCllllCc.',
    'cCCllwlCCc',
    '.eCCllCCe.',
    '..eCCCCe..',
    '...eCCe...',
    '....ee....',
  ],
};
export const GEM_GOLD: Sprite = {
  pal: { c: '#fde68a', C: '#facc15', e: '#a16207', w: '#ffffff', l: '#fef9c3' },
  rows: GEM.rows,
};

// в”Ђв”Ђ Barrel (explosive) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const BARREL: Sprite = {
  pal: { w: '#78350f', W: '#92400e', h: '#b45309', i: '#f59e0b', k: '#451a03' },
  rows: [
    '.kWWWWk.',
    'kWiWWiWk',
    'WWWWWWWW',
    'WhWWWWhW',
    'WWWWWWWW',
    'kWiWWiWk',
    'WWWWWWWW',
    'WhWWWWhW',
    'WWWWWWWW',
    'kWWWWWWk',
    '.kWWWWk.',
  ],
};

// в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
// UI ICON SPRITES вЂ” hand-authored pixel icons for the RPG chrome.
// The labyrinth UI never uses OS emoji: every button, chip, stat card and
// upgrade card renders one of these through <PixelIcon> (components/LabyrinthUI).
// Rule: every row of a sprite MUST have the same width (validated offline).
// в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ

// в”Ђв”Ђ Sword вЂ” upright runeblade, gold crossguard, violet grip в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_SWORD: Sprite = {
  pal: {
    k: '#0b0820', b: '#cbd5e1', B: '#f1f5f9',
    g: '#facc15', G: '#b45309', h: '#7c3aed', p: '#a855f7', P: '#e9d5ff',
  },
  rows: [
    '......b......',
    '.....kbB.....',
    '.....kbB.....',
    '.....kbB.....',
    '.....kbB.....',
    '.....kbB.....',
    '....kkbBk....',
    '.ggkkkbBkkgg.',
    '..gggGgGggg..',
    '.....khk.....',
    '.....khk.....',
    '....kpPpk....',
    '.....kpk.....',
  ],
};

// в”Ђв”Ђ Boot вЂ” swift greave, cyan leather в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_BOOT: Sprite = {
  pal: { k: '#0b0820', c: '#0e7490', C: '#22d3ee', s: '#164e63' },
  rows: [
    '...kkkk.....',
    '...kcCck....',
    '...kcCck....',
    '...kcCck....',
    '...kcCck....',
    '...kcCckk...',
    '...kcCccck..',
    '..kkcCcccck.',
    '.kccccccccck',
    '.kkkkkkkkkk.',
    '.ssssssssss.',
  ],
};

// в”Ђв”Ђ Torch вЂ” wall-brand with a warm flame в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_TORCH: Sprite = {
  pal: { w: '#ff9a3c', W: '#ffcf6a', F: '#ffe6a0', f: '#fffbeb', k: '#0b0820', h: '#92400e' },
  rows: [
    '....wWw....',
    '...wWFWw...',
    '...WFfFW...',
    '...wWFWw...',
    '....kkk....',
    '....khk....',
    '....khk....',
    '....khk....',
    '....khk....',
    '...kkhkk...',
  ],
};

// в”Ђв”Ђ Heart aflame вЂ” abyssal vigor в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_HEART: Sprite = {
  pal: { k: '#0b0820', R: '#dc2626', r: '#fda4af', O: '#fb923c', o: '#fef3c7' },
  rows: [
    '.kkk....kkk.',
    'kRRRk..kRRRk',
    'kRrRRkkRRrRk',
    'kRRRRRRRRRRk',
    'kRRROOORRRRk',
    '.kRROoORRRk.',
    '..kRROORRk..',
    '...kRRRRk...',
    '....kRRk....',
    '.....kk.....',
  ],
};

// в”Ђв”Ђ Candle вЂ” the Second Torch (survive one lethal hit) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_CANDLE: Sprite = {
  pal: { f: '#fffbeb', w: '#ff9a3c', F: '#ffcf6a', k: '#0b0820', C: '#f472b6', c: '#fbcfe8', G: '#b45309' },
  rows: [
    '.....f.....',
    '....wFw....',
    '....wFw....',
    '.....k.....',
    '...kCcCk...',
    '...kCcCk...',
    '...kCCCk...',
    '...kCcCk...',
    '...kCCCk...',
    '..kkCCCkk..',
    '..kGGGGGk..',
    '...kkkkk...',
  ],
};

// в”Ђв”Ђ Trophy вЂ” golden chalice for the best run в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_TROPHY: Sprite = {
  pal: { k: '#0b0820', G: '#b45309', g: '#facc15', w: '#fef9c3' },
  rows: [
    '.kkkkkkkkkk.',
    '.kGggwgggGk.',
    '.kGggwgggGk.',
    '..kGggggGk..',
    '...kGggGk...',
    '....kGGk....',
    '.....kk.....',
    '....kggk....',
    '...kGggGk...',
    '..kGggggGk..',
    '..kkkkkkkk..',
  ],
};

// в”Ђв”Ђ Star sparkle вЂ” artifacts в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_STAR: Sprite = {
  pal: { w: '#22d3ee', W: '#a5f3fc', f: '#ffffff' },
  rows: [
    '.....w.....',
    '.....W.....',
    '....wWw....',
    '.wWWWfWWWw.',
    '....wWw....',
    '.....W.....',
    '.....w.....',
  ],
};

// в”Ђв”Ђ Skull вЂ” the Abyss claims you в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_SKULL: Sprite = {
  pal: { k: '#0b0820', b: '#e7e5e4', r: '#f87171', t: '#78716c' },
  rows: [
    '....kkkkkkkk....',
    '..kkbbbbbbbbkk..',
    '..kbbbbbbbbbbk..',
    '.kbbbbbbbbbbbbk.',
    '.kbbkkkbbkkkbbk.',
    '.kbbkrkbbkrkbbk.',
    '.kbbkkkbbkkkbbk.',
    '.kbbbbbkkbbbbbk.',
    '..kbbbbbbbbbbk..',
    '..kbtbtbtbtbbk..',
    '...kkkkkkkkkk...',
  ],
};

// в”Ђв”Ђ Portal swirl вЂ” escape / the way out в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_PORTAL: Sprite = {
  pal: { c: '#0e7490', C: '#22d3ee', w: '#67e8f9', W: '#e0f2fe' },
  rows: [
    '.....cccccc.....',
    '...cc......cc...',
    '..c...CCCC...c..',
    '.c..CC....CC..c.',
    '.c..C..ww..C..c.',
    'c..C..wWWw..C..c',
    'c..C..wWWw..C..c',
    '.c..C..ww..C..c.',
    '.c..CC....CC..c.',
    '..c...CCCC...c..',
    '...cc......cc...',
    '.....cccccc.....',
  ],
};

// в”Ђв”Ђ Tent вЂ” Seeker's Camp в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_TENT: Sprite = {
  pal: { k: '#0b0820', f: '#facc15', p: '#9d174d', P: '#ec4899' },
  rows: [
    '.....kf.....',
    '.....kk.....',
    '....kpPk....',
    '...kpPPpk...',
    '..kpPPPPpk..',
    '..kpPkkPpk..',
    '.kpPPkkPPpk.',
    '.kpPPkkPPpk.',
    'kppPPkkPPppk',
    'kkkkkkkkkkkk',
  ],
};

// в”Ђв”Ђ Lightning bolt вЂ” energy cost в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_BOLT: Sprite = {
  pal: { k: '#78350f', E: '#fde047' },
  rows: [
    '.....kEE',
    '....kEE.',
    '...kEE..',
    '..kEEEEE',
    '....kEE.',
    '...kEE..',
    '..kEE...',
    '.kEE....',
    'kEE.....',
  ],
};

// в”Ђв”Ђ Lock вЂ” feature gated / preview state в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_LOCK: Sprite = {
  pal: { m: '#94a3b8', k: '#0b0820', s: '#64748b', K: '#0f172a' },
  rows: [
    '...mmmm...',
    '..mm..mm..',
    '..mm..mm..',
    '.kkkkkkkk.',
    '.kssssssk.',
    '.kssKKssk.',
    '.kssKKssk.',
    '.kssssssk.',
    '.kkkkkkkk.',
  ],
};

// в”Ђв”Ђ Coin / ORB вЂ” the in-game currency в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_ORB: Sprite = {
  pal: { k: '#78350f', g: '#facc15', w: '#fef9c3', G: '#b45309', D: '#f59e0b' },
  rows: [
    '...kkkk...',
    '..kggggk..',
    '.kgwwgggk.',
    '.kggDDggk.',
    '.kggDDggk.',
    '.kgggggGk.',
    '..kggGGk..',
    '...kkkk...',
  ],
};

// в”Ђв”Ђ Abyss Lantern вЂ” iron cage, spectral cyan flame (SOL premium) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_LANTERN: Sprite = {
  pal: { k: '#0b0820', G: '#475569', c: '#22d3ee', C: '#d9f9ff' },
  rows: [
    '.....kk.....',
    '....k..k....',
    '....kkkk....',
    '..kkGGGGkk..',
    '..kGccccGk..',
    '..kGcCCcGk..',
    '..kGcCCcGk..',
    '..kGccccGk..',
    '..kkGGGGkk..',
    '....kkkk....',
    '.....kk.....',
  ],
};

// в”Ђв”Ђ Dash вЂ” double wind chevrons в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const ICON_DASH: Sprite = {
  pal: { C: '#67e8f9' },
  rows: [
    '.CC....CC...',
    '..CC....CC..',
    '...CC....CC.',
    '....CC....CC',
    '...CC....CC.',
    '..CC....CC..',
    '.CC....CC...',
  ],
};

/** Normal-monster sprite variants вЂ” indexed by `Monster.variant` for variety. */
export const SHADE_VARIANTS: Sprite[] = [SHADE, WRAITH, CRAWLER];

/** Longest row width of a sprite (for centering). */
export function spriteW(s: Sprite): number {
  return s.rows.reduce((m, r) => Math.max(m, r.length), 0);
}

```

## components/LabyrinthUI.tsx — UI-примитивы

```tsx
/**
 * LabyrinthUI вЂ” shared ornate RPG primitives for the Abyss Labyrinth chrome.
 *
 * AAA rule: the labyrinth UI never renders OS emoji. Every glyph is a
 * hand-authored pixel sprite (lib/labyrinthSprites) drawn through <PixelIcon>,
 * a tiny STATIC Skia canvas вЂ” the picture is recorded once per (sprite, size)
 * with useMemo, so icons cost nothing per frame.
 *
 * The chrome language is "engraved dark stone": an outer glow line, an inner
 * parchment hairline, corner accents, and a subtle vertical gradient for depth
 * (expo-linear-gradient is already a dependency). 60fps discipline: no RAF
 * loops live here; all motion is native-driver Animated (transform/opacity).
 */
import React, { useMemo, useRef } from 'react';
import {
  Animated, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Picture, Skia, createPicture } from '@shopify/react-native-skia';
import { spriteW, type Sprite } from '../lib/labyrinthSprites';

// в”Ђв”Ђ tier / rarity language (Seeker's Camp upgrade levels) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// L0-1 slate В· L2 green В· L3 blue В· L4 purple В· L5 gold вЂ” the classic loot ramp.
export const TIER_COLORS = ['#64748B', '#64748B', '#22C55E', '#3B82F6', '#A855F7', '#FACC15'] as const;
export const TIER_NAMES  = ['COMMON', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;

export function tierColor(level: number): string {
  return TIER_COLORS[Math.max(0, Math.min(TIER_COLORS.length - 1, level))];
}
export function tierName(level: number): string {
  return TIER_NAMES[Math.max(0, Math.min(TIER_NAMES.length - 1, level))];
}

// в”Ђв”Ђ <PixelIcon> вЂ” a sprite as a static Skia canvas в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export const PixelIcon = React.memo(function PixelIcon({ sprite, size, style }: {
  sprite: Sprite;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  // Recorded once: per-pixel rects over a transparent background. The canvas
  // never re-renders, so a screen full of icons stays free at runtime.
  const pic = useMemo(() => createPicture((canvas) => {
    const w = spriteW(sprite);
    const h = sprite.rows.length;
    const p = size / Math.max(w, h);            // pixel size so the sprite fits the box
    const x0 = (size - w * p) / 2;
    const y0 = (size - h * p) / 2;
    const paint = Skia.Paint();
    for (let r = 0; r < h; r++) {
      const row = sprite.rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.' || ch === ' ') continue;
        const color = sprite.pal[ch];
        if (!color) continue;
        paint.setColor(Skia.Color(color));
        canvas.drawRect(Skia.XYWHRect(x0 + c * p, y0 + r * p, p + 0.4, p + 0.4), paint);
      }
    }
  }, { x: 0, y: 0, width: size, height: size }), [sprite, size]);

  return (
    <Canvas style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Picture picture={pic} />
    </Canvas>
  );
});

// в”Ђв”Ђ <OrnateCard> вЂ” layered engraved frame в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// Outer glow line в†’ depth gradient в†’ inner parchment hairline в†’ corner accents.
export function OrnateCard({ glow = '#7C3AED', radius = 18, style, contentStyle, children }: {
  glow?: string;                       // 6-digit hex; alpha suffixes are appended
  radius?: number;
  style?: StyleProp<ViewStyle>;        // outer frame (size / margins / shadow strength)
  contentStyle?: StyleProp<ViewStyle>; // inner padding / layout
  children?: React.ReactNode;
}) {
  return (
    <View style={[u.cardOuter, { borderRadius: radius, borderColor: glow + '4D', shadowColor: glow }, style]}>
      {/* dark-stone depth: near-black base lifting to a faint violet top edge */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius - 1, overflow: 'hidden' }]}>
        <LinearGradient colors={['#151030', '#0B0722', '#070512'] as const} style={StyleSheet.absoluteFill} />
      </View>
      {/* inner parchment hairline */}
      <View pointerEvents="none" style={[u.cardHairline, { borderRadius: Math.max(4, radius - 4) }]} />
      <View style={[u.cardContent, contentStyle]}>{children}</View>
      {/* corner accents */}
      <View pointerEvents="none" style={[u.corner, u.cornerTL, { borderColor: glow + 'B3' }]} />
      <View pointerEvents="none" style={[u.corner, u.cornerTR, { borderColor: glow + 'B3' }]} />
      <View pointerEvents="none" style={[u.corner, u.cornerBL, { borderColor: glow + 'B3' }]} />
      <View pointerEvents="none" style={[u.corner, u.cornerBR, { borderColor: glow + 'B3' }]} />
    </View>
  );
}

// в”Ђв”Ђ <RuneButton> вЂ” circular rune-ring action button в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const RUNE_TICKS = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export function RuneButton({ sprite, label, color, size = 82, onPressIn, disabled = false, style }: {
  sprite: Sprite;
  label: string;
  color: string;                       // 6-digit hex
  size?: number;
  onPressIn?: () => void;              // fired on touch-down (game inputs are press-in)
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const flash = press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.26] });
  const down = () => {
    onPressIn?.();
    Animated.timing(press, { toValue: 1, duration: 50, useNativeDriver: true }).start();
  };
  const up = () => {
    Animated.timing(press, { toValue: 0, duration: 180, useNativeDriver: true }).start();
  };
  const inner = size - 18;
  return (
    <TouchableOpacity activeOpacity={1} onPressIn={down} onPressOut={up} disabled={disabled} style={style}>
      <Animated.View style={[u.runeRoot, {
        width: size, height: size, borderRadius: size / 2,
        borderColor: color + '73', backgroundColor: color + '17',
        shadowColor: color, transform: [{ scale }],
      }]}>
        {/* rune ticks around the ring */}
        {RUNE_TICKS.map((deg) => (
          <View key={deg} pointerEvents="none"
            style={[StyleSheet.absoluteFill, u.runeTickWrap, { transform: [{ rotate: `${deg}deg` }] }]}>
            <View style={[u.runeTick, { backgroundColor: color + '99' }]} />
          </View>
        ))}
        {/* inner disc: icon + small-caps label */}
        <View style={[u.runeInner, {
          width: inner, height: inner, borderRadius: inner / 2, borderColor: color + '59',
        }]}>
          <PixelIcon sprite={sprite} size={size * 0.34} />
          <Text style={u.runeLbl}>{label}</Text>
        </View>
        {/* pressed flash */}
        <Animated.View pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: color, opacity: flash }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// в”Ђв”Ђ <TierPips> вЂ” diamond upgrade pips, tinted by the current tier в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function TierPips({ level, max = 5, size = 8 }: {
  level: number;
  max?: number;
  size?: number;
}) {
  const c = tierColor(level);
  return (
    <View style={u.pipRow}>
      {Array.from({ length: max }).map((_, i) => {
        const lit = i < level;
        return (
          <View key={i} style={[u.pipDiamond, {
            width: size, height: size,
            backgroundColor: lit ? c : 'rgba(100,116,139,0.14)',
            borderColor: lit ? c : 'rgba(100,116,139,0.45)',
          }, lit && { shadowColor: c, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }]} />
        );
      })}
    </View>
  );
}

// в”Ђв”Ђ <StatMedallion> вЂ” ornate mini stat card (icon / value / small-caps) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function StatMedallion({ sprite, value, label, color = '#7C3AED', minWidth = 98 }: {
  sprite: Sprite;
  value: string;
  label: string;
  color?: string;                      // 6-digit hex
  minWidth?: number;
}) {
  return (
    <OrnateCard glow={color} radius={14} style={{ minWidth }} contentStyle={u.medContent}>
      <View style={[u.medIconRing, { borderColor: color + '5E', backgroundColor: color + '14' }]}>
        <PixelIcon sprite={sprite} size={19} />
      </View>
      <Text style={u.medVal}>{value}</Text>
      <Text style={u.medLbl}>{label}</Text>
    </OrnateCard>
  );
}

// в”Ђв”Ђ <EngravedTitle> вЂ” dual-shadow display type (glow bloom + engraved ink) в”Ђв”Ђв”Ђ
// RN Text takes one shadow, so we stack two perfectly-aligned Texts: a glow
// underlay (wide soft shadow) and an ink overlay (tight dark bite below).
export function EngravedTitle({
  text, size = 22, color = '#F5F3FF', glow = '#7C3AED', letterSpacing = 3, lineHeight, align = 'center', style,
}: {
  text: string;
  size?: number;
  color?: string;
  glow?: string;
  letterSpacing?: number;
  lineHeight?: number;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}) {
  const base: TextStyle = {
    fontSize: size, fontWeight: '900', letterSpacing, textAlign: align,
    ...(lineHeight !== undefined ? { lineHeight } : null),
  };
  return (
    <View style={style}>
      <Text style={[base, u.titleUnder, { color: glow, textShadowColor: glow }]}>{text}</Text>
      <Text style={[base, u.titleOver, { color }]}>{text}</Text>
    </View>
  );
}

// в”Ђв”Ђ <OrnamentRule> вЂ” line В· diamond В· line divider в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function OrnamentRule({ color = '#7C3AED', width = 150, style }: {
  color?: string;                      // 6-digit hex
  width?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[u.ruleRow, { width }, style]}>
      <View style={[u.ruleLine, { backgroundColor: color + '73' }]} />
      <View style={[u.ruleDiamond, { backgroundColor: color, shadowColor: color }]} />
      <View style={[u.ruleLine, { backgroundColor: color + '73' }]} />
    </View>
  );
}

const u = StyleSheet.create({
  // OrnateCard
  cardOuter:    { borderWidth: 1.5, backgroundColor: '#070512',
                  shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  cardHairline: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
                  borderWidth: 1, borderColor: 'rgba(226,232,240,0.07)' },
  cardContent:  { padding: 12 },
  corner:       { position: 'absolute', width: 10, height: 10 },
  cornerTL:     { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 3 },
  cornerTR:     { top: 4, right: 4, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 3 },
  cornerBL:     { bottom: 4, left: 4, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 3 },
  cornerBR:     { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 3 },

  // RuneButton
  runeRoot:     { borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                  shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  runeTickWrap: { alignItems: 'center' },
  runeTick:     { width: 2, height: 5, marginTop: 2, borderRadius: 1 },
  runeInner:    { borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(5,3,16,0.55)' },
  runeLbl:      { color: '#E2E8F0', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },

  // TierPips
  pipRow:       { flexDirection: 'row', gap: 5, paddingHorizontal: 2 },
  pipDiamond:   { borderWidth: 1, borderRadius: 1.5, transform: [{ rotate: '45deg' }] },

  // StatMedallion
  medContent:   { alignItems: 'center', paddingVertical: 11, paddingHorizontal: 10 },
  medIconRing:  { width: 32, height: 32, borderRadius: 16, borderWidth: 1,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  medVal:       { color: '#F5F3FF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  medLbl:       { color: '#8B7BB8', fontSize: 8.5, fontWeight: '800', letterSpacing: 1.8, marginTop: 3 },

  // EngravedTitle
  titleUnder:   { position: 'absolute', left: 0, right: 0, top: 0,
                  textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  titleOver:    { textShadowColor: 'rgba(0,0,0,0.85)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 2 } },

  // OrnamentRule
  ruleRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleLine:     { flex: 1, height: 1.5, borderRadius: 1 },
  ruleDiamond:  { width: 7, height: 7, borderRadius: 1.5, transform: [{ rotate: '45deg' }],
                  shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
});

```

## components/LabyrinthOfAbyss.tsx — Skia-рендер + весь UI

```tsx
/**
 * ABYSS LABYRINTH вЂ” 2D pixel-art dungeon crawler (Skia renderer).
 *
 * The 3D expo-gl build rendered black on the emulator (EGL_BAD_MATCH), so this
 * is a top-down 2.5D rewrite on react-native-skia: a torch-lit maze with fog of
 * war, pixel-art sprites, particle juice and screen shake вЂ” reliable on every
 * device and iterable with live visual feedback.
 *
 * All gameplay lives in lib/labyrinth.ts (stepSimulation); this file only reads
 * state to draw and owns the RN overlay HUD (joystick, buttons, menus).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, PanResponder, Platform, ScrollView, StyleSheet, Text, TouchableOpacity,
  View, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Canvas, Picture, createPicture, Skia,
  TileMode, BlendMode, BlurStyle, PaintStyle,
  matchFont, type SkCanvas, type SkFont, type SkImage, type SkPaint, type SkPicture, type SkSurface,
} from '@shopify/react-native-skia';
import * as L from '../lib/labyrinth';
import {
  SEEKER, SHADE_VARIANTS, BRUTE, GUARDIAN, GEM, GEM_GOLD, BARREL, spriteW, type Sprite,
  ICON_BOLT, ICON_BOOT, ICON_CANDLE, ICON_DASH, ICON_HEART, ICON_LANTERN, ICON_LOCK,
  ICON_ORB, ICON_PORTAL, ICON_SKULL, ICON_STAR, ICON_SWORD, ICON_TENT, ICON_TORCH, ICON_TROPHY,
} from '../lib/labyrinthSprites';
import {
  EngravedTitle, OrnamentRule, OrnateCard, PixelIcon, RuneButton, StatMedallion, TierPips,
  tierColor, tierName,
} from './LabyrinthUI';

const TILE = 46;           // screen px per maze cell
const CELL = L.CELL_SIZE;  // world units per cell

// в”Ђв”Ђ fonts (system, synchronous) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function tryFont(size: number, weight: '400' | '700' | '900'): SkFont | null {
  try {
    return matchFont({
      fontFamily: Platform.select({ android: 'sans-serif', default: 'Helvetica' }) as string,
      fontSize: size, fontStyle: 'normal', fontWeight: weight,
    });
  } catch { return null; }
}
const FONT_FLOAT = tryFont(19, '900');

// в”Ђв”Ђ reusable paints в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
const px = () => Skia.Paint();
const scratch = px();
const glowPaint = px();
glowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 8, true));

function col(c: string) { return Skia.Color(c); }

// в”Ђв”Ђ pixel-sprite draw в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function drawSprite(
  canvas: SkCanvas, sprite: Sprite, cx: number, cy: number,
  target: number, flipX: boolean, tint?: string, hideEyes = false,
) {
  const w = spriteW(sprite);
  const h = sprite.rows.length;
  const p = target / w;                     // px size so sprite spans `target`
  const x0 = cx - (w * p) / 2;
  const y0 = cy - (h * p) / 2;
  for (let r = 0; r < h; r++) {
    const row = sprite.rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      // blink: draw the eyes with the face-shadow colour for a few frames
      let color = tint ?? sprite.pal[ch];
      if (hideEyes && ch === 'E') color = tint ?? sprite.pal['F'] ?? '';
      if (!color) continue;
      scratch.setColor(col(color));
      const dc = flipX ? (w - 1 - c) : c;
      canvas.drawRect(Skia.XYWHRect(x0 + dc * p, y0 + r * p, p + 0.6, p + 0.6), scratch);
    }
  }
}

/**
 * Sprite draw wrapped in a squash/stretch + lean transform around its centre вЂ”
 * the basis of the procedural character animation (walk bounce, breathing,
 * attack lunge, hit recoil). `sx`/`sy` scale, `lean` shears horizontally.
 */
function drawSpriteA(
  canvas: SkCanvas, sprite: Sprite, cx: number, cy: number,
  target: number, flipX: boolean, tint: string | undefined,
  sx: number, sy: number, lean: number, hideEyes: boolean,
) {
  canvas.save();
  canvas.translate(cx, cy);
  if (lean) canvas.skew(lean, 0);
  canvas.scale(sx, sy);
  canvas.translate(-cx, -cy);
  drawSprite(canvas, sprite, cx, cy, target, flipX, tint, hideEyes);
  canvas.restore();
}

// deterministic per-cell variation
function hash(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const FLOOR_SHADES = ['#241a44', '#2b2052', '#1e1638', '#322459'];
const WALL_BASE = '#4a3a7a';
const WALL_TOP  = '#6b53a8';
const WALL_DARK = '#241a40';
const WALL_SEAM = '#2f2456';
const FLOOR_CHIP = '#31265c';    // lighter stone chip that catches the firelight
const MOSS       = '#2f6b4a';    // faint lichen near walls

// в”Ђв”Ђ the whole scene, drawn imperatively each frame в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
function drawScene(canvas: SkCanvas, run: L.RunState, W: number, H: number, lantern = false) {
  // Abyss Lantern (SOL cosmetic) recolours the seeker's flame to spectral cyan;
  // wall sconces stay warm so the grade keeps its warm/cool contrast.
  const warmStops  = lantern ? ['#9fdcff00', '#8fd2ff', '#66b8ff00'] : ['#ffcf8a00', '#ffbb70', '#ff9e4d00'];
  const haloStops  = lantern ? ['#d9f4ff00', '#c9ecff', '#bfe6ff00'] : ['#ffe8c000', '#ffdca6', '#ffd9a000'];
  const emberColA  = lantern ? '#67e8f9' : '#ff9a3c';
  const emberColB  = lantern ? '#c2f0ff' : '#ffcf6a';
  const p = run.player;
  const ox = ((run.gridW - 1) * CELL) / 2;
  const oz = ((run.gridH - 1) * CELL) / 2;
  const pcx = (p.pos.x + ox) / CELL;
  const pcz = (p.pos.z + oz) / CELL;

  const sx = run.shake > 0 ? (Math.random() * 2 - 1) * run.shake : 0;
  const sy = run.shake > 0 ? (Math.random() * 2 - 1) * run.shake : 0;
  const camX = W / 2 + sx;
  const camY = H / 2 + sy;

  // world в†’ screen
  const wsx = (wx: number) => camX + ((wx + ox) / CELL - pcx) * TILE;
  const wsy = (wz: number) => camY + ((wz + oz) / CELL - pcz) * TILE;
  // cell centre в†’ screen
  const csx = (c: number) => camX + (c + 0.5 - pcx) * TILE;
  const csy = (c: number) => camY + (c + 0.5 - pcz) * TILE;

  // background
  canvas.drawColor(col('#04060f'));

  // torch flicker (base radius comes from the run вЂ” camp upgrades widen it)
  const flick = Math.sin(run.clock * 9) * 0.2 + Math.sin(run.clock * 23) * 0.1;
  const torchCells = run.torchCells + flick;      // radius in cells
  const torchR = torchCells * TILE;

  // only draw cells near the torch (everything else is black anyway)
  const vis = Math.ceil(torchCells) + 2;
  const cx0 = Math.max(0, Math.floor(pcx) - vis);
  const cx1 = Math.min(run.gridW - 1, Math.ceil(pcx) + vis);
  const cz0 = Math.max(0, Math.floor(pcz) - vis);
  const cz1 = Math.min(run.gridH - 1, Math.ceil(pcz) + vis);

  // в”Ђв”Ђ floor (ancient stone, ambient-occluded at the walls) в”Ђв”Ђ
  for (let cz = cz0; cz <= cz1; cz++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      if (run.grid[cz][cx] === 1) continue;          // wall tiles are drawn opaque below
      const scx = csx(cx), scy = csy(cz);
      const x = scx - TILE / 2, y = scy - TILE / 2;
      const shade = FLOOR_SHADES[Math.floor(hash(cx, cz) * FLOOR_SHADES.length)];
      scratch.setColor(col(shade));
      canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, TILE + 0.6), scratch);
      // tile grout вЂ” thin dark lines on right + bottom read the floor as tiles
      scratch.setColor(col('#0d0a1c'));
      canvas.drawRect(Skia.XYWHRect(x, scy + TILE / 2 - 1, TILE + 0.6, 1.5), scratch);
      canvas.drawRect(Skia.XYWHRect(scx + TILE / 2 - 1, y, 1.5, TILE + 0.6), scratch);
      // stone detail вЂ” dark crack or a light chip that catches the torch
      const hf = hash(cx * 3, cz * 7);
      if (hf > 0.82) {
        scratch.setColor(col('#0c0a18'));
        canvas.drawRect(Skia.XYWHRect(scx - 4, scy + 2, 8, 3), scratch);
      } else if (hf < 0.09) {
        scratch.setColor(col(FLOOR_CHIP));
        canvas.drawRect(Skia.XYWHRect(scx + 5, scy - 6, 4, 3), scratch);
      }
      // ambient occlusion: soft dark contact shadow on edges that touch a wall
      scratch.setColor(col('#000000'));
      scratch.setAlphaf(0.36);
      if (run.grid[cz]?.[cx - 1] === 1) canvas.drawRect(Skia.XYWHRect(x, y, 7, TILE + 0.6), scratch);
      if (run.grid[cz]?.[cx + 1] === 1) canvas.drawRect(Skia.XYWHRect(x + TILE - 6, y, 7, TILE + 0.6), scratch);
      if (run.grid[cz - 1]?.[cx] === 1) canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, 7), scratch);
      if (run.grid[cz + 1]?.[cx] === 1) canvas.drawRect(Skia.XYWHRect(x, y + TILE - 6, TILE + 0.6, 7), scratch);
      // faint moss where two walls meet a corner
      if (hf > 0.6 && hf < 0.66 && run.grid[cz + 1]?.[cx] === 1) {
        scratch.setColor(col(MOSS));
        scratch.setAlphaf(0.5);
        canvas.drawRect(Skia.XYWHRect(scx - 6, scy + TILE / 2 - 5, 12, 4), scratch);
      }
      scratch.setAlphaf(1);
    }
  }

  // в”Ђв”Ђ walls (chunky bricks with a lit top face) в”Ђв”Ђ
  for (let cz = cz0; cz <= cz1; cz++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      if (run.grid[cz][cx] !== 1) continue;
      const scx = csx(cx), scy = csy(cz);
      const x = scx - TILE / 2, y = scy - TILE / 2;
      // cast shadow onto the floor below вЂ” fakes block height
      if (cz + 1 <= run.gridH - 1 && run.grid[cz + 1][cx] !== 1) {
        scratch.setColor(col('#00000066'));
        canvas.drawRect(Skia.XYWHRect(x + 3, y + TILE, TILE + 0.6, 8), scratch);
      }
      // body
      scratch.setColor(col(hash(cx, cz) > 0.5 ? WALL_BASE : '#3a2e5e'));
      canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, TILE + 0.6), scratch);
      // lit top strip
      scratch.setColor(col(WALL_TOP));
      canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, 7), scratch);
      // left edge highlight (rim)
      scratch.setColor(col('#5a4590'));
      canvas.drawRect(Skia.XYWHRect(x, y, 3, TILE + 0.6), scratch);
      // dark base
      scratch.setColor(col(WALL_DARK));
      canvas.drawRect(Skia.XYWHRect(x, y + TILE - 5, TILE + 0.6, 6), scratch);
      // brick seam
      scratch.setColor(col(WALL_SEAM));
      canvas.drawRect(Skia.XYWHRect(x, y + TILE / 2 - 1, TILE + 0.6, 2), scratch);
      canvas.drawRect(Skia.XYWHRect(x + TILE / 2 - 1, y, 2, TILE / 2), scratch);
    }
  }

  // в”Ђв”Ђ wall sconces (flickering torches that punctuate the dark) в”Ђв”Ђ
  // Chosen deterministically from the grid: a wall with open floor directly
  // below it can hold a torch that faces the camera and spills light forward.
  for (let cz = cz0; cz <= cz1; cz++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      if (run.grid[cz][cx] !== 1) continue;
      if (!(cz + 1 <= run.gridH - 1 && run.grid[cz + 1][cx] === 0)) continue;
      if (hash(cx * 7 + 3, cz * 13 + 5) < 0.80) continue;     // ~1 in 5 eligible walls
      const scx = csx(cx);
      const baseY = csy(cz) + TILE * 0.28;                    // low on the wall face
      const seed = cx * 2.3 + cz * 1.7;
      const fl = 0.62 + 0.30 * Math.sin(run.clock * 11 + seed) + 0.12 * Math.sin(run.clock * 27 + seed * 2);
      // warm light pool spilling onto the floor below the torch
      const pool = px();
      pool.setBlendMode(BlendMode.Plus);
      pool.setShader(Skia.Shader.MakeRadialGradient(
        { x: scx, y: baseY + TILE * 0.55 }, TILE * (1.7 + fl * 0.35),
        [col('#ffa64d'), col('#ff8c3a00')], [0, 1], TileMode.Clamp,
      ));
      pool.setAlphaf(0.42 * fl);
      canvas.drawRect(Skia.XYWHRect(scx - TILE * 2.4, baseY - TILE, TILE * 4.8, TILE * 3.8), pool);
      // iron bracket
      scratch.setColor(col('#1c1208'));
      canvas.drawRect(Skia.XYWHRect(scx - 2, baseY, 4, 11), scratch);
      // flame вЂ” glow halo, warm body, hot tip (height flickers)
      const fh = 10 + fl * 7;
      glowPaint.setColor(col('#ff7a1a'));
      glowPaint.setAlphaf(0.9);
      canvas.drawCircle(scx, baseY - fh * 0.4, 5 + fl * 2, glowPaint);
      scratch.setColor(col('#ffb43c'));
      canvas.drawCircle(scx, baseY - fh * 0.4, 3.2, scratch);
      scratch.setColor(col('#ffe6a0'));
      canvas.drawCircle(scx, baseY - fh * 0.58, 1.7, scratch);
    }
  }

  // в”Ђв”Ђ traps (arcane sigils etched into the floor) в”Ђв”Ђ
  for (const t of run.traps) {
    if (t.triggered) continue;
    const dx = t.pos.x - p.pos.x, dz = t.pos.z - p.pos.z;
    if (dx * dx + dz * dz > (torchR / TILE * CELL) ** 2) continue;
    const tx = wsx(t.pos.x), ty = wsy(t.pos.z);
    const pulse = 0.45 + 0.35 * Math.sin(run.clock * 3.5 + t.id);
    const R = TILE * 0.34;
    // menacing bloom underneath
    glowPaint.setColor(col('#ef4444'));
    glowPaint.setAlphaf(0.16 + 0.28 * pulse);
    canvas.drawCircle(tx, ty, R * 1.5, glowPaint);
    // sigil strokes
    scratch.setStyle(PaintStyle.Stroke);
    scratch.setStrokeWidth(2.2);
    scratch.setColor(col('#f87171'));
    scratch.setAlphaf(0.5 + 0.4 * pulse);
    canvas.drawCircle(tx, ty, R, scratch);
    // two counter-rotating triangles = a slowly spinning arcane star
    const tri = (rot: number, rad: number) => {
      for (let i = 0; i < 3; i++) {
        const a0 = rot + (i / 3) * Math.PI * 2;
        const a1 = rot + ((i + 1) / 3) * Math.PI * 2;
        canvas.drawLine(tx + Math.cos(a0) * rad, ty + Math.sin(a0) * rad,
                        tx + Math.cos(a1) * rad, ty + Math.sin(a1) * rad, scratch);
      }
    };
    tri(run.clock * 0.5 + t.id, R * 0.82);
    tri(-run.clock * 0.5 + t.id, R * 0.82);
    scratch.setStyle(PaintStyle.Fill);
    // molten core
    scratch.setColor(col('#fecaca'));
    scratch.setAlphaf(pulse);
    canvas.drawCircle(tx, ty, 2.6, scratch);
    scratch.setAlphaf(1);
  }

  // в”Ђв”Ђ barrels в”Ђв”Ђ
  for (const b of run.barrels) {
    if (b.exploded) continue;
    const dx = b.pos.x - p.pos.x, dz = b.pos.z - p.pos.z;
    if (dx * dx + dz * dz > (torchR / TILE * CELL) ** 2) continue;
    // shadow
    scratch.setColor(col('#00000066'));
    canvas.drawOval(Skia.XYWHRect(wsx(b.pos.x) - 16, wsy(b.pos.z) + 12, 32, 10), scratch);
    drawSprite(canvas, BARREL, wsx(b.pos.x), wsy(b.pos.z), TILE * 0.78, false);
  }

  // в”Ђв”Ђ loot (bloom + bob + rising sparkle) в”Ђв”Ђ
  for (const it of run.items) {
    if (it.collected) continue;
    const dx = it.pos.x - p.pos.x, dz = it.pos.z - p.pos.z;
    if (dx * dx + dz * dz > (torchR / TILE * CELL) ** 2) continue;
    const gx = wsx(it.pos.x);
    const gy = wsy(it.pos.z) + Math.sin(run.clock * 3 + it.id) * 5;
    const gem = it.type === 'artifact' ? GEM : GEM_GOLD;
    const glow = it.type === 'artifact' ? '#22d3ee' : '#facc15';
    const pulse = 0.5 + 0.25 * Math.sin(run.clock * 4 + it.id);
    // ground-glow pool so the gem lights its tile
    glowPaint.setColor(col(glow));
    glowPaint.setAlphaf(0.24 + 0.16 * pulse);
    canvas.drawCircle(gx, wsy(it.pos.z) + 4, TILE * 0.5, glowPaint);
    // hot halo around the gem
    glowPaint.setAlphaf(0.45 * pulse);
    canvas.drawCircle(gx, gy, TILE * 0.26, glowPaint);
    const spin = Math.max(0.2, Math.abs(Math.cos(run.clock * 2 + it.id)));   // slow horizontal spin
    drawSpriteA(canvas, gem, gx, gy, TILE * 0.5, false, undefined, spin, 1, 0, false);
    // rising sparkles
    scratch.setBlendMode(BlendMode.Plus);
    scratch.setColor(col('#ffffff'));
    for (let k = 0; k < 3; k++) {
      const t2 = (run.clock * 0.6 + it.id + k * 0.33) % 1;
      scratch.setAlphaf((1 - t2) * 0.6);
      canvas.drawCircle(gx + Math.sin((it.id + k) * 2.1) * 8, gy - t2 * TILE * 0.7, 1.4, scratch);
    }
    scratch.setBlendMode(BlendMode.SrcOver);
    scratch.setAlphaf(1);
  }

  // в”Ђв”Ђ portal в”Ђв”Ђ
  if (run.portalActive) {
    const dx = run.portalPos.x - p.pos.x, dz = run.portalPos.z - p.pos.z;
    if (dx * dx + dz * dz <= (torchR / TILE * CELL * 1.4) ** 2) {
      const qx = wsx(run.portalPos.x), qy = wsy(run.portalPos.z);
      glowPaint.setColor(col('#22d3ee'));
      glowPaint.setAlphaf(0.75);
      canvas.drawCircle(qx, qy, TILE * 0.9, glowPaint);
      scratch.setStyle(PaintStyle.Stroke);
      for (let ring = 0; ring < 3; ring++) {
        scratch.setStrokeWidth(4 - ring);
        scratch.setColor(col(ring % 2 ? '#67e8f9' : '#22d3ee'));
        scratch.setAlphaf(0.9 - ring * 0.2);
        canvas.drawCircle(qx, qy, TILE * (0.4 + ring * 0.18) + Math.sin(run.clock * 3) * 3, scratch);
      }
      scratch.setStyle(PaintStyle.Fill);
      scratch.setAlphaf(1);
    }
  }

  // в”Ђв”Ђ monsters (normal variants, brutes, and the Guardian boss) в”Ђв”Ђ
  for (const m of run.monsters) {
    if (m.dead) continue;
    const isGuardian = m.type === 'guardian';
    const isBrute = m.type === 'brute';
    const dx = m.pos.x - p.pos.x, dz = m.pos.z - p.pos.z;
    const cullCells = (torchR / TILE) * (isGuardian ? 1.35 : 1) + 1;
    if (dx * dx + dz * dz > (cullCells * CELL) ** 2) continue;
    const mx = wsx(m.pos.x);
    const bob = Math.sin(run.clock * (isGuardian ? 5 : isBrute ? 8 : 12) + m.id) * (isGuardian ? 3 : 4);
    const my = wsy(m.pos.z) + bob;
    // shadow
    scratch.setColor(col('#00000055'));
    const sw = isGuardian ? 62 : isBrute ? 40 : 26;
    canvas.drawOval(Skia.XYWHRect(mx - sw / 2, wsy(m.pos.z) + (isGuardian ? 24 : 14), sw, isGuardian ? 13 : 9), scratch);
    // the Guardian's core throbs with light
    if (isGuardian) {
      glowPaint.setColor(col('#22d3ee'));
      glowPaint.setAlphaf(0.38 + 0.16 * Math.sin(run.clock * 4));
      canvas.drawCircle(mx, my, TILE * 0.75, glowPaint);
    }
    const sprite = isGuardian ? GUARDIAN : isBrute ? BRUTE : SHADE_VARIANTS[m.variant % SHADE_VARIANTS.length];
    const size = isGuardian ? TILE * 2.15 : isBrute ? TILE * 1.25 : TILE * 0.85;
    // procedural animation: breathing pulse, attack pounce, hit recoil, chase lean
    const breathe = Math.sin(run.clock * (isGuardian ? 3 : 6) + m.id * 1.7);
    let asy = 1 + breathe * (isGuardian ? 0.05 : 0.09);
    let asx = 1 - (asy - 1) * 0.7;
    const sinceAtk = run.clock - m.lastAttack;
    if (sinceAtk < 0.22) { const l = 1 - sinceAtk / 0.22; asy += l * 0.18; asx += l * 0.1; }
    if (m.damageFlash > 0) { asx *= 1.14; asy *= 0.86; }
    const chasing = dx * dx + dz * dz < L.MONSTER_AGGRO * L.MONSTER_AGGRO;
    const lean = chasing && !isGuardian ? (m.pos.x < p.pos.x ? -0.06 : 0.06) : 0;
    drawSpriteA(canvas, sprite, mx, my, size, m.pos.x < p.pos.x,
      m.damageFlash > 0 ? '#ffffff' : undefined, asx, asy, lean, false);
  }

  // в”Ђв”Ђ player + sword в”Ђв”Ђ
  {
    // soft warm aura so the seeker reads as the source of light (drawn under
    // the sprite, before the fog/warm overlays, so the hero stays the focus)
    glowPaint.setColor(col('#c9a6ff'));
    glowPaint.setAlphaf(0.34);
    canvas.drawCircle(camX, camY, TILE * 1.2, glowPaint);
    // shadow
    scratch.setColor(col('#00000066'));
    canvas.drawOval(Skia.XYWHRect(camX - 16, camY + 16, 32, 10), scratch);
    // sword arc during a swing вЂ” a big sweeping crescent with a bright tip
    if (run.swordSwing > 0) {
      const k = run.swordSwing;                          // 1 в†’ 0
      const face = Math.atan2(p.dir.z, p.dir.x);
      const reach = TILE * 1.15;
      const lead = face + ((1 - k) * 1.7 - 0.85) * Math.PI; // leading edge sweeps across
      scratch.setStyle(PaintStyle.Stroke);
      scratch.setStrokeWidth(6);
      for (let t = 0; t < 7; t++) {
        const a = lead - t * 0.17;
        scratch.setColor(col(t < 2 ? '#ffffff' : '#bae6fd'));
        scratch.setAlphaf(k * (1 - t / 7) * 0.9);
        canvas.drawLine(
          camX + Math.cos(a) * reach * 0.42, camY + Math.sin(a) * reach * 0.42,
          camX + Math.cos(a) * reach, camY + Math.sin(a) * reach, scratch);
      }
      scratch.setStyle(PaintStyle.Fill);
      const bx = camX + Math.cos(lead) * reach, by = camY + Math.sin(lead) * reach;
      glowPaint.setColor(col('#e0f2fe'));
      glowPaint.setAlphaf(k * 0.9);
      canvas.drawCircle(bx, by, 13, glowPaint);
      scratch.setAlphaf(1);
    }
    // procedural walk / idle animation
    const moving = p.moving;
    const bounce = moving ? Math.abs(Math.sin(p.stepPhase)) : 0;
    const breath = Math.sin(run.clock * 2.2) * 0.02;
    const psy = 1 + (moving ? bounce * 0.12 - 0.04 : breath);
    const psx = 1 - (psy - 1) * 0.6;
    const plean = moving ? (p.dir.x < -0.05 ? 0.05 : p.dir.x > 0.05 ? -0.05 : 0) : 0;
    const footY = moving ? -bounce * 4 : 0;
    const blink = (run.clock % 3.4) < 0.11;
    const pop = run.swordSwing > 0.6 ? (run.swordSwing - 0.6) * 0.5 : 0;   // brief pop as the swing starts
    drawSpriteA(canvas, SEEKER, camX, camY + footY, TILE * 0.95, p.dir.x < -0.05,
      p.isDashing ? '#c4b5fd' : undefined, psx + pop, psy + pop, plean, blink);
  }

  // в”Ђв”Ђ particles (additive) в”Ђв”Ђ
  scratch.setBlendMode(BlendMode.Plus);
  for (const pa of run.particles) {
    const a = Math.max(0, pa.life / pa.max);
    scratch.setColor(col(pa.color));
    scratch.setAlphaf(a);
    canvas.drawCircle(wsx(pa.x), wsy(pa.z), pa.size * (0.5 + a * 0.6), scratch);
  }
  scratch.setBlendMode(BlendMode.SrcOver);
  scratch.setAlphaf(1);

  // в”Ђв”Ђ ambient dust motes drifting in the torchlight в”Ђв”Ђ
  scratch.setColor(col('#c4b5fd'));
  for (let i = 0; i < 16; i++) {
    const a = run.clock * 0.25 + i * 0.85;
    const rad = TILE * (0.8 + (i % 6) * 0.7);
    const dxp = Math.cos(a) * rad;
    const dyp = Math.sin(a * 0.7 + i) * rad * 0.6;
    scratch.setAlphaf(0.18 + 0.14 * Math.sin(run.clock * 2 + i));
    canvas.drawCircle(camX + dxp, camY + dyp, 1.7, scratch);
  }
  scratch.setAlphaf(1);

  // в”Ђв”Ђ warm embers rising from the seeker's torch в”Ђв”Ђ
  scratch.setBlendMode(BlendMode.Plus);
  for (let i = 0; i < 7; i++) {
    const t2 = (run.clock * 0.35 + i * 0.37) % 1;
    const ex = camX + Math.sin(run.clock * 0.6 + i * 2.1) * TILE * (0.5 + (i % 3) * 0.5);
    const ey = camY + TILE * 0.6 - t2 * TILE * 2.4;
    scratch.setColor(col(i % 2 ? emberColA : emberColB));
    scratch.setAlphaf((1 - t2) * 0.5);
    canvas.drawCircle(ex, ey, 1.5 + (1 - t2) * 1.2, scratch);
  }
  scratch.setBlendMode(BlendMode.SrcOver);
  scratch.setAlphaf(1);

  // в”Ђв”Ђ cinematic lighting: warm torch core, cool abyss shadows в”Ђв”Ђ
  // 1) Fog: clear near field в†’ deep cool-blue shadow в†’ black abyss at the rim.
  const lightP = px();
  lightP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, torchR,
    [col('#060c1a00'), col('#060c1a00'), col('#070d1e55'), col('#060a16e8'), col('#04060fff')],
    [0, 0.42, 0.66, 0.86, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), lightP);

  // 2) Cool fill (additive): lift the mid-field shadows toward moonlit teal so
  //    they read cool against the warm torch вЂ” the "teal & orange" grade. Zero
  //    at the centre (kept warm) and at the black rim.
  const coolP = px();
  coolP.setBlendMode(BlendMode.Plus);
  coolP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, torchR * 1.15,
    [col('#0e1c3a00'), col('#17305c'), col('#0e1c3a00')],
    [0.18, 0.6, 1], TileMode.Clamp,
  ));
  coolP.setAlphaf(0.44);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), coolP);

  // 3) Warm torch glow (additive) вЂ” a firelit pool, gentle enough that the
  //    seeker stays crisp inside it rather than blowing out to white. The
  //    inner stop is transparent so it never washes the sprite at the centre.
  const warmP = px();
  warmP.setBlendMode(BlendMode.Plus);
  warmP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, TILE * 3.6,
    [col(warmStops[0]), col(warmStops[1]), col(warmStops[2])],
    [0, 0.42, 1], TileMode.Clamp,
  ));
  warmP.setAlphaf(0.42);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), warmP);

  // 4) A soft warm halo hugging the seeker вЂ” reads as torchlight without a
  //    hard hot core, so the hooded sprite and its cyan eyes stay legible.
  const coreP = px();
  coreP.setBlendMode(BlendMode.Plus);
  coreP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, TILE * 1.5,
    [col(haloStops[0]), col(haloStops[1]), col(haloStops[2])],
    [0.28, 0.55, 1], TileMode.Clamp,
  ));
  coreP.setAlphaf(0.32);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), coreP);

  // в”Ђв”Ђ floating damage / reward numbers в”Ђв”Ђ
  if (FONT_FLOAT) {
    for (const f of run.floats) {
      const a = Math.max(0, Math.min(1, f.life / f.max));
      scratch.setColor(col(f.color));
      scratch.setAlphaf(a);
      const tw = FONT_FLOAT.getTextWidth(f.text);
      canvas.drawText(f.text, wsx(f.x) - tw / 2, wsy(f.z), scratch, FONT_FLOAT);
    }
    scratch.setAlphaf(1);
  }

  // в”Ђв”Ђ vignette в”Ђв”Ђ
  const vig = px();
  vig.setShader(Skia.Shader.MakeRadialGradient(
    { x: W / 2, y: H / 2 }, Math.max(W, H) * 0.72,
    [col('#00000000'), col('#00000000'), col('#000000b0')],
    [0, 0.62, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), vig);
}

// в”Ђв”Ђ menu backdrop: the seeker at the brink of a glowing abyss, drawn live в”Ђв”Ђв”Ђв”Ђв”Ђ
function drawMenuScene(canvas: SkCanvas, clock: number, W: number, H: number) {
  // 1) deep cosmic gradient
  const bg = px();
  bg.setShader(Skia.Shader.MakeLinearGradient(
    { x: 0, y: 0 }, { x: 0, y: H },
    [col('#0c0724'), col('#0a0618'), col('#04060f')], [0, 0.5, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), bg);

  // purple nebula glow behind the title
  glowPaint.setColor(col('#3b1d6e'));
  glowPaint.setAlphaf(0.45);
  canvas.drawCircle(W * 0.5, H * 0.2, W * 0.55, glowPaint);

  // 2) faint twinkling starfield in the upper field
  scratch.setColor(col('#c4b5fd'));
  for (let i = 0; i < 44; i++) {
    const sx = (((i * 97) % 100) / 100) * W;
    const sy = (((i * 53) % 100) / 100) * H * 0.66;
    const tw = 0.25 + 0.6 * Math.abs(Math.sin(clock * 1.4 + i));
    scratch.setAlphaf(tw * 0.5);
    canvas.drawCircle(sx, sy, i % 3 === 0 ? 1.7 : 1, scratch);
  }
  scratch.setAlphaf(1);

  const cx = W / 2;
  const portalY = H * 0.6;
  const portalR = Math.min(W * 0.3, 150);
  const pulse = 0.55 + 0.2 * Math.sin(clock * 2);

  // 3) stone lip so the portal reads as a pit carved in the floor
  scratch.setColor(col('#160f2c'));
  canvas.drawOval(Skia.XYWHRect(cx - portalR * 1.55, portalY - portalR * 0.58, portalR * 3.1, portalR * 1.3), scratch);
  scratch.setColor(col('#241a44'));
  canvas.drawOval(Skia.XYWHRect(cx - portalR * 1.38, portalY - portalR * 0.5, portalR * 2.76, portalR * 1.12), scratch);
  scratch.setColor(col('#05010d'));
  canvas.drawOval(Skia.XYWHRect(cx - portalR, portalY - portalR * 0.42, portalR * 2, portalR * 0.88), scratch);

  // 4) abyss energy welling up + swirling rings
  glowPaint.setColor(col('#22d3ee'));
  glowPaint.setAlphaf(0.35 * pulse + 0.2);
  canvas.drawOval(Skia.XYWHRect(cx - portalR * 0.85, portalY - portalR * 0.36, portalR * 1.7, portalR * 0.72), glowPaint);
  scratch.setStyle(PaintStyle.Stroke);
  for (let r = 0; r < 4; r++) {
    scratch.setStrokeWidth(3 - r * 0.5);
    scratch.setColor(col(r % 2 ? '#67e8f9' : '#a855f7'));
    scratch.setAlphaf((0.7 - r * 0.13) * pulse);
    const rr = portalR * (0.34 + r * 0.16) + Math.sin(clock * 2 + r) * 4;
    canvas.drawOval(Skia.XYWHRect(cx - rr, portalY - rr * 0.45, rr * 2, rr * 0.9), scratch);
  }
  scratch.setStyle(PaintStyle.Fill);
  scratch.setAlphaf(1);

  // 5) embers rising out of the abyss (additive, warm + cyan)
  scratch.setBlendMode(BlendMode.Plus);
  for (let i = 0; i < 20; i++) {
    const t = (clock * 0.28 + i * 0.37) % 1;
    const ex = cx + Math.sin(clock * 0.5 + i * 2.1) * portalR * (0.35 + (i % 4) * 0.2);
    const ey = portalY - t * H * 0.46;
    scratch.setColor(col(i % 2 ? '#ff9a3c' : '#67e8f9'));
    scratch.setAlphaf((1 - t) * 0.5);
    canvas.drawCircle(ex, ey, 1.3 + (1 - t) * 1.7, scratch);
  }
  scratch.setBlendMode(BlendMode.SrcOver);
  scratch.setAlphaf(1);

  // 6) the seeker standing at the brink, torch-lit, idle breathing + blink
  const heroY = portalY - portalR * 0.72;
  glowPaint.setColor(col('#c9a6ff'));
  glowPaint.setAlphaf(0.28);
  canvas.drawCircle(cx, heroY, TILE * 1.7, glowPaint);
  const warm = px();
  warm.setBlendMode(BlendMode.Plus);
  warm.setShader(Skia.Shader.MakeRadialGradient(
    { x: cx, y: heroY }, TILE * 2.8,
    [col('#ffcf8a'), col('#ff9e4d00')], [0, 1], TileMode.Clamp,
  ));
  warm.setAlphaf(0.28);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), warm);
  scratch.setColor(col('#00000066'));
  canvas.drawOval(Skia.XYWHRect(cx - 26, heroY + 28, 52, 15), scratch);
  const breath = Math.sin(clock * 2.2) * 0.03;
  drawSpriteA(canvas, SEEKER, cx, heroY - breath * TILE, TILE * 1.75, false, undefined,
    1 - breath * 0.6, 1 + breath, 0, clock % 3.4 < 0.11);

  // 7) drifting dust
  scratch.setColor(col('#c4b5fd'));
  for (let i = 0; i < 14; i++) {
    const a = clock * 0.2 + i * 0.9;
    const dxp = Math.cos(a) * W * 0.32;
    const dyp = Math.sin(a * 0.7 + i) * H * 0.14;
    scratch.setAlphaf(0.08 + 0.1 * Math.sin(clock * 2 + i));
    canvas.drawCircle(cx + dxp, portalY * 0.62 + dyp, 1.6, scratch);
  }
  scratch.setAlphaf(1);

  // 8) vignette
  const vig = px();
  vig.setShader(Skia.Shader.MakeRadialGradient(
    { x: W / 2, y: H / 2 }, Math.max(W, H) * 0.72,
    [col('#00000000'), col('#00000000'), col('#000000cc')], [0, 0.55, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), vig);
}

// в”Ђв”Ђ minimap вЂ” fog-of-war chart of the maze в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// The explored terrain is painted INCREMENTALLY onto a persistent offscreen
// surface (MMAP_SCALE px per cell): each frame only the cells that became
// explored since the last frame are drawn, then the surface is snapshotted to
// an image. The per-frame minimap picture is that one image blit plus a
// handful of marker dots, so the cost stays flat no matter how much of the
// 81Г—81 grid has been charted.
const MMAP_SIZE  = 122;              // on-screen chart size (inside the frame)
const MMAP_SCALE = 2;                // offscreen surface px per maze cell
const MMAP_FLOOR = '#7c5cd94a';      // explored floor вЂ” faint purple
const MMAP_WALL  = '#a78bfa8c';      // explored wall вЂ” slightly brighter

type MinimapCache = {
  run: L.RunState | null;            // rebuilt when a new run starts
  surface: SkSurface | null;
  image: SkImage | null;
  seen: Uint8Array;                  // cells already painted onto the surface
};

function updateMinimapTerrain(cache: MinimapCache, run: L.RunState) {
  if (cache.run !== run || !cache.surface) {
    cache.run = run;
    cache.surface = Skia.Surface.Make(run.gridW * MMAP_SCALE, run.gridH * MMAP_SCALE);
    cache.image = null;
    cache.seen = new Uint8Array(run.gridW * run.gridH);
  }
  const surf = cache.surface;
  if (!surf) return;                 // raster surface unavailable вЂ” markers still draw
  const surfCanvas = surf.getCanvas();
  let dirty = false;
  for (let z = 0; z < run.gridH; z++) {
    const rowE = run.explored[z];
    const rowG = run.grid[z];
    const base = z * run.gridW;
    for (let x = 0; x < run.gridW; x++) {
      if (rowE[x] !== 1 || cache.seen[base + x] === 1) continue;
      cache.seen[base + x] = 1;
      scratch.setColor(col(rowG[x] === 1 ? MMAP_WALL : MMAP_FLOOR));
      surfCanvas.drawRect(Skia.XYWHRect(x * MMAP_SCALE, z * MMAP_SCALE, MMAP_SCALE, MMAP_SCALE), scratch);
      dirty = true;
    }
  }
  if (dirty || !cache.image) cache.image = surf.makeImageSnapshot();
}

function drawMinimap(canvas: SkCanvas, run: L.RunState, cache: MinimapCache) {
  const k = MMAP_SIZE / run.gridW;   // screen px per maze cell
  const cxs = (c: number) => (c + 0.5) * k;
  // charted terrain (one cached-image blit)
  if (cache.image) {
    canvas.drawImageRect(
      cache.image,
      Skia.XYWHRect(0, 0, run.gridW * MMAP_SCALE, run.gridH * MMAP_SCALE),
      Skia.XYWHRect(0, 0, MMAP_SIZE, MMAP_SIZE),
      scratch,
    );
  }
  // uncollected loot inside explored cells вЂ” tiny gold pings
  for (const it of run.items) {
    if (it.collected) continue;
    const c = L.worldToCell(it.pos.x, it.pos.z, run.gridW, run.gridH);
    if (run.explored[c.cz]?.[c.cx] !== 1) continue;
    scratch.setColor(col('#facc15'));
    canvas.drawCircle(cxs(c.cx), cxs(c.cz), 1.6, scratch);
  }
  // the Guardian вЂ” a red threat marker once its lair has been charted
  for (const m of run.monsters) {
    if (m.type !== 'guardian' || m.dead) continue;
    const c = L.worldToCell(m.pos.x, m.pos.z, run.gridW, run.gridH);
    if (run.explored[c.cz]?.[c.cx] !== 1) continue;
    scratch.setColor(col('#f87171'));
    canvas.drawCircle(cxs(c.cx), cxs(c.cz), 2.4, scratch);
    scratch.setColor(col('#7f1d1d'));
    canvas.drawCircle(cxs(c.cx), cxs(c.cz), 1.1, scratch);
  }
  // portal beacon вЂ” pulsing cyan ring once the way out is open
  if (run.portalActive) {
    const c = L.worldToCell(run.portalPos.x, run.portalPos.z, run.gridW, run.gridH);
    const bx = cxs(c.cx), by = cxs(c.cz);
    const t = (run.clock * 0.9) % 1;
    scratch.setColor(col('#22d3ee'));
    canvas.drawCircle(bx, by, 2.1, scratch);
    scratch.setStyle(PaintStyle.Stroke);
    scratch.setStrokeWidth(1.2);
    scratch.setAlphaf(1 - t);
    canvas.drawCircle(bx, by, 2.5 + t * 5.5, scratch);
    scratch.setStyle(PaintStyle.Fill);
    scratch.setAlphaf(1);
  }
  // the seeker вЂ” bright cyan marker with a white heart
  const ox = ((run.gridW - 1) * CELL) / 2;
  const oz = ((run.gridH - 1) * CELL) / 2;
  const sx = ((run.player.pos.x + ox) / CELL + 0.5) * k;
  const sy = ((run.player.pos.z + oz) / CELL + 0.5) * k;
  scratch.setColor(col('#22d3ee'));
  scratch.setAlphaf(0.4);
  canvas.drawCircle(sx, sy, 4.6, scratch);
  scratch.setAlphaf(1);
  canvas.drawCircle(sx, sy, 2.5, scratch);
  scratch.setColor(col('#ffffff'));
  canvas.drawCircle(sx, sy, 1.2, scratch);
}

// в”Ђв”Ђ input / phase в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
type InputState = { jx: number; jz: number; attack: boolean; dash: boolean };
type Phase = 'menu' | 'playing' | 'dead' | 'won';

const BEST_KEY = 'sk_labyrinth_best';
const UPGRADES_KEY = 'sk_labyrinth_upgrades_v1';

// в”Ђв”Ђ Seeker's Camp вЂ” permanent upgrades bought with ORB в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
// Same shape as App.tsx UPGRADE_DEFS (5 levels, rising cost, NOW в†’ NEXT).
// Effect tables live in lib/labyrinth.ts so sim and UI can never disagree.
type CampKey = 'torch' | 'speed' | 'vigor' | 'blade' | 'ember';
type CampLevels = Record<CampKey, number>;
const CAMP_ZERO: CampLevels = { torch: 0, speed: 0, vigor: 0, blade: 0, ember: 0 };

const CAMP_DEFS: Record<CampKey, {
  name: string; icon: Sprite; desc: string;
  valueLabels: string[]; costs: number[]; color: string;
}> = {
  torch: {
    name: 'ABYSS TORCH', icon: ICON_TORCH, desc: 'Torch light radius',
    valueLabels: L.TORCH_LEVELS.map(v => v.toFixed(1)),
    costs: [600, 1800, 4500, 11000, 26000],
    color: '#F59E0B',
  },
  speed: {
    name: 'SWIFT GREAVES', icon: ICON_BOOT, desc: 'Move speed',
    valueLabels: L.SPEED_LEVELS.map(String),
    costs: [500, 1500, 4000, 10000, 24000],
    color: '#22D3EE',
  },
  vigor: {
    name: 'ABYSSAL VIGOR', icon: ICON_HEART, desc: 'Max HP',
    valueLabels: L.MAX_HP_LEVELS.map(String),
    costs: [700, 2000, 5000, 12000, 28000],
    color: '#22C55E',
  },
  blade: {
    name: 'RUNEBLADE', icon: ICON_SWORD, desc: 'Sword damage',
    valueLabels: L.SWORD_DMG_LEVELS.map(String),
    costs: [800, 2400, 6000, 14000, 30000],
    color: '#A855F7',
  },
  ember: {
    name: 'SECOND TORCH', icon: ICON_CANDLE, desc: 'Survive a lethal hit В· once per run',
    valueLabels: L.EMBER_REVIVE_HP.map((h, i) => (i === 0 ? 'вЂ”' : `${h} HP`)),
    costs: [1200, 3000, 8000, 18000, 40000],
    color: '#EC4899',
  },
};
const CAMP_KEYS = Object.keys(CAMP_DEFS) as CampKey[];

// Abyss Lantern вЂ” the camp's one premium SOL offer (cosmetic + tiny light bonus)
const LANTERN_SOL      = 0.05;
const LANTERN_LAMPORTS = 50_000_000;

type Props = {
  energy: number;
  onSpendEnergy: (n: number) => void;
  onEarnOrb: (n: number) => void;
  onAddScore: (n: number) => void;
  onPlaySound: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  onExit: () => void;
  // Optional economy hooks for the Seeker's Camp. All backward-compatible:
  // without orb/onSpendOrb the camp renders in a locked preview state, and
  // without onPaySol the SOL offer shows "coming soon".
  orb?: number;
  onSpendOrb?: (n: number) => void;
  onPaySol?: (lamports: number, sol: number, purpose: string) => Promise<void>;
};

export default function LabyrinthOfAbyss({
  energy, onSpendEnergy, onEarnOrb, onAddScore, onPlaySound, onExit,
  orb, onSpendOrb, onPaySol,
}: Props) {
  const { width: W, height: H } = useWindowDimensions();

  const [phase, setPhase]         = useState<Phase>('menu');
  const [hp, setHp]               = useState(L.PLAYER_MAX_HP);
  const [collected, setCollected] = useState(0);
  const [runOrb, setRunOrb]       = useState(0);
  const [msg, setMsg]             = useState('');
  const [best, setBest]           = useState(0);
  const [, setFrame]              = useState(0);
  // Seeker's Camp
  const [camp, setCamp]           = useState<CampLevels>(CAMP_ZERO);
  const [lantern, setLantern]     = useState(false);
  const [campOpen, setCampOpen]   = useState(false);
  const [paying, setPaying]       = useState(false);
  const [justBought, setJustBought] = useState<CampKey | null>(null);

  const runRef    = useRef<L.RunState | null>(null);
  const phaseRef  = useRef<Phase>('menu');
  const inputRef  = useRef<InputState>({ jx: 0, jz: 0, attack: false, dash: false });
  const eventsRef = useRef<L.SimEvents>(null as unknown as L.SimEvents);

  const hitFlash = useRef(new Animated.Value(0)).current;
  const stickPos = useRef(new Animated.ValueXY()).current;
  const menuClock = useRef(0);          // drives the animated menu backdrop
  const buyAnim = useRef(new Animated.Value(0)).current;   // camp purchase pulse
  const lowHpPulse = useRef(new Animated.Value(0)).current; // HP-frame danger pulse
  const solShimmer = useRef(new Animated.Value(0)).current; // lantern-card mythic sheen
  const minimapCache = useRef<MinimapCache>({ run: null, surface: null, image: null, seen: new Uint8Array(0) });

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then(v => {
      const n = parseInt(v ?? '0', 10);
      if (Number.isFinite(n)) setBest(n);
    }).catch(() => {});
    // camp upgrade levels + lantern ownership, clamped on load
    AsyncStorage.getItem(UPGRADES_KEY).then(v => {
      if (!v) return;
      try {
        const j = JSON.parse(v) as Partial<Record<CampKey | 'lantern', unknown>>;
        const lv = (x: unknown) =>
          Math.max(0, Math.min(L.UPGRADE_MAX_LEVEL, Math.floor(Number(x) || 0)));
        setCamp({
          torch: lv(j.torch), speed: lv(j.speed), vigor: lv(j.vigor),
          blade: lv(j.blade), ember: lv(j.ember),
        });
        setLantern(j.lantern === true);
      } catch {}
    }).catch(() => {});
  }, []);

  function persistCamp(levels: CampLevels, hasLantern: boolean) {
    AsyncStorage.setItem(UPGRADES_KEY, JSON.stringify({ ...levels, lantern: hasLantern })).catch(() => {});
  }

  function buyCampUpgrade(key: CampKey) {
    if (orb === undefined || !onSpendOrb) return;          // locked preview state
    const lvl = camp[key];
    if (lvl >= L.UPGRADE_MAX_LEVEL) return;
    const cost = CAMP_DEFS[key].costs[lvl];
    if (orb < cost) return;
    onSpendOrb(cost);
    const next = { ...camp, [key]: lvl + 1 };
    setCamp(next);
    persistCamp(next, lantern);
    onPlaySound('levelup');
    // small celebratory pulse + "LEVEL UP" flash on the bought card
    setJustBought(key);
    buyAnim.setValue(0);
    Animated.timing(buyAnim, { toValue: 1, duration: 700, useNativeDriver: true })
      .start(() => setJustBought(null));
  }

  async function buyLantern() {
    if (!onPaySol || lantern || paying) return;
    setPaying(true);
    try {
      await onPaySol(LANTERN_LAMPORTS, LANTERN_SOL, 'labyrinth_abyss_lantern');
      setLantern(true);
      persistCamp(camp, true);
      onPlaySound('jackpot');
    } catch {
      // payment cancelled/failed вЂ” the wallet flow owns the error UI
    } finally {
      setPaying(false);
    }
  }

  function endRun(won: boolean) {
    const r = runRef.current;
    phaseRef.current = won ? 'won' : 'dead';
    setPhase(won ? 'won' : 'dead');
    if (r) {
      const pts = Math.max(1, Math.floor(r.runOrb / 10)) + (won ? L.WIN_TOURNAMENT_PTS : 0);
      onAddScore(pts);
      if (r.runOrb > best) {
        setBest(r.runOrb);
        AsyncStorage.setItem(BEST_KEY, String(r.runOrb)).catch(() => {});
      }
    }
  }

  eventsRef.current = {
    setHp, setCollected, setRunOrb, setMsg,
    earnOrb: onEarnOrb,
    playSound: onPlaySound,
    onHitFlash: () => {
      hitFlash.setValue(0.4);
      Animated.timing(hitFlash, { toValue: 0, duration: 320, useNativeDriver: true }).start();
    },
    onEnd: endRun,
  };

  // в”Ђв”Ђ game loop в”Ђв”Ђ
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const r = runRef.current;
      if (r && phaseRef.current === 'playing') {
        L.stepSimulation(r, inputRef.current, dt, eventsRef.current);
      }
      setFrame(f => (f + 1) & 0xffff);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // в”Ђв”Ђ menu backdrop animation loop (torch flicker, embers, portal pulse) в”Ђв”Ђ
  useEffect(() => {
    if (phase !== 'menu') return;
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      menuClock.current += Math.min((now - last) / 1000, 0.05);
      last = now;
      setFrame(f => (f + 1) & 0xffff);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // в”Ђв”Ђ low-HP danger pulse on the ornate HP frame (native-driver opacity loop) в”Ђв”Ђ
  const lowHp = phase === 'playing' && hp <= (runRef.current?.maxHp ?? L.PLAYER_MAX_HP) * 0.25;
  useEffect(() => {
    if (!lowHp) { lowHpPulse.stopAnimation(); lowHpPulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(lowHpPulse, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lowHpPulse, { toValue: 0, duration: 460, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [lowHp, lowHpPulse]);

  // в”Ђв”Ђ subtle sheen drifting across the SOL lantern card while the camp is open в”Ђв”Ђ
  useEffect(() => {
    if (!campOpen) return;
    solShimmer.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(solShimmer, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.delay(1400),
    ]));
    loop.start();
    return () => loop.stop();
  }, [campOpen, solShimmer]);

  function startRun() {
    if (energy < L.ENTRY_ENERGY) {
      setMsg(`Need ${L.ENTRY_ENERGY} energy to descend`);
      return;
    }
    onSpendEnergy(L.ENTRY_ENERGY);
    runRef.current = L.createRun({ ...camp, lantern });
    inputRef.current = { jx: 0, jz: 0, attack: false, dash: false };
    setHp(runRef.current.maxHp);
    setCollected(0);
    setRunOrb(0);
    setMsg('The Abyss watches. Find 15 artifacts.');
    phaseRef.current = 'playing';
    setPhase('playing');
    onPlaySound('levelup');
  }

  // в”Ђв”Ђ joystick в”Ђв”Ђ
  const JOY_R = 56;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        let dx = g.dx, dy = g.dy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > JOY_R) { dx = (dx / d) * JOY_R; dy = (dy / d) * JOY_R; }
        stickPos.setValue({ x: dx, y: dy });
        inputRef.current.jx = dx / JOY_R;
        inputRef.current.jz = dy / JOY_R;
      },
      onPanResponderRelease: () => {
        stickPos.setValue({ x: 0, y: 0 });
        inputRef.current.jx = 0; inputRef.current.jz = 0;
      },
      onPanResponderTerminate: () => {
        stickPos.setValue({ x: 0, y: 0 });
        inputRef.current.jx = 0; inputRef.current.jz = 0;
      },
    }),
  ).current;

  const run = runRef.current;
  const hpPct = Math.max(0, Math.min(1, hp / (run?.maxHp ?? L.PLAYER_MAX_HP)));
  const scene = (phase !== 'menu' && run)
    ? createPicture((canvas) => drawScene(canvas, run, W, H, lantern), { x: 0, y: 0, width: W, height: H })
    : null;
  const menuScene = phase === 'menu'
    ? createPicture((canvas) => drawMenuScene(canvas, menuClock.current, W, H), { x: 0, y: 0, width: W, height: H })
    : null;
  // Minimap: incremental terrain update + a cheap per-frame marker picture.
  // Reuses the existing frame tick (the component already re-renders every
  // frame during play) вЂ” no extra loops.
  let minimap: SkPicture | null = null;
  if (phase === 'playing' && run) {
    updateMinimapTerrain(minimapCache.current, run);
    minimap = createPicture(
      (canvas) => drawMinimap(canvas, run, minimapCache.current),
      { x: 0, y: 0, width: MMAP_SIZE, height: MMAP_SIZE },
    );
  }
  const enough = energy >= L.ENTRY_ENERGY;
  const campTotal = CAMP_KEYS.reduce((n, k) => n + camp[k], 0);
  const campLocked = orb === undefined || !onSpendOrb;
  // camp purchase celebration interpolations
  const buyScale   = buyAnim.interpolate({ inputRange: [0, 0.18, 1], outputRange: [1, 1.05, 1] });
  const buyFlashOp = buyAnim.interpolate({ inputRange: [0, 0.1, 0.65, 1], outputRange: [0, 1, 1, 0] });
  const lowHpOp    = lowHpPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.32] });
  const shimmerX   = solShimmer.interpolate({ inputRange: [0, 1], outputRange: [-110, W + 110] });

  return (
    <View style={s.root}>
      {scene && (
        <Canvas style={{ width: W, height: H }}>
          <Picture picture={scene} />
        </Canvas>
      )}
      {menuScene && (
        <Canvas style={{ width: W, height: H }}>
          <Picture picture={menuScene} />
        </Canvas>
      )}

      {/* Damage flash */}
      <Animated.View pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#dc2626', opacity: hitFlash }]} />

      {/* в•ђв•ђв•ђ MENU в•ђв•ђв•ђ */}
      {phase === 'menu' && (
        <View style={s.menuWrap} pointerEvents="box-none">
          <View style={s.menuTop} pointerEvents="none">
            <Text style={s.menuKicker}>В· GENESIS PRE-SEASON В·</Text>
            <Text style={s.menuTitle}>ABYSS{'\n'}LABYRINTH</Text>
            <View style={s.menuRule} />
            <Text style={s.menuTagline}>The dark calls the brave.  Descend, and it remembers.</Text>
          </View>

          <View style={s.menuBottom} pointerEvents="box-none">
            <View style={s.menuStats}>
              <View style={s.statCard}>
                <PixelIcon sprite={ICON_TROPHY} size={26} style={s.statIcon} />
                <Text style={s.statVal}>{best.toLocaleString()}</Text>
                <Text style={s.statLbl}>BEST ORB</Text>
              </View>
              <View style={s.statCard}>
                <PixelIcon sprite={ICON_SWORD} size={26} style={s.statIcon} />
                <Text style={s.statVal}>{L.SWORD_DMG_LEVELS[camp.blade]}</Text>
                <Text style={s.statLbl}>SWORD</Text>
              </View>
              <View style={s.statCard}>
                <PixelIcon sprite={ICON_STAR} size={26} style={s.statIcon} />
                <Text style={s.statVal}>{L.ITEM_COUNT}</Text>
                <Text style={s.statLbl}>ARTIFACTS</Text>
              </View>
            </View>

            <TouchableOpacity onPress={startRun} activeOpacity={0.85}
              style={[s.descendBtn, !enough && s.descendBtnOff]}>
              <Text style={s.descendTxt}>в–ј  DESCEND</Text>
              <View style={s.descendCost}>
                <Text style={s.descendCostTxt}>{L.ENTRY_ENERGY}</Text>
                <PixelIcon sprite={ICON_BOLT} size={14} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setCampOpen(true); onPlaySound('tap'); }}
              activeOpacity={0.85} style={s.campBtn}>
              <PixelIcon sprite={ICON_TENT} size={20} />
              <Text style={s.campBtnTxt}>SEEKER'S CAMP</Text>
              <View style={s.campBtnBadge}>
                <Text style={s.campBtnBadgeTxt}>
                  {campTotal > 0 ? `LV ${campTotal}` : 'NEW'}
                </Text>
              </View>
            </TouchableOpacity>

            {msg !== '' && <Text style={s.menuMsg}>{msg}</Text>}

            <TouchableOpacity onPress={onExit} style={s.exitLink}>
              <Text style={s.exitLinkTxt}>вЂ№  BACK TO ARCADE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* в•ђв•ђв•ђ SEEKER'S CAMP вЂ” permanent upgrades + the SOL offer в•ђв•ђв•ђ */}
      {phase === 'menu' && campOpen && (
        <View style={s.campWrap}>
          <View style={s.campHead}>
            <PixelIcon sprite={ICON_TENT} size={22} />
            <Text style={s.campTitle}>SEEKER'S CAMP</Text>
            <View style={s.campOrbChip}>
              <PixelIcon sprite={campLocked ? ICON_LOCK : ICON_ORB} size={14} />
              {!campLocked && <Text style={s.campOrbTxt}>{(orb ?? 0).toLocaleString()}</Text>}
            </View>
            <TouchableOpacity onPress={() => { setCampOpen(false); onPlaySound('tap'); }} style={s.campClose}>
              <Text style={s.campCloseTxt}>вњ•</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.campSub}>Permanent upgrades вЂ” forged once, kept through every death.</Text>

          <ScrollView contentContainerStyle={s.campScroll} showsVerticalScrollIndicator={false}>
            {CAMP_KEYS.map((key) => {
              const def   = CAMP_DEFS[key];
              const lvl   = camp[key];
              const maxed = lvl >= L.UPGRADE_MAX_LEVEL;
              const cost  = maxed ? 0 : def.costs[lvl];
              const affordable = !campLocked && (orb ?? 0) >= cost;
              const isJust = justBought === key;
              return (
                <Animated.View key={key}
                  style={[
                    s.campCard,
                    // tier glow: border + shadow bloom with the upgrade level
                    { borderColor: def.color + (maxed ? 'CC' : lvl > 0 ? '66' : '38'),
                      shadowColor: def.color, shadowOpacity: 0.1 + lvl * 0.09 },
                    isJust && { transform: [{ scale: buyScale }] },
                  ]}>
                  <View style={s.campCardTop}>
                    <View style={[s.campIcon, { backgroundColor: def.color + '1e', borderColor: def.color + '55' }]}>
                      <PixelIcon sprite={def.icon} size={30} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.campName, { color: def.color }]}>{def.name}</Text>
                      <Text style={s.campDesc}>{def.desc}</Text>
                    </View>
                    <View style={s.pipCol}>
                      <View style={s.pipRow}>
                        {Array.from({ length: L.UPGRADE_MAX_LEVEL }).map((_, i) => (
                          <View key={i}
                            style={[s.pip, i < lvl && { backgroundColor: def.color, borderColor: def.color }]} />
                        ))}
                      </View>
                      <Text style={s.pipLbl}>LV {lvl}/{L.UPGRADE_MAX_LEVEL}</Text>
                    </View>
                  </View>

                  <View style={s.campRow}>
                    <View>
                      <Text style={s.campValLbl}>NOW</Text>
                      <Text style={[s.campValNum, { color: def.color }]}>{def.valueLabels[lvl]}</Text>
                    </View>
                    {!maxed && (
                      <>
                        <Text style={s.campArrow}>в†’</Text>
                        <View>
                          <Text style={s.campValLbl}>NEXT</Text>
                          <Text style={s.campValNumNext}>{def.valueLabels[lvl + 1]}</Text>
                        </View>
                      </>
                    )}
                    <View style={{ flex: 1 }} />
                    {maxed ? (
                      <View style={[s.campMax, { borderColor: def.color + '66' }]}>
                        <Text style={[s.campMaxTxt, { color: def.color }]}>вњ¦ MAX</Text>
                      </View>
                    ) : campLocked ? (
                      <View style={s.campLockBtn}>
                        <PixelIcon sprite={ICON_LOCK} size={13} />
                        <Text style={s.campLockTxt}>LOCKED</Text>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => buyCampUpgrade(key)} disabled={!affordable}
                        activeOpacity={0.8}
                        style={[s.campBuyBtn, affordable ? { backgroundColor: def.color } : s.campBuyOff]}>
                        <Text style={[s.campBuyTxt, !affordable && s.campBuyTxtOff]}>
                          {affordable
                            ? `${cost.toLocaleString()} ORB`
                            : `NEED ${(cost - (orb ?? 0)).toLocaleString()}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isJust && (
                    <Animated.View pointerEvents="none" style={[s.campLevelUp, { opacity: buyFlashOp }]}>
                      <Text style={[s.campLevelUpTxt, { color: def.color }]}>в–І LEVEL UP</Text>
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}

            {/* Premium SOL offer вЂ” one card, calls onPaySol; stub-only by design */}
            <View style={s.solCard}>
              <Text style={s.solKicker}>в—† PREMIUM В· PAY WITH SOL</Text>
              <View style={s.campCardTop}>
                <View style={s.solIcon}>
                  <PixelIcon sprite={ICON_LANTERN} size={30} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.solName}>ABYSS LANTERN</Text>
                  <Text style={s.solDesc}>
                    Spectral cyan flame for your torch В· +{L.LANTERN_TORCH_BONUS.toFixed(1)} light radius В· yours forever
                  </Text>
                </View>
              </View>
              <View style={s.campRow}>
                <View style={{ flex: 1 }} />
                {lantern ? (
                  <View style={s.solOwned}><Text style={s.solOwnedTxt}>вњ¦ OWNED</Text></View>
                ) : (
                  <TouchableOpacity onPress={buyLantern} disabled={!onPaySol || paying}
                    activeOpacity={0.85} style={[s.solBuyBtn, (!onPaySol || paying) && s.solBuyOff]}>
                    <Text style={s.solBuyTxt}>
                      {paying ? 'CONFIRMINGвЂ¦' : onPaySol ? `в—Ћ ${LANTERN_SOL} SOL` : 'COMING SOON'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* в•ђв•ђв•ђ HUD в•ђв•ђв•ђ */}
      {phase === 'playing' && (
        <>
          <View style={s.hudTop} pointerEvents="box-none">
            <View style={s.hpWrap}>
              <View style={s.hpTrack}>
                <View style={[s.hpFill, {
                  width: `${hpPct * 100}%`,
                  backgroundColor: hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444',
                }]} />
              </View>
              <Text style={s.hpTxt}>{hp} HP</Text>
            </View>
            <View style={s.hudChips}>
              {(run?.emberCharges ?? 0) > 0 && (
                <View style={[s.hudChipBox, { borderColor: 'rgba(244,114,182,0.55)' }]}>
                  <PixelIcon sprite={ICON_CANDLE} size={15} />
                </View>
              )}
              <View style={s.hudChipBox}>
                <PixelIcon sprite={ICON_STAR} size={14} />
                <Text style={s.hudChip}>{collected}/{L.ITEM_COUNT}</Text>
              </View>
              <View style={[s.hudChipBox, { borderColor: 'rgba(250,204,21,0.45)' }]}>
                <PixelIcon sprite={ICON_ORB} size={14} />
                <Text style={[s.hudChip, { color: '#facc15' }]}>{runOrb.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { phaseRef.current = 'menu'; setPhase('menu'); }} style={s.quitBtn}>
              <Text style={s.quitTxt}>вњ•</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const g = run?.monsters.find(m => m.type === 'guardian' && !m.dead);
            if (!g) return null;
            const d = Math.hypot(g.pos.x - run!.player.pos.x, g.pos.z - run!.player.pos.z);
            if (d > L.MONSTER_AGGRO) return null;   // only once the boss is engaged
            const pct = Math.max(0, Math.min(1, g.hp / g.maxHp));
            return (
              <View style={s.bossWrap} pointerEvents="none">
                <View style={s.bossNameRow}>
                  <PixelIcon sprite={ICON_SWORD} size={14} />
                  <Text style={s.bossName}>THE GUARDIAN</Text>
                  <PixelIcon sprite={ICON_SWORD} size={14} />
                </View>
                <View style={s.bossTrack}>
                  <View style={[s.bossFill, { width: `${pct * 100}%` }]} />
                </View>
              </View>
            );
          })()}

          {msg !== '' && (
            <View style={s.msgWrap} pointerEvents="none">
              <Text style={s.msgTxt}>{msg}</Text>
            </View>
          )}

          <View style={s.joyZone} {...pan.panHandlers}>
            <View style={s.joyBase}>
              <Animated.View style={[s.joyStick, { transform: stickPos.getTranslateTransform() }]} />
            </View>
          </View>

          <View style={s.btnCol} pointerEvents="box-none">
            <RuneButton sprite={ICON_DASH} label="DASH" color="#22d3ee" size={74}
              onPressIn={() => { inputRef.current.dash = true; }} />
            <RuneButton sprite={ICON_SWORD} label="STRIKE" color="#7c3aed" size={86}
              onPressIn={() => { inputRef.current.attack = true; }} />
          </View>
        </>
      )}

      {/* в•ђв•ђв•ђ DEATH / VICTORY в•ђв•ђв•ђ */}
      {(phase === 'dead' || phase === 'won') && (
        <View style={s.endWrap}>
          <PixelIcon sprite={phase === 'won' ? ICON_PORTAL : ICON_SKULL} size={92} style={s.endIcon} />
          <Text style={[s.endTitle, phase === 'won' && { color: '#22d3ee' }]}>
            {phase === 'won' ? 'ESCAPED THE ABYSS' : 'THE ABYSS CLAIMS YOU'}
          </Text>
          <OrnamentRule color={phase === 'won' ? '#22d3ee' : '#ef4444'} />
          <View style={s.endStats}>
            <View style={s.endRow}>
              <PixelIcon sprite={ICON_STAR} size={16} />
              <Text style={s.endLbl}>ARTIFACTS</Text>
              <Text style={s.endVal}>{collected}/{L.ITEM_COUNT}</Text>
            </View>
            <View style={s.endRow}>
              <PixelIcon sprite={ICON_SWORD} size={16} />
              <Text style={s.endLbl}>KILLS</Text>
              <Text style={s.endVal}>{run?.kills ?? 0}</Text>
            </View>
            <View style={s.endRow}>
              <PixelIcon sprite={ICON_ORB} size={16} />
              <Text style={s.endLbl}>ORB EARNED</Text>
              <Text style={[s.endVal, { color: '#facc15' }]}>+{runOrb.toLocaleString()}</Text>
            </View>
            {phase === 'won' && (
              <View style={s.endRow}>
                <PixelIcon sprite={ICON_PORTAL} size={16} />
                <Text style={s.endLbl}>ESCAPE BONUS</Text>
                <Text style={[s.endVal, { color: '#22d3ee' }]}>+{L.WIN_BONUS_ORB}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={startRun} activeOpacity={0.85} style={s.descendBtn}>
            <Text style={s.descendTxt}>в–ј  DESCEND AGAIN</Text>
            <View style={s.descendCost}>
              <Text style={s.descendCostTxt}>{L.ENTRY_ENERGY}</Text>
              <PixelIcon sprite={ICON_BOLT} size={14} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onExit} style={s.exitLink}>
            <Text style={s.exitLinkTxt}>вЂ№ BACK TO ARCADE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05010d' },

  menuWrap:  { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between',
               paddingTop: 74, paddingBottom: 40, paddingHorizontal: 24 },
  menuTop:   { alignItems: 'center' },
  menuKicker:{ color: '#f472b6', fontSize: 11, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  menuTitle: { color: '#F5F3FF', fontSize: 46, fontWeight: '900', letterSpacing: 3, textAlign: 'center',
               lineHeight: 47, textShadowColor: 'rgba(124,58,237,0.9)', textShadowRadius: 20,
               textShadowOffset: { width: 0, height: 0 } },
  menuRule:  { width: 64, height: 3, borderRadius: 2, backgroundColor: '#7C3AED', marginTop: 16, opacity: 0.9 },
  menuTagline:{ color: '#a78bfa', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginTop: 14,
               textAlign: 'center', maxWidth: 300 },

  menuBottom:{ alignItems: 'center' },
  menuStats: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:  { alignItems: 'center', backgroundColor: 'rgba(18,12,36,0.72)', borderWidth: 1,
               borderColor: 'rgba(124,58,237,0.4)', borderRadius: 15, paddingVertical: 12,
               paddingHorizontal: 16, minWidth: 96 },
  statIcon:  { marginBottom: 5 },
  statVal:   { color: '#F5F3FF', fontSize: 19, fontWeight: '900' },
  statLbl:   { color: '#8b7bb8', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
  menuMsg:   { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginTop: 14 },

  descendBtn:{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#7C3AED',
               paddingVertical: 17, paddingHorizontal: 40, borderRadius: 22, borderWidth: 1,
               borderColor: 'rgba(196,181,253,0.6)', shadowColor: '#a855f7', shadowRadius: 24,
               shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  descendBtnOff:{ opacity: 0.5 },
  descendTxt:{ color: '#FFF', fontSize: 21, fontWeight: '900', letterSpacing: 3 },
  descendCost:{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.3)',
               borderRadius: 11, paddingHorizontal: 11, paddingVertical: 4 },
  descendCostTxt:{ color: '#FDE68A', fontSize: 14, fontWeight: '900' },

  campBtn:  { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: 'rgba(8,13,30,0.88)', borderWidth: 1.5, borderColor: 'rgba(236,72,153,0.5)',
              paddingVertical: 12, paddingHorizontal: 26, borderRadius: 18 },
  campBtnTxt: { color: '#f9a8d4', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  campBtnBadge: { backgroundColor: 'rgba(236,72,153,0.18)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  campBtnBadgeTxt: { color: '#f472b6', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  // в”Ђв”Ђ Seeker's Camp panel в”Ђв”Ђ
  campWrap:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,4,12,0.94)', paddingTop: 54 },
  campHead:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 4, gap: 10 },
  campTitle: { flex: 1, color: '#F5F3FF', fontSize: 19, fontWeight: '900', letterSpacing: 2 },
  campOrbChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(15,23,42,0.9)',
               paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
               borderColor: 'rgba(250,204,21,0.35)' },
  campOrbTxt: { color: '#facc15', fontSize: 13, fontWeight: '900' },
  campClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.85)',
               alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.5)' },
  campCloseTxt: { color: '#94A3B8', fontSize: 15, fontWeight: '800' },
  campSub:   { color: '#8b7bb8', fontSize: 11, fontWeight: '700', letterSpacing: 0.4,
               paddingHorizontal: 18, marginBottom: 12 },
  campScroll:{ paddingHorizontal: 16, paddingBottom: 44, gap: 12 },

  campCard:  { backgroundColor: '#080D1E', borderRadius: 18, borderWidth: 1.5, padding: 14,
               shadowOffset: { width: 0, height: 0 }, shadowRadius: 14 },
  campCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  campIcon:  { width: 44, height: 44, borderRadius: 13, borderWidth: 1,
               alignItems: 'center', justifyContent: 'center' },
  campName:  { fontSize: 13.5, fontWeight: '900', letterSpacing: 1 },
  campDesc:  { color: '#8b7bb8', fontSize: 11, fontWeight: '700', marginTop: 2 },
  pipCol:    { alignItems: 'flex-end', gap: 4 },
  pipRow:    { flexDirection: 'row', gap: 4 },
  pip:       { width: 9, height: 9, borderRadius: 3, backgroundColor: 'rgba(124,58,237,0.14)',
               borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)' },
  pipLbl:    { color: '#64748B', fontSize: 8.5, fontWeight: '900', letterSpacing: 1 },
  campRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  campValLbl:{ color: '#64748B', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.2 },
  campValNum:{ fontSize: 16, fontWeight: '900' },
  campValNumNext: { color: '#F5F3FF', fontSize: 16, fontWeight: '900' },
  campArrow: { color: '#475569', fontSize: 15, fontWeight: '900', marginHorizontal: 2 },
  campBuyBtn:{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 13 },
  campBuyOff:{ backgroundColor: '#111a30' },
  campBuyTxt:{ color: '#04060f', fontSize: 12.5, fontWeight: '900', letterSpacing: 0.4 },
  campBuyTxtOff: { color: '#334155' },
  campLockBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 13,
               backgroundColor: '#0c1327', borderWidth: 1, borderColor: 'rgba(71,85,105,0.5)' },
  campLockTxt: { color: '#475569', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  campMax:   { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 13, borderWidth: 1.5,
               backgroundColor: 'rgba(124,58,237,0.08)' },
  campMaxTxt:{ fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  campLevelUp: { position: 'absolute', top: 10, right: 14 },
  campLevelUpTxt: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },

  // в”Ђв”Ђ Abyss Lantern (SOL offer) в”Ђв”Ђ
  solCard:   { backgroundColor: '#0b0618', borderRadius: 20, borderWidth: 1.5,
               borderColor: 'rgba(236,72,153,0.65)', padding: 16, marginTop: 6,
               shadowColor: '#EC4899', shadowOpacity: 0.5, shadowRadius: 18,
               shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  solKicker: { color: '#f472b6', fontSize: 9, fontWeight: '900', letterSpacing: 2.5, marginBottom: 10 },
  solIcon:   { width: 48, height: 48, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(34,211,238,0.5)',
               backgroundColor: 'rgba(34,211,238,0.10)', alignItems: 'center', justifyContent: 'center' },
  solName:   { color: '#F5F3FF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  solDesc:   { color: '#c4b5fd', fontSize: 11.5, fontWeight: '700', marginTop: 3, lineHeight: 16 },
  solBuyBtn: { backgroundColor: '#EC4899', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14 },
  solBuyOff: { opacity: 0.55 },
  solBuyTxt: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  solOwned:  { borderWidth: 1.5, borderColor: 'rgba(34,211,238,0.6)', backgroundColor: 'rgba(34,211,238,0.08)',
               paddingVertical: 11, paddingHorizontal: 20, borderRadius: 14 },
  solOwnedTxt: { color: '#22d3ee', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  exitLink: { marginTop: 18, padding: 8 },
  exitLinkTxt: { color: '#475569', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  hudTop:  { position: 'absolute', top: 46, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hpWrap:  { flex: 1 },
  hpTrack: { height: 10, backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 6, overflow: 'hidden',
             borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  hpFill:  { height: '100%', borderRadius: 6 },
  hpTxt:   { color: '#E2E8F0', fontSize: 10, fontWeight: '800', marginTop: 3 },
  hudChips:{ flexDirection: 'row', gap: 8 },
  hudChipBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(8,13,30,0.86)',
             paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
             borderWidth: 1, borderColor: 'rgba(124,58,237,0.45)' },
  hudChip: { color: '#C4B5FD', fontSize: 13, fontWeight: '900' },
  quitBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(15,23,42,0.85)',
             alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.5)' },
  quitTxt: { color: '#94A3B8', fontSize: 16, fontWeight: '800' },

  bossWrap:  { position: 'absolute', top: 92, left: 44, right: 44, alignItems: 'center' },
  bossNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  bossName:  { color: '#f472b6', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  bossTrack: { height: 9, width: '100%', backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 5,
               overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(244,114,182,0.55)' },
  bossFill:  { height: '100%', backgroundColor: '#ec4899', borderRadius: 5 },

  msgWrap: { position: 'absolute', bottom: 190, left: 0, right: 0, alignItems: 'center' },
  msgTxt:  { color: '#E2E8F0', fontSize: 13, fontWeight: '800', backgroundColor: 'rgba(5,1,13,0.75)',
             paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, overflow: 'hidden' },

  joyZone: { position: 'absolute', left: 0, bottom: 0, width: '48%', height: 240, alignItems: 'center', justifyContent: 'center' },
  joyBase: { width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(124,58,237,0.10)',
             borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.35)', alignItems: 'center', justifyContent: 'center' },
  joyStick:{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(196,181,253,0.55)',
             borderWidth: 1.5, borderColor: '#C4B5FD' },

  btnCol:  { position: 'absolute', right: 18, bottom: 46, gap: 14, alignItems: 'center' },

  endWrap:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(5,1,13,0.82)', padding: 28 },
  endIcon:  { marginBottom: 10 },
  endTitle: { color: '#ef4444', fontSize: 20, fontWeight: '900', letterSpacing: 3, textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  endStats: { marginTop: 18, gap: 2, alignSelf: 'stretch', paddingHorizontal: 22,
              backgroundColor: 'rgba(8,13,30,0.72)', borderRadius: 16, paddingVertical: 12,
              borderWidth: 1, borderColor: 'rgba(124,58,237,0.32)' },
  endRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  endLbl:   { flex: 1, color: '#8b7bb8', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  endVal:   { color: '#F5F3FF', fontSize: 16, fontWeight: '900' },
});

```

## Дизайн-документ экономики апгрейдов

```markdown
# Р›Р°РіРµСЂСЊ РЎРёРєРµСЂР° вЂ” РјР°РіР°Р·РёРЅ Рё РјРµС‚Р°-РїСЂРѕРіСЂРµСЃСЃРёСЏ В«Р›Р°Р±РёСЂРёРЅС‚Р° Р‘РµР·РґРЅС‹В»

> Р”РёР·Р°Р№РЅ-РґРѕРє Рє СЂРµР°Р»РёР·Р°С†РёРё РІ `lib/labyrinth.ts` + `components/LabyrinthOfAbyss.tsx`.
> РўР°Р±Р»РёС†С‹ СЌС„С„РµРєС‚РѕРІ вЂ” РµРґРёРЅС‹Р№ РёСЃС‚РѕС‡РЅРёРє РїСЂР°РІРґС‹: РєРѕРЅСЃС‚Р°РЅС‚С‹ `TORCH_LEVELS`,
> `SPEED_LEVELS`, `MAX_HP_LEVELS`, `SWORD_DMG_LEVELS`, `EMBER_REVIVE_HP`
> РІ `lib/labyrinth.ts`. UI Р±РµСЂС‘С‚ РїРѕРґРїРёСЃРё РїСЂСЏРјРѕ РёР· РЅРёС… вЂ” СЂР°СЃСЃРёРЅС…СЂРѕРЅ РЅРµРІРѕР·РјРѕР¶РµРЅ.

---

## 1. РљРѕРЅС†РµРїС†РёСЏ

**Р›Р°РіРµСЂСЊ РЎРёРєРµСЂР°** вЂ” РїСЂРёРІР°Р» РїРµСЂРµРґ СЃРїСѓСЃРєРѕРј: РµРґРёРЅСЃС‚РІРµРЅРЅРѕРµ С‚С‘РїР»РѕРµ РјРµСЃС‚Рѕ РІ РёРіСЂРµ.
Р—РґРµСЃСЊ РёРіСЂРѕРє С‚СЂР°С‚РёС‚ ORB, Р·Р°СЂР°Р±РѕС‚Р°РЅРЅС‹Р№ РІ Р‘РµР·РґРЅРµ, РЅР° **РїРѕСЃС‚РѕСЏРЅРЅС‹Рµ** Р°РїРіСЂРµР№РґС‹ вЂ”
РѕРЅРё РїРµСЂРµР¶РёРІР°СЋС‚ Р»СЋР±СѓСЋ СЃРјРµСЂС‚СЊ. Р­С‚Рѕ РѕС‚РІРµС‡Р°РµС‚ РЅР° РіР»Р°РІРЅСѓСЋ С„СЂСѓСЃС‚СЂР°С†РёСЋ СЂРѕРіР°Р»РёРєР°
(В«СЏ СѓРјРµСЂ вЂ” РІСЃС‘ Р·СЂСЏВ») Рё СЃРѕР·РґР°С‘С‚ РґР»РёРЅРЅС‹Р№ С†РёРєР» СѓРґРµСЂР¶Р°РЅРёСЏ: РєР°Р¶РґС‹Р№ Р·Р°Р±РµРі
РїСЂРёР±Р»РёР¶Р°РµС‚ СЃР»РµРґСѓСЋС‰РёР№ СѓСЂРѕРІРµРЅСЊ.

РЎС‚СЂСѓРєС‚СѓСЂР° РїРѕРІС‚РѕСЂСЏРµС‚ РїСЂРѕРІРµСЂРµРЅРЅС‹Р№ РїР°С‚С‚РµСЂРЅ `UPGRADE_DEFS` РёР· App.tsx:
5 СѓСЂРѕРІРЅРµР№, СЂР°СЃС‚СѓС‰Р°СЏ С†РµРЅР°, СЏРІРЅС‹Р№ В«NOW в†’ NEXTВ».

---

## 2. РџСЏС‚СЊ Р°РїРіСЂРµР№РґРѕРІ

### рџ”¦ Abyss Torch вЂ” СЂР°РґРёСѓСЃ СЃРІРµС‚Р° С„Р°РєРµР»Р°
РўСѓРјР°РЅ РІРѕР№РЅС‹ вЂ” РіР»Р°РІРЅС‹Р№ РёСЃС‚РѕС‡РЅРёРє СЃС‚СЂР°С…Р° Рё РіР»Р°РІРЅС‹Р№ С‚РѕСЂРјРѕР· С„Р°СЂРјР°. Р‘РѕР»СЊС€Рµ СЃРІРµС‚Р° =
СЂР°РЅСЊС€Рµ РІРёРґРёС€СЊ Р»РѕРІСѓС€РєРё, РіРµРјС‹ Рё Р·Р°СЃР°РґС‹. РЎР°РјС‹Р№ В«РѕС‰СѓС‰Р°РµРјС‹Р№В» Р°РїРіСЂРµР№Рґ.

| РЈСЂРѕРІРµРЅСЊ | Р Р°РґРёСѓСЃ (РєР»РµС‚РѕРє) | Р¦РµРЅР°, ORB | Р’СЃРµРіРѕ РїРѕС‚СЂР°С‡РµРЅРѕ |
|---|---|---|---|
| 0 | 5.6 | вЂ” | вЂ” |
| 1 | 6.1 | 600 | 600 |
| 2 | 6.6 | 1 800 | 2 400 |
| 3 | 7.1 | 4 500 | 6 900 |
| 4 | 7.6 | 11 000 | 17 900 |
| 5 | 8.1 | 26 000 | 43 900 |

### рџ‘ў Swift Greaves вЂ” СЃРєРѕСЂРѕСЃС‚СЊ РїРµСЂРµРґРІРёР¶РµРЅРёСЏ
Р‘Р°Р·Р° 12 РµРґ/СЃ РїСЂРѕС‚РёРІ 5.5 Сѓ РўРµРЅРµР№ Рё 3.6 Сѓ РЎС‚СЂР°Р¶Р°. РљР°Р¶РґС‹Р№ СѓСЂРѕРІРµРЅСЊ +1: РЅР° РјР°РєСЃРёРјСѓРјРµ
(+42 %) РёРіСЂРѕРє Р±СѓРєРІР°Р»СЊРЅРѕ РїРµСЂРµС‚РµРєР°РµС‚ РїРѕ Р»Р°Р±РёСЂРёРЅС‚Сѓ Рё РїРѕР·РІРѕР»СЏРµС‚ СЃРµР±Рµ РєР°Р№С‚РёС‚СЊ РЎС‚СЂР°Р¶Р°.

| РЈСЂРѕРІРµРЅСЊ | РЎРєРѕСЂРѕСЃС‚СЊ | Р¦РµРЅР°, ORB | Р’СЃРµРіРѕ |
|---|---|---|---|
| 0 | 12 | вЂ” | вЂ” |
| 1 | 13 | 500 | 500 |
| 2 | 14 | 1 500 | 2 000 |
| 3 | 15 | 4 000 | 6 000 |
| 4 | 16 | 10 000 | 16 000 |
| 5 | 17 | 24 000 | 40 000 |

### вќ¤пёЏвЂЌрџ”Ґ Abyssal Vigor вЂ” РјР°РєСЃРёРјСѓРј HP
+20 HP Р·Р° СѓСЂРѕРІРµРЅСЊ, РґРѕ 200 РЅР° РјР°РєСЃРёРјСѓРјРµ. Р’ С†РёС„СЂР°С… Р‘РµР·РґРЅС‹: СѓРґР°СЂ РЎС‚СЂР°Р¶Р° 24,
Р‘СЂСѓС‚Р° 15, Р»РѕРІСѓС€РєР° 10 вЂ” РјР°РєСЃРёРјР°Р»СЊРЅС‹Р№ Р·Р°РїР°СЃ РїСЂРµРІСЂР°С‰Р°РµС‚ В«РґРІРµ РѕС€РёР±РєРё Рё С‚СЂСѓРїВ»
РІ В«РµСЃС‚СЊ РїСЂР°РІРѕ РЅР° РѕСЃР°РґСѓ РЎС‚СЂР°Р¶Р°В».

| РЈСЂРѕРІРµРЅСЊ | Max HP | Р¦РµРЅР°, ORB | Р’СЃРµРіРѕ |
|---|---|---|---|
| 0 | 100 | вЂ” | вЂ” |
| 1 | 120 | 700 | 700 |
| 2 | 140 | 2 000 | 2 700 |
| 3 | 160 | 5 000 | 7 700 |
| 4 | 180 | 12 000 | 19 700 |
| 5 | 200 | 28 000 | 47 700 |

### вљ”пёЏ Runeblade вЂ” СѓСЂРѕРЅ РјРµС‡Р°
+10 Р·Р° СѓСЂРѕРІРµРЅСЊ. Р‘СЂРµР№РєРїРѕРёРЅС‚С‹ РїСЂРѕРґСѓРјР°РЅС‹ РїРѕРґ HP РјРѕРЅСЃС‚СЂРѕРІ: СѓР¶Рµ **СѓСЂРѕРІРµРЅСЊ 1**
(60 СѓСЂРѕРЅР°) СѓР±РёРІР°РµС‚ РўРµРЅСЊ (60 HP) СЃ РѕРґРЅРѕРіРѕ СѓРґР°СЂР° РІРјРµСЃС‚Рѕ РґРІСѓС… вЂ” РјРіРЅРѕРІРµРЅРЅРѕ
РѕС‰СѓС‚РёРјР°СЏ РїРѕРєСѓРїРєР°; СѓСЂРѕРІРµРЅСЊ 3 (80) РІР°Р»РёС‚ Р‘СЂСѓС‚Р° (150 HP) Р·Р° РґРІР° СѓРґР°СЂР°; РјР°РєСЃРёРјСѓРј
(100) СЂРµР¶РµС‚ РЎС‚СЂР°Р¶Р° (700 HP) Р·Р° 7 СѓРґР°СЂРѕРІ РІРјРµСЃС‚Рѕ 14.

| РЈСЂРѕРІРµРЅСЊ | РЈСЂРѕРЅ | РўРµРЅСЊ (60) | Р‘СЂСѓС‚ (150) | РЎС‚СЂР°Р¶ (700) | Р¦РµРЅР°, ORB | Р’СЃРµРіРѕ |
|---|---|---|---|---|---|---|
| 0 | 50 | 2 СѓРґР°СЂР° | 3 | 14 | вЂ” | вЂ” |
| 1 | 60 | **1 СѓРґР°СЂ** | 3 | 12 | 800 | 800 |
| 2 | 70 | 1 | 3 | 10 | 2 400 | 3 200 |
| 3 | 80 | 1 | **2** | 9 | 6 000 | 9 200 |
| 4 | 90 | 1 | 2 | 8 | 14 000 | 23 200 |
| 5 | 100 | 1 | 2 | **7** | 30 000 | 53 200 |

### рџ•ЇпёЏ Second Torch вЂ” СЃС‚СЂР°С…РѕРІРєР° РѕС‚ СЃРјРµСЂС‚Рё (СЂР°Р· Р·Р° Р·Р°Р±РµРі)
РђРЅР°Р»РѕРі Streak Shields: РѕРґРёРЅ СЂР°Р· Р·Р° Р·Р°Р±РµРі СЃРјРµСЂС‚РµР»СЊРЅС‹Р№ СѓРґР°СЂ РЅРµ СѓР±РёРІР°РµС‚ вЂ”
В«РІС‚РѕСЂРѕР№ С„Р°РєРµР» РІСЃРїС‹С…РёРІР°РµС‚В», РёРіСЂРѕРє РѕСЃС‚Р°С‘С‚СЃСЏ Р¶РёРІ, РѕРєСЂСѓР¶Р°СЋС‰РёРµ РјРѕРЅСЃС‚СЂС‹ РѕС‚Р»РµС‚Р°СЋС‚
СѓРґР°СЂРЅРѕР№ РІРѕР»РЅРѕР№ Рё РїРѕР»СѓС‡Р°СЋС‚ ~2 СЃ РїР°СѓР·С‹ Р°С‚Р°РєРё (grace-РїРµСЂРёРѕРґ, РёРЅР°С‡Рµ РїСЂРё 1 HP
РґРѕР±РёР»Рё Р±С‹ С‚РµРј Р¶Рµ С‚РёРєРѕРј). РЈСЂРѕРІРЅРё РїРѕРІС‹С€Р°СЋС‚ HP РїРѕСЃР»Рµ РІСЃРїС‹С€РєРё вЂ” РѕС‚ В«РЅР° РІРѕР»РѕСЃРєРµВ»
РґРѕ РїРѕР»РЅРѕС†РµРЅРЅРѕРіРѕ РІС‚РѕСЂРѕРіРѕ РґС‹С…Р°РЅРёСЏ. РЎР°РјС‹Р№ РґРѕСЂРѕРіРѕР№ Р°РїРіСЂРµР№Рґ: РѕРЅ СЃС‚СЂР°С…СѓРµС‚ РІСЃРµ
РЅРµСЃРѕР±СЂР°РЅРЅС‹Рµ РЅР°РіСЂР°РґС‹ Р·Р°Р±РµРіР°.

| РЈСЂРѕРІРµРЅСЊ | Р­С„С„РµРєС‚ | Р¦РµРЅР°, ORB | Р’СЃРµРіРѕ |
|---|---|---|---|
| 0 | РЅРµС‚ СЃС‚СЂР°С…РѕРІРєРё | вЂ” | вЂ” |
| 1 | РІС‹Р¶РёС‚СЊ СЃ 1 HP | 1 200 | 1 200 |
| 2 | РІС‹Р¶РёС‚СЊ СЃ 20 HP | 3 000 | 4 200 |
| 3 | РІС‹Р¶РёС‚СЊ СЃ 35 HP | 8 000 | 12 200 |
| 4 | РІС‹Р¶РёС‚СЊ СЃ 50 HP | 18 000 | 30 200 |
| 5 | РІС‹Р¶РёС‚СЊ СЃ 75 HP | 40 000 | 70 200 |

Р’ HUD РїСЂРё Р°РєС‚РёРІРЅРѕР№ СЃС‚СЂР°С…РѕРІРєРµ РіРѕСЂРёС‚ Р·РЅР°С‡РѕРє рџ•ЇпёЏ; РїРѕСЃР»Рµ СЃСЂР°Р±Р°С‚С‹РІР°РЅРёСЏ РѕРЅ РіР°СЃРЅРµС‚.

---

## 3. Р­РєРѕРЅРѕРјРёРєР°: РїРѕС‡С‘Рј Рё РЅР°РґРѕР»РіРѕ Р»Рё

**Р”РѕС…РѕРґ РѕРґРЅРѕРіРѕ Р·Р°Р±РµРіР°** (РІС‹РїР»Р°С‚С‹ РёР· `lib/labyrinth.ts`): РўРµРЅСЊ 150 Г— ~24 С€С‚,
Р‘СЂСѓС‚ 400 Г— ~6 С€С‚, РЎС‚СЂР°Р¶ 3 000, Р»СѓС‚ 15 С€С‚ (40 % Р°СЂС‚РµС„Р°РєС‚ 500 / 60 % СЃСѓРЅРґСѓРє
200 в†’ РјР°С‚РѕР¶РёРґР°РЅРёРµ 4 800), Р±РѕРЅСѓСЃ РІС‹С…РѕРґР° 1 000.

- РРґРµР°Р»СЊРЅС‹Р№ РїРѕР»РЅС‹Р№ РєР»РёСЂ: **в‰€ 14 800 ORB**.
- Р РµР°Р»РёСЃС‚РёС‡РЅС‹Р№ СЃСЂРµРґРЅРёР№ Р·Р°Р±РµРі (С‡Р°СЃС‚РёС‡РЅС‹Р№ РєР»РёСЂ, СЃРјРµСЂС‚Рё): **3 000вЂ“6 000 ORB**
  Р·Р° 5вЂ“8 РјРёРЅСѓС‚.
- Р’С…РѕРґ 30 вљЎ РїСЂРё СЂРµРіРµРЅРµ 3 вљЎ/РјРёРЅ в†’ СѓСЃС‚РѕР№С‡РёРІРѕ ~6 Р·Р°Р±РµРіРѕРІ/С‡Р°СЃ, РїРёРєРѕРІРѕ Р±РѕР»СЊС€Рµ
  Р·Р° СЃС‡С‘С‚ Р·Р°РїР°СЃР° СЌРЅРµСЂРіРёРё. РС‚РѕРіРѕ **~20 000вЂ“30 000 ORB/С‡Р°СЃ** Р°РєС‚РёРІРЅРѕР№ РёРіСЂС‹.

**РЎС‚РѕРёРјРѕСЃС‚СЊ РїРѕР»РЅРѕРіРѕ РјР°РєСЃРёРјСѓРјР°:** 43 900 + 40 000 + 47 700 + 53 200 + 70 200 =
**255 000 ORB** в†’ **~10вЂ“13 С‡Р°СЃРѕРІ С‡РёСЃС‚РѕР№ РёРіСЂС‹**, РЅР° РїСЂР°РєС‚РёРєРµ 1,5вЂ“2 РЅРµРґРµР»Рё
РµР¶РµРґРЅРµРІРЅС‹С… СЃРµСЃСЃРёР№. РљСЂРёРІР°СЏ РґРѕС„Р°РјРёРЅР°:

- РџРµСЂРІС‹Р№ СѓСЂРѕРІРµРЅСЊ Р»СЋР±РѕР№ РІРµС‚РєРё (500вЂ“1 200) вЂ” РѕРєСѓРїР°РµС‚СЃСЏ **РїРµСЂРІС‹Рј Р¶Рµ Р·Р°Р±РµРіРѕРј**.
- Р’СЃРµ РІРµС‚РєРё РїРѕ СѓСЂРѕРІРЅСЋ 2 (~14 500) вЂ” 2-Р№вЂ“3-Р№ РґРµРЅСЊ.
- РЈСЂРѕРІРЅРё 4вЂ“5 вЂ” РґРѕР»РіРѕСЃСЂРѕС‡РЅС‹Рµ С†РµР»Рё В«РЅР° СЃРµР·РѕРЅВ», Рё Рє СЌС‚РѕРјСѓ РјРѕРјРµРЅС‚Сѓ РїСЂРѕРєР°С‡Р°РЅРЅС‹Р№
  РёРіСЂРѕРє С„Р°СЂРјРёС‚ СѓР¶Рµ Р±С‹СЃС‚СЂРµРµ (СЃР°Рј Р°РїРіСЂРµР№Рґ СѓСЃРєРѕСЂСЏРµС‚ РґРѕР±С‹С‡Сѓ вЂ” РїРѕР»РѕР¶РёС‚РµР»СЊРЅР°СЏ
  СЃРїРёСЂР°Р»СЊ, РѕРіСЂР°РЅРёС‡РµРЅРЅР°СЏ РїРѕС‚РѕР»РєРѕРј РёР· 5 СѓСЂРѕРІРЅРµР№).

Р¦РµРЅС‹ СЃРѕРїРѕСЃС‚Р°РІРёРјС‹ СЃ App-С€РѕРїРѕРј (С‚Р°Рј РІРµС‚РєР° СЃС‚РѕРёС‚ 41 000вЂ“52 000), РЅРѕ С‡СѓС‚СЊ РІС‹С€Рµ вЂ”
РІС‹РїР»Р°С‚С‹ Р›Р°Р±РёСЂРёРЅС‚Р° С‰РµРґСЂРµРµ С‚Р°РїР°Р»РєРё.

---

## 4. SOL-РѕС„С„РµСЂ: рџЏ® Abyss Lantern вЂ” 0.05 SOL

Р•РґРёРЅСЃС‚РІРµРЅРЅР°СЏ РїСЂРµРјРёСѓРј-РєР°СЂС‚РѕС‡РєР° Р»Р°РіРµСЂСЏ (РїРѕ РїР°С‚С‚РµСЂРЅСѓ РѕСЃС‚Р°Р»СЊРЅС‹С… РёРіСЂ вЂ” РЅРёРєР°РєРѕР№
РЅРѕРІРѕР№ РјРµС…Р°РЅРёРєРё РѕРїР»Р°С‚С‹, С‚РѕР»СЊРєРѕ РІС‹Р·РѕРІ РєРѕР»Р±СЌРєР°):

- **РљРѕСЃРјРµС‚РёРєР°:** РїР»Р°РјСЏ С„Р°РєРµР»Р° РЎРёРєРµСЂР° СЃС‚Р°РЅРѕРІРёС‚СЃСЏ РїСЂРёР·СЂР°С‡РЅРѕ-РіРѕР»СѓР±С‹Рј вЂ” С‚С‘РїР»С‹Рµ
  РіСЂР°РґРёРµРЅС‚С‹ СЃРІРµС‚Р° Рё СѓРіРѕР»СЊРєРё РІ СЂРµРЅРґРµСЂРµ РїРµСЂРµРєСЂР°С€РёРІР°СЋС‚СЃСЏ РІ СЃРїРµРєС‚СЂР°Р»СЊРЅС‹Р№ С†РёР°РЅ
  (СЃРєРѕРЅСЃС‹ РЅР° СЃС‚РµРЅР°С… РѕСЃС‚Р°СЋС‚СЃСЏ С‚С‘РїР»С‹РјРё, С‚РёР»-СЌРЅРґ-РѕСЂР°РЅР¶ РіСЂРµР№РґРёРЅРі СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ).
  РЎРєСЂРёРЅС€РѕС‚С‹ РІР»Р°РґРµР»СЊС†Р° РјРіРЅРѕРІРµРЅРЅРѕ РѕС‚Р»РёС‡РёРјС‹ вЂ” СЃРѕС†РёР°Р»СЊРЅС‹Р№ С„Р»РµРєСЃ.
- **Р“РµР№РјРїР»РµР№:** +0.4 РєР»РµС‚РєРё Рє СЂР°РґРёСѓСЃСѓ СЃРІРµС‚Р° (`LANTERN_TORCH_BONUS`) вЂ” Р·Р°РјРµС‚РЅРѕ,
  РЅРѕ РјРµРЅСЊС€Рµ РѕРґРЅРѕРіРѕ СѓСЂРѕРІРЅСЏ Abyss Torch: **РЅРµ pay-to-win**.
- **РќР°РІСЃРµРіРґР°:** РѕРґРЅР° РїРѕРєСѓРїРєР°, С…СЂР°РЅРёС‚СЃСЏ РІРјРµСЃС‚Рµ СЃ СѓСЂРѕРІРЅСЏРјРё Р»Р°РіРµСЂСЏ.
- Р РµР°Р»РёР·Р°С†РёСЏ: `onPaySol(50_000_000, 0.05, 'labyrinth_abyss_lantern')`.
  РЈСЃРїРµС€РЅС‹Р№ `await` в†’ owned. Р•СЃР»Рё `onPaySol` РЅРµ РїРµСЂРµРґР°РЅ вЂ” РєРЅРѕРїРєР° РІ СЃРѕСЃС‚РѕСЏРЅРёРё
  **COMING SOON** (Р·Р°РґРёР·РµР№Р±Р»РµРЅР°). Р›РѕРіРёРєРё РїР»Р°С‚РµР¶Р° РІ РєРѕРјРїРѕРЅРµРЅС‚Рµ РЅРµС‚ вЂ” С‚РѕР»СЊРєРѕ
  РІС‹Р·РѕРІ РєРѕР»Р±СЌРєР° (СЃС‚Р°Р± РїРѕ РўР—).

---

## 5. РЎРїРµС†РёС„РёРєР°С†РёСЏ СЌРєСЂР°РЅР° В«Р›Р°РіРµСЂСЊВ»

**Р’С…РѕРґ:** РєРЅРѕРїРєР° `в›є SEEKER'S CAMP` РЅР° СЌРєСЂР°РЅРµ РјРµРЅСЋ, СЃСЂР°Р·Сѓ РїРѕРґ `в–ј DESCEND` вЂ”
С‚С‘РјРЅР°СЏ (rgba(8,13,30,0.88)), СЂРѕР·РѕРІР°СЏ СЂР°РјРєР° #EC4899, Р±РµР№РґР¶ `LV n` (СЃСѓРјРјР°
СѓСЂРѕРІРЅРµР№) РёР»Рё `NEW` РґР»СЏ РЅРѕРІРёС‡РєР°.

**РџР°РЅРµР»СЊ** вЂ” РѕРІРµСЂР»РµР№ РїРѕРІРµСЂС… Р¶РёРІРѕРіРѕ РєРёРЅРµРјР°С‚РѕРіСЂР°С„РёС‡РЅРѕРіРѕ РјРµРЅСЋ (Skia-С„РѕРЅ СЃ
РїРѕСЂС‚Р°Р»РѕРј РїСЂРѕРґРѕР»Р¶Р°РµС‚ Р°РЅРёРјРёСЂРѕРІР°С‚СЊСЃСЏ РїРѕРґ РїРѕР»СѓРїСЂРѕР·СЂР°С‡РЅРѕР№ РїРѕРґР»РѕР¶РєРѕР№
rgba(2,4,12,0.94)):

- **РЁР°РїРєР°:** `в›є SEEKER'S CAMP` В· С‡РёРї Р±Р°Р»Р°РЅСЃР° `рџ’Ћ 12 450` (РёР»Рё рџ”’ РІ
  Р»РѕРє-СЃРѕСЃС‚РѕСЏРЅРёРё) В· РєСЂСѓРіР»Р°СЏ РєРЅРѕРїРєР° вњ•.
- **РџРѕРґР·Р°РіРѕР»РѕРІРѕРє:** "Permanent upgrades вЂ” forged once, kept through every death."
- **5 РєР°СЂС‚РѕС‡РµРє Р°РїРіСЂРµР№РґРѕРІ** (С„РѕРЅ #080D1E, СЃРєСЂСѓРіР»РµРЅРё 18, СЂР°РјРєР° = С†РІРµС‚ РІРµС‚РєРё):
  - РёРєРѕРЅРєР° РІ С†РІРµС‚РЅРѕРј С‚Р°Р№Р»Рµ, РёРјСЏ РІРµС‚РєРё РµС‘ Р°РєС†РµРЅС‚РЅС‹Рј С†РІРµС‚РѕРј, РѕРїРёСЃР°РЅРёРµ;
  - **РїРёРїСЃС‹ СѓСЂРѕРІРЅСЏ** вЂ” 5 РєРІР°РґСЂР°С‚РёРєРѕРІ, Р·Р°Р»РёС‚С‹Рµ = РєСѓРїР»РµРЅРЅС‹Рµ СѓСЂРѕРІРЅРё, + `LV n/5`;
  - СЃС‚СЂРѕРєР° **NOW в†’ NEXT** (РЅР° РјР°РєСЃРёРјСѓРјРµ NEXT СЃРєСЂС‹С‚, РІРјРµСЃС‚Рѕ РєРЅРѕРїРєРё вЂ” `вњ¦ MAX`);
  - РєРЅРѕРїРєР° С†РµРЅС‹: Р·Р°Р»РёС‚Р° С†РІРµС‚РѕРј РІРµС‚РєРё РµСЃР»Рё С…РІР°С‚Р°РµС‚ ORB; `NEED 1 250` СЃРµСЂС‹Рј
    РµСЃР»Рё РЅРµ С…РІР°С‚Р°РµС‚ (disabled); `рџ”’ LOCKED` РµСЃР»Рё СЌРєРѕРЅРѕРјРёРєР° РЅРµ РїРѕРґРєР»СЋС‡РµРЅР°;
  - **tier glow:** СЂР°РјРєР° Рё С‚РµРЅСЊ РєР°СЂС‚РѕС‡РєРё СЂР°Р·РіРѕСЂР°СЋС‚СЃСЏ СЃ СѓСЂРѕРІРЅРµРј
    (alpha 38в†’66в†’CC, shadowOpacity 0.1 + 0.09/СѓСЂРѕРІРµРЅСЊ);
  - **РїРѕРєСѓРїРєР°:** Р·РІСѓРє `levelup`, РїСѓР»СЊСЃ РјР°СЃС€С‚Р°Р±Р° РєР°СЂС‚РѕС‡РєРё (Animated,
    native driver) + РІСЃРїС‹С€РєР° `в–І LEVEL UP` РІ СѓРіР»Сѓ.
- **РљР°СЂС‚РѕС‡РєР° SOL** РІРЅРёР·Сѓ: С‚С‘РјРЅРѕ-РїСѓСЂРїСѓСЂРЅС‹Р№ С„РѕРЅ #0b0618, СЂРѕР·РѕРІРѕРµ СЃРІРµС‡РµРЅРёРµ,
  РєРёРєРµСЂ `в—† PREMIUM В· PAY WITH SOL`, РёРєРѕРЅРєР° рџЏ® РІ С†РёР°РЅРѕРІРѕРј С‚Р°Р№Р»Рµ, РєРЅРѕРїРєР°
  `в—Ћ 0.05 SOL` в†’ `CONFIRMINGвЂ¦` в†’ `вњ¦ OWNED` (РёР»Рё `COMING SOON`).

**РђРєС†РµРЅС‚С‹ РїР°Р»РёС‚СЂС‹:** С„Р°РєРµР» #F59E0B, СЃРєРѕСЂРѕСЃС‚СЊ #22D3EE, HP #22C55E,
РєР»РёРЅРѕРє #A855F7, СЃС‚СЂР°С…РѕРІРєР° #EC4899 вЂ” С‚Рµ Р¶Рµ СЃРµРјРµР№СЃС‚РІР°, С‡С‚Рѕ tier-Р±РµР№РґР¶Рё С€РѕРїР°.

**РџРµСЂСЃРёСЃС‚РµРЅС‚РЅРѕСЃС‚СЊ:** AsyncStorage `sk_labyrinth_upgrades_v1` вЂ” JSON
`{ torch, speed, vigor, blade, ember, lantern }`, СѓСЂРѕРІРЅРё РєР»Р°РјРїСЏС‚СЃСЏ РїСЂРё
Р·Р°РіСЂСѓР·РєРµ (РїР°С‚С‚РµСЂРЅ BEST_KEY).

---

## 6. РљРѕРЅС‚СЂР°РєС‚ РёРЅС‚РµРіСЂР°С†РёРё (РґР»СЏ App.tsx вЂ” РќР• СЃРґРµР»Р°РЅРѕ РЅР°РјРµСЂРµРЅРЅРѕ)

РќРѕРІС‹Рµ РїСЂРѕРїСЃС‹ **РѕРїС†РёРѕРЅР°Р»СЊРЅС‹**, С‚РµРєСѓС‰Р°СЏ РїСЂРѕРІРѕРґРєР° СЂР°Р±РѕС‚Р°РµС‚ Р±РµР· РёР·РјРµРЅРµРЅРёР№
(Р»Р°РіРµСЂСЊ РІРёРґРµРЅ РІ РїСЂРµРІСЊСЋ-СЂРµР¶РёРјРµ СЃ рџ”’):

```tsx
<LabyrinthOfAbyss
  ...СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ РїСЂРѕРїСЃС‹...
  orb={orb}                                   // Р±Р°Р»Р°РЅСЃ РґР»СЏ Р»Р°РіРµСЂСЏ
  onSpendOrb={(n) => setOrb(p => p - n)}      // СЃРїРёСЃР°РЅРёРµ РїСЂРё РїРѕРєСѓРїРєРµ
  onPaySol={paySolToTreasury}                 // РїСЂРµРјРёСѓРј-РѕС„С„РµСЂ (0.05 SOL)
/>
```

Р“РµР№Рј-СЌС„С„РµРєС‚С‹ РёРґСѓС‚ С‡РµСЂРµР· `L.createRun(upgrades)` вЂ” РїР°СЂР°РјРµС‚СЂ РѕРїС†РёРѕРЅР°Р»РµРЅ,
`createRun()` Р±РµР· Р°СЂРіСѓРјРµРЅС‚Р° РёРґРµРЅС‚РёС‡РµРЅ РїСЂРµР¶РЅРµРјСѓ РїРѕРІРµРґРµРЅРёСЋ.

```

