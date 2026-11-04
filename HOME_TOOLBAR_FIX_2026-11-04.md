# Home toolbar and missing runtime assets — 2026-11-04

User confirmed the 19-language feature works in Pi Browser.

Diagnosis: the deployed home HTML references assets/home-policy.js and assets/vendor/jsQR-1.4.0.js, but both URLs returned HTTP 404 during inspection. The home controller loads, but an undefined policy breaks plan rendering, link validation and download setup; missing jsQR prevents scanning. This is an incomplete asset publication, not evidence of a GitHub service outage.

Fix: ship home-runtime.js containing jsQR (with its license), policy, locales, translations and controller. HTML loads config.js then this single runtime; no requests for missing individual JS dependencies. Rebuild after source edits with `node scripts/build-home.cjs`; publish the generated runtime as well. Config and checkout are untouched.

Toolbar: language globe with a native accessible language picker (19 languages + browser language), theme icon, Pi anchor that scrolls to the existing connection section without authenticating automatically. Labels/titles follow current language. Manual and browser-auto selection retained.

Acceptance: real Pi Browser must still confirm camera permissions/scanning, plan loading against the live backend, manual link validation and Pi section navigation after deployment. No real payment is needed for these checks. Payment test statuses are unchanged.
