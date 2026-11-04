# Home page localization — 2026-11-04

Supersedes the two-language home v2 limitation. Checkout and payment logic are unchanged.

19 complete dictionaries: en, fa, ar, ur, tr, ru, zh-hans, zh-hant, id, vi, es, fr, de, hi, ja, ko, it, pt, az.

Language precedence: saved manual preference; explicit supported lang URL; first supported navigator.languages entry / navigator.language; English fallback. Saved `auto` ignores URL language and follows the browser. Selecting Browser language restores auto mode. Browser languagechange events affect auto mode only. Local storage failures do not prevent operation. fa/ar/ur use RTL. No IP or geographic language inference.

Translations include scanner, permissions, privacy and error messages. Native-language review is still recommended. Browser language means the language exposed by Pi Browser to JavaScript, not a separately inaccessible Pi account preference.

Run `node --test tests/home-*.test.cjs` for unit tests. Browser tests require Playwright and Chromium: `node tests/home-languages-ui.cjs` and `node tests/home-ui.cjs`. Browser tests mock backend/SDK; real Pi Browser acceptance remains necessary.

Acceptance: fresh browser storage selects browser locale; manual change survives reload; Browser language restores auto; Persian/Arabic/Urdu use RTL; scan an existing app QR and ensure the checkout retains its token. Do not pay again merely to test language.
