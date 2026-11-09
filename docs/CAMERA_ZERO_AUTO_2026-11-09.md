# Automatic main camera — 2026-11-09

Requires camera-lens-fix-2026-11-09.patch.

Both authentication and payment scanners now prefer the device labelled camera 0, facing back (case insensitive), independent of its position in the device list. Old manually stored preferences are ignored. The camera dropdown, switch button and torch control are removed. Start/stop, image upload, safe QR validation and optional continuous focus remain.

Camera labels are exposed after permission: the initial stream is used to enumerate devices, stopped if necessary, and the selected camera is attached to the preview. Other phones without this label use the existing rear-camera fallback. No physical lens number/deviceId is hardcoded.

Validation: camera preference unit tests, mocked multi-camera browser test including both modes and removed controls, and existing sign-in scanner regression tests. Physical phone verification is pending.

Apply and publish from FileOrganizerCore-Pi root, one command at a time:

```bash
git apply --check "FileOrganizerCore-camera-zero-auto-2026-11-09.patch"
```
Only if check succeeds:
```bash
git apply "FileOrganizerCore-camera-zero-auto-2026-11-09.patch"
```
```bash
git add web/index.html web/assets/home-policy.js web/assets/home-v2.js web/assets/home-v2.css web/assets/home-runtime.js tests/camera-selection.test.cjs tests/camera-selection-ui.cjs docs/CAMERA_ZERO_AUTO_2026-11-09.md
```
```bash
git commit -m "Automatically select camera 0 rear lens and remove lens controls"
```
```bash
git push origin main
```
Wait for successful Pages deployment and reload the site in Pi Browser. No desktop or Supabase deployment is needed.
