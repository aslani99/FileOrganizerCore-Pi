# FileOrganizerCore — راهنمای وب و تاریخچهٔ تغییرات

## راهنمای فعلی

منبع انتشار سایت، پوشهٔ `web/` همین مخزن است؛ workflow در `.github/workflows/static.yml` آن را منتشر می‌کند. `web/index.html` صفحهٔ اصلی و `web/checkout.html` صفحهٔ پرداخت است. برای اصلاح منطق صفحهٔ اصلی، فایل‌های منبع `web/assets/home-*.js` را ویرایش و سپس از ریشهٔ این مخزن دستور `node scripts/build-home.cjs` را اجرا کنید تا `home-runtime.js` بازسازی شود.

تنظیمات عمومی در `web/config.js` است. فایل‌های `checkout.js` و `checkout-i18n.js` متعلق به پرداخت هستند. اسکنر QR به `assets/vendor/jsQR-1.4.0.js` و مجوز آن نیاز دارد.

دامنهٔ مقصد `fileorganizercore.ir` است؛ فعال‌شدن DNS/HTTPS و تنظیم پنل‌ها از تغییر فایل CNAME جدا است. وضعیت فعال‌بودن دامنه در این پاک‌سازی تأیید نشده. شبکه و کلیدهای پرداخت در این پاک‌سازی تغییر نکرده‌اند.

فایل‌های `app.js`، `assets/style.css` و `recovery-text.js` فعلاً حفظ شده‌اند؛ حذف آن‌ها بدون بررسی مسیرهای قدیمی، کش مرورگر و تست پرداخت انجام نمی‌شود.

## مرجع وضعیت

نقشهٔ راه اصلی در مخزن دسکتاپ: `PROJECT_STATUS_MASTER_2026-10-22.md`. روش و وضعیت تست‌های پرداخت در `docs/PAYMENT_TEST_RUNBOOK.md` همان مخزن است. هیچ تست پرداخت جدیدی با این ادغام موفق اعلام نشده است.

## تاریخچهٔ ادغام‌شده

بخش‌های زیر مستندات تاریخی هستند و کامل حفظ شده‌اند؛ دستورها و وضعیت‌های قدیمی (از جمله دو زبانه بودن سایت، آدرس‌ها و نام برند قبلی) الزاماً وضعیت فعلی نیستند. آن‌ها را بدون تطبیق با کد فعلی اجرا نکنید. نام فایل‌های پچ تاریخی برای ردیابی تغییر نکرده است.


---

## منبع تاریخی: docs/HOME_REDESIGN_2026-11-04.md

# FileOrganizerPro landing page — 2026-11-04

## Scope and source
- User supplied index(1).html is the exact v2 patch baseline, mapped to web/index.html in FileOrganizerPro-Pi.
- New assets use distinct names. Existing checkout files, config.js, app.js, global assets/style.css, privacy.html and terms.html are not overwritten.
- Landing page is Persian/English with RTL/LTR and persisted light/dark theme. This does not change the 19-language checkout.

## Implemented
- Responsive product home, inline SVG icons, features, server-driven plan cards, FAQ, download state, Pi username connection, and QR checkout entry.
- Camera scan, local PNG/JPEG/WebP QR decoding (12 MB file limit and 40 MP decoded image limit), manual URL input. Bundled jsQR 1.4.0 with Apache-2.0 license; no scanner CDN or image upload.
- Camera explicitly requested by user; audio false; rear camera preferred; switch camera, light when supported, stop button; cancellation on close, Escape, hidden page and pagehide. Late camera permission cannot leave a stream running after close.
- QR destinations restricted to the hosted checkout and known FileOrganizerPro checkout routes; HTTPS, single bounded token, no credentials/hash/unknown query keys. No automatic navigation or payment. Optional CHECKOUT_URL public config permits an additional exact checkout route.
- Price data uses plan_id, correct duration_days and organization_limit_bytes. No fallback price/quota is fabricated. Pi estimate only shown for a valid positive amount with a nonmanual source and timestamp within 30 minutes. Final price remains server checkout authority. User-controlled retry and 15-second request timeout.
- Plan selection opens the app-QR flow. It does not pretend Pi username authentication creates/links a Supabase email account or purchases a plan. Free plan points to the installer section.
- Optional Pi SDK loads only after user action, using config.PI_SANDBOX, username scope only. No token persistence/logging, no duplicate auth while pending. Disconnect clears this page's connection, not the Pi wallet session.
- Missing installer URL produces a clear unavailable message; no fake # download. Valid HTTPS DOWNLOAD_URL activates download.
- Camera/privacy explanation and preference clearing; existing product privacy/terms links retained.

## Validation
- Seven Node tests (including same-origin legacy checkout redirect/token/language and no redirect without a token); policy tests: checkout route/token checks, injection/foreign-host/redirect rejection, download protocols, stale/invalid Pi estimate, plan_id/quota validation.
- Twelve mocked Chromium combinations: fa/en × light/dark × 320/390/1280 widths. Actual QR image decoding; camera via fake media device; camera stop; manual link safety; Pi SDK mock; failed plan request and retry. Additional permission-denial, late permission and hidden-page stop checks in the 390px Persian dark case.
- Screenshots are of mocked plan data, not production price evidence. Browser test does not prove hardware camera or Pi wallet interoperability.
- Patch application checked against the uploaded index with both LF and CRLF.

## Remaining / acceptance
- Owner must provide the real HTTPS installer URL in existing web/config.js DOWNLOAD_URL; current known value is #. No guessed download endpoint.
- Test camera permission and QR focus on Android/iOS Pi Browser; if unsupported/denied, image/manual path remains available. Camera requires secure context/browser support.
- Test actual Pi username connection in Pi Browser. No real payment was created by these tests.
- Verify deployed plans access under the existing publishable/anon key and checkout link routing. Backend RLS or release hosting changes were not made.
- Existing product privacy/terms pages were not supplied as current files and are not rewritten. Archived copies contain placeholders and outdated claims (always-copy, per-run quota); owner/current-file review is still required before launch.
- No new Mainnet readiness or payment test pass is claimed. Test 10 remains blocked; earlier 14-test statuses and desktop watcher acceptance are unchanged.

## Reproduction
From FileOrganizerPro-Pi:

```bash
node --test tests/home-policy.test.cjs
```

Optional full mocked browser test after installing Playwright 1.51.1 and Chromium:

```bash
node tests/home-ui.cjs
```

## v2 repair
The first patch failed the user’s check because their current index includes a legacy root checkout redirect, a versioned config URL and Pi diagnostics. v2 is rebuilt on that exact uploaded CRLF file; these behaviors are retained. Diagnostic events use fixed stage names without tokens, URLs, SDK payloads or account details. Apply only v2, not the failed original patch.


---

## منبع تاریخی: HOME_LANGUAGES_2026-11-04.md

# Home page localization — 2026-11-04

Supersedes the two-language home v2 limitation. Checkout and payment logic are unchanged.

19 complete dictionaries: en, fa, ar, ur, tr, ru, zh-hans, zh-hant, id, vi, es, fr, de, hi, ja, ko, it, pt, az.

Language precedence: saved manual preference; explicit supported lang URL; first supported navigator.languages entry / navigator.language; English fallback. Saved `auto` ignores URL language and follows the browser. Selecting Browser language restores auto mode. Browser languagechange events affect auto mode only. Local storage failures do not prevent operation. fa/ar/ur use RTL. No IP or geographic language inference.

Translations include scanner, permissions, privacy and error messages. Native-language review is still recommended. Browser language means the language exposed by Pi Browser to JavaScript, not a separately inaccessible Pi account preference.

Run `node --test tests/home-*.test.cjs` for unit tests. Browser tests require Playwright and Chromium: `node tests/home-languages-ui.cjs` and `node tests/home-ui.cjs`. Browser tests mock backend/SDK; real Pi Browser acceptance remains necessary.

Acceptance: fresh browser storage selects browser locale; manual change survives reload; Browser language restores auto; Persian/Arabic/Urdu use RTL; scan an existing app QR and ensure the checkout retains its token. Do not pay again merely to test language.


---

## منبع تاریخی: HOME_TOOLBAR_FIX_2026-11-04.md

# Home toolbar and missing runtime assets — 2026-11-04

User confirmed the 19-language feature works in Pi Browser.

Diagnosis: the deployed home HTML references assets/home-policy.js and assets/vendor/jsQR-1.4.0.js, but both URLs returned HTTP 404 during inspection. The home controller loads, but an undefined policy breaks plan rendering, link validation and download setup; missing jsQR prevents scanning. This is an incomplete asset publication, not evidence of a GitHub service outage.

Fix: ship home-runtime.js containing jsQR (with its license), policy, locales, translations and controller. HTML loads config.js then this single runtime; no requests for missing individual JS dependencies. Rebuild after source edits with `node scripts/build-home.cjs`; publish the generated runtime as well. Config and checkout are untouched.

Toolbar: language globe with a native accessible language picker (19 languages + browser language), theme icon, Pi anchor that scrolls to the existing connection section without authenticating automatically. Labels/titles follow current language. Manual and browser-auto selection retained.

Acceptance: real Pi Browser must still confirm camera permissions/scanning, plan loading against the live backend, manual link validation and Pi section navigation after deployment. No real payment is needed for these checks. Payment test statuses are unchanged.


---

## منبع تاریخی: HOME_AUTOCAMERA_2026-11-04.md

# Home toolbar, browser theme and automatic camera — 2026-11-04

- Pi shortcut is translated text (Persian: اتصال به پای). At the logical outside edge: Pi, language, theme toward the inside; RTL/LTR mirror naturally. The existing desktop scan shortcut remains further inward.
- Theme is applied before page content from a valid saved preference, otherwise prefers-color-scheme. Browser theme changes are followed until the user selects a theme. The manual choice persists across reloads. Clearing preferences restores browser following. A site can only follow the color scheme exposed by Pi Browser, not an inaccessible separate app setting.
- Opening the QR scanner immediately calls getUserMedia. Removed the separate start-camera button. Closing/Escape/page hiding/manual stop still releases tracks. Late permission results after closure are stopped. Image and manual-link fallbacks remain available. To restart after a manual stop or permission change, close and reopen the scanner.
- Camera permission persistence is controlled by the browser/OS. The site does not clear or reset permission and cannot guarantee one lifetime prompt (private mode, revoked permissions or browser policy may prompt again).
- No checkout/payment, quota, account or download configuration changes.


---

## منبع تاریخی: HOME_HEADER_TOGGLE_2026-11-04.md

# Header and camera toggle — 2026-11-04
- Brand icon and FileOrganizerPro wordmark stay at the physical left in LTR order in every locale. Header stays one row; compact spacing and controls on narrow screens. Localized text retains its own direction.
- Pi connection shortcut text uses theme-aware purple. Physical control order from the brand toward the outside: theme, language, Pi connection.
- Scanner still starts camera on opening. Its single control stops/cancels active or pending capture and becomes the localized Start camera action. Restart works without closing the scanner. Closing/hiding continues to stop tracks, including late permission results.
- Camera permissions remain controlled by browser/OS. Checkout, account and download configuration untouched. Live Pi Browser acceptance remains required after publication.


---

## منبع تاریخی: HOME_HEADER_SIZING_2026-11-04.md

# Header control sizing — 2026-11-04
Consolidated conflicting header CSS rules. Theme/language controls are 44px square on desktop and 40px square on mobile. Pi connection shares the same height, radius and spacing, with content-sized width on larger screens and bounded width on narrow screens. Long translations can wrap inside the same-height button; the header stays one row. Brand icon/wordmark enlarged moderately with responsive sizing and stay physically left; localized button text keeps its language direction. Purple text retained. CSS cache version updated; JavaScript/camera/payment/config untouched.


---

## منبع تاریخی: PAGES_CHECKOUT_UPDATE.md

# GitHub Pages checkout update — 2026-10-22

Target repository: aslani99/FileOrganizerPro-Pi (not the desktop repository).
The existing .github/workflows/static.yml publishes ./web at the domain root.
Checkout URL: https://fileorganizerpro.mohammadaslanidev.ir/checkout.html

Changes:
- web/config.js now uses the current Supabase project mjkjmwgjtnuvnedvtgqo and its public publishable key already used by AdminDashboard. No privileged credentials are added.
- checkout.html loads config.js and checkout.js; no separate stale project configuration or payment-token debug panel.
- Root links containing ?token= redirect to checkout.html on the same site. New links should use /checkout.html directly.
- Completion, pending activation, confirmed/unconfirmed cancellation and incomplete-payment recovery match the payment lifecycle backend. Linked sessions cannot create a second payment.
- Obsolete GitHub rate schedule targeting the retired Supabase project is disabled. The working cron-job.org schedule remains the owner of current rate refresh. Manual invocation of the old workflow only displays a notice.
- Pi.init sandbox:false is for direct Pi Browser use. Testnet is selected by the registered Pi app/network and checked by the backend. Keep Supabase PI_SANDBOX=true and the Testnet application's PI_SERVER_API_KEY. The similarly named frontend setting controls desktop Sandbox embedding, not the backend network gate.

Install from a Git clone of FileOrganizerPro-Pi on main, matching the uploaded ZIP:

```bash
git apply --check --ignore-whitespace FileOrganizerPro-Pi-pages-2026-10-22.patch
git apply --ignore-whitespace FileOrganizerPro-Pi-pages-2026-10-22.patch
git diff --check
node --check web/checkout.js
node --check web/config.js
git add web/config.js web/checkout.html web/checkout.js web/index.html .github/workflows/refresh-pi-rate.yml PAGES_CHECKOUT_UPDATE.md
git commit -m "Align hosted Pi checkout with current payment backend"
git push origin main
```

Stop on an error; never force-apply or force-push. If the clone differs from the supplied ZIP, send the apply-check output.

In GitHub Settings > Pages, keep the existing custom domain and use GitHub Actions as the source for the provided workflow. Wait for Actions > Deploy static content to Pages to succeed. Keep the existing Cloudflare CNAME unchanged.

In Supabase Edge Functions > Secrets, set APP_PUBLIC_CHECKOUT_URL to the checkout URL above. No SQL migration or Edge Function redeploy is included in this patch. The previously supplied payment lifecycle migration/functions must already be deployed.

In Pi Developer Portal, use the Testnet application whose API key is on the server. Your App's URL remains https://fileorganizerpro.mohammadaslanidev.ir/ . Do not switch it to localhost for this phone test.

First open /checkout.html without a token: Checkout version: 2026-10-22 and a missing-link message confirm the new static page loaded (not that payment works). Then generate a fresh link/QR from the desktop app. Open the complete link including ?token=... inside Pi Browser on the phone. A real pending session should show its plan and amount. Complete a Test-Pi payment and verify status=completed, subscription_synced=true and the desktop subscription. Never share full token links, API keys, wallet phrases or access tokens.

Local verification: six Chromium tests with mocked Pi/Supabase: correct backend+amount+Pi Browser mode; root redirect; cancellation success/failure; pending activation; incomplete callback before authentication resolves; linked-session duplicate prevention. Actual GitHub deployment and real Testnet payment remain pending.

References:
https://github.com/pi-apps/pi-platform-docs/blob/master/SDK_reference.md
https://github.com/pi-apps/pi-platform-docs/blob/master/developer_portal.md


## Pi sign-in confirmation — 2026-11-08b
The desktop QR fragment carries lang and theme (light/dark). Theme is applied before paint; a direct link without theme falls back to the browser preference. Browser capabilities are removed from the visible history after parsing. No desktop session token is returned to this page.

Deploy the updated pi-auth handler BEFORE publishing this page: inspect responses must include server_now and expires_at. The countdown uses server time plus monotonic elapsed time. A timely approval gives the desktop a one-time two-minute confirmation window; no client may extend it. Failed approval responses are reconciled by inspecting the same capability. Accounts remain separate unless explicitly linked by their verified owner.

The 19-localized-language page has a loading code card, larger purple Core wordmark, separate Pi identity card (textContent, never HTML), green success/red error status, and explicit light/dark styling. Asset query version: 20261109.

Validation: node tests/pi-login-ui.cjs (Playwright; optional CHROME_PATH) covers 42 mocked browser cases, including opposite OS/app theme, skewed phone clock, safe username rendering, response loss and expiry. It does not replace a real Pi Browser test.

### 2026-11-09 additions
The red open-in-Pi-Browser notice is conditional: Pi Browser user-agent or a successful nativeFeaturesList response suppresses it. SDK script presence alone is not evidence of Pi Browser. This check only controls presentation, never identity authorization. Desktop countdown also uses the server deadline. All success/error status and identity labels stay localized.
