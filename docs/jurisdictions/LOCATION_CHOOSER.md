# Location chooser and hero

The main app uses a searchable modal with six country groups and twelve practice locations. The trigger and hero show the selected location, a local SVG flag (or a neutral marker for Northern Ireland), and the professional context. States and provinces use the country flag with an explicit location name.

Display metadata lives in `location-chooser.js`; the existing `switchJurisdiction` function still owns loading, saved work, history and rollback. The native select remains as a fallback when modal dialogs are unavailable. No external image requests are needed; flag-icons attribution is in `assets/flags/`.

Keyboard support includes Tab, arrow navigation between results, Enter, Escape and focus return. The modal keeps search and close controls visible while the list scrolls. Location changes respect reduced-motion preferences.

Validation: 92 chooser/hero assertions passed across all twelve locations, including flag loading, search, history, failed-load recovery, keyboard behaviour and 320/390/768px layouts. The 139 existing completion assertions and legacy/blocked-storage checks also passed using the new chooser. Screenshots and results are in `output/playwright/location-*`.
