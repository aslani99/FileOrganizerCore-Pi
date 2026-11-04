# Home toolbar, browser theme and automatic camera — 2026-11-04

- Pi shortcut is translated text (Persian: اتصال به پای). At the logical outside edge: Pi, language, theme toward the inside; RTL/LTR mirror naturally. The existing desktop scan shortcut remains further inward.
- Theme is applied before page content from a valid saved preference, otherwise prefers-color-scheme. Browser theme changes are followed until the user selects a theme. The manual choice persists across reloads. Clearing preferences restores browser following. A site can only follow the color scheme exposed by Pi Browser, not an inaccessible separate app setting.
- Opening the QR scanner immediately calls getUserMedia. Removed the separate start-camera button. Closing/Escape/page hiding/manual stop still releases tracks. Late permission results after closure are stopped. Image and manual-link fallbacks remain available. To restart after a manual stop or permission change, close and reopen the scanner.
- Camera permission persistence is controlled by the browser/OS. The site does not clear or reset permission and cannot guarantee one lifetime prompt (private mode, revoked permissions or browser policy may prompt again).
- No checkout/payment, quota, account or download configuration changes.
