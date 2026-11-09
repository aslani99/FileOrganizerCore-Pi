# Pi sign-in scanner — 2026-11-09

- Home Connect to Pi opens the existing camera scanner in a dedicated authentication mode. Payment scanning remains a separate mode with its existing link policy.
- Auth links must use HTTPS, the current origin, the dedicated pi-login(.html) path and one valid 64-character browser secret in the fragment. Reject credentials, extra query parameters, foreign hosts and payment links. Canonical navigation uses pi-login.html for GitHub Pages compatibility.
- The user continues to the approval page, checks the matching code and confirms with Pi. Scanning alone never approves or redeems an account. The desktop keeps its existing final confirmation.
- Only after successful server approval, a per-tab display record (username, network, 15-minute expiry) is set in sessionStorage. No access token, desktop credential or QR secret is persisted. This record is display-only, not authentication authority.
- The success page links back to home, which shows the Pi username. The existing disconnect action clears only this local display; it does not log out the desktop app.
- Camera tracks are stopped on scanner close, successful link detection and page hide. Existing image/manual-link fallbacks remain.
- Updated all 19 home/approval translations and rebuilt home-runtime.js; version queries bumped in both HTML pages.

Validation:
- 12 Node policy/locale tests passed.
- 8 mocked Chromium scenarios passed: four languages, both themes, camera start, foreign-link rejection, explicit approval, username return, payment QR image decoding regression and camera stop.
- 42 existing mocked Pi approval browser cases passed: 19 locales, clock skew, explicit theme, failed/lost response, safe usernames.
- Tests use mocked Pi/backend, not a live Pi Browser camera or real account. Physical phone camera and actual desktop/browser handoff still need user verification.
- Existing home header overflow of about 5 px at a 390 px viewport was observed in this environment; the unrelated header layout was not changed in this scoped patch.

Deployment: apply this website patch in FileOrganizerCore-Pi root, commit the listed web assets, tests and this document, then push main and wait for GitHub Pages. No SQL migration or Edge Function deployment is needed.
