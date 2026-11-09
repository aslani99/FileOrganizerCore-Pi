# Camera lens selection — 2026-11-09

Baseline: quote-auth-website patch of 2026-11-09.

Root cause in code: facingMode:environment delegates selection of the rear lens to the browser. The previous switch toggled only user/environment and offered no per-lens selection. The phone-specific default lens cannot be confirmed without a device test.

Both login and payment use the same scanner. Changes:
- Enumerate available video inputs after permission and select by exact deviceId.
- Prefer labelled main/primary/1x rear camera over ultra-wide/telephoto/macro/front. Ordinary wide is not classified as ultra-wide. Ambiguous labels preserve the browser's current choice; manual selection is available.
- Add a localized camera dropdown and cycle all available devices. Save only the manually selected ID locally; it is not sent to a server. Clear preferences also clears this choice.
- Request continuous autofocus and neutral zoom only when advertised; failures are nonfatal. Request higher capture resolution, decode at a bounded 1600-pixel maximum dimension.
- Stop the old stream before opening a different lens, stop late streams after dialog close, and retain camera permission/error and image-upload fallbacks.
- No payment, identity, checkout validation or desktop code changed.

Validation: 3 camera policy tests; mocked Chromium multi-lens scenario covering auto selection, manual cycling, saved selection shared across modes, unsupported focus, payment QR image decoding, late-stream cleanup and permission denial; 8 existing mocked sign-in scanner scenarios; 12 existing policy/locale tests passed. Physical Pi Browser lens/focus remains unverified.

Deploy from the FileOrganizerCore-Pi repository root:

```bash
git apply --check "FileOrganizerCore-camera-lens-fix-2026-11-09.patch"
```
Only if check succeeds:
```bash
git apply "FileOrganizerCore-camera-lens-fix-2026-11-09.patch"
```
```bash
git add web/index.html web/assets/home-policy.js web/assets/home-v2.js web/assets/home-v2.css web/assets/home-runtime.js tests/camera-selection.test.cjs tests/camera-selection-ui.cjs docs/CAMERA_LENS_FIX_2026-11-09.md
```
```bash
git commit -m "Fix rear camera lens selection for login and payment QR scanners"
```
```bash
git push origin main
```
Wait for Pages deployment, then reload Pi Browser. Test both scanners. If automatic selection remains blurry, select another rear camera in the new dropdown; selection is remembered. If Pi Browser exposes only one logical camera, the website cannot force an unexposed physical lens. Report phone model, Pi Browser version and available camera labels in that case. No SQL, server deployment or desktop patch is required.
