# My School Assignment Statuses

A dependency-free Chrome Manifest V3 extension for personal calendar colors on `https://*.myschoolapp.com/*`.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `blackbaud-status` folder.
4. Reload your Blackbaud calendar page.
5. In the bottom-right **My statuses** panel, enter a student/profile name, then click **Start marking**.
6. Click a calendar item and choose **In progress** (yellow), **Due soon** (red), **Done** (green), **In class / don’t worry** (grey), or **Clear personal status**.
7. Click **Finish marking** or press Escape to restore ordinary assignment clicks. Collapsing the panel also stops marking.

Colors persist across reloads and month changes. Due soon is manually assigned; no due dates are inferred. Switching the profile changes the set of personal statuses. Use distinct profile names for different children, especially if the site doesn't include a child name in event titles.

## Compatibility and identity

This initial implementation targets FullCalendar's older `.fc-event` markup and newer month/list event classes, based on common FullCalendar markup. It has **not been validated against a logged-in Blackbaud page**. The panel is shown only when supported calendar items exist. It permits marking any supported calendar event, so select the Assignments calendar in Blackbaud when marking homework.

Assignment/event data attributes or explicit assignment/event IDs in links are used when available. Otherwise, the exact normalized visible title and your chosen profile identify the item. The chooser explicitly warns when title matching is used. Identical titles in the same school/profile share a status across all dates; this handles repeated segments of long assignments but can conflate separate assignments named alike. A live DOM sample is needed to improve identification if Blackbaud stores IDs only in its internal JavaScript state. No private APIs are called.

If the panel doesn't appear, or repeated assignments don't behave correctly, inspect one assignment with Chrome DevTools and share its outer HTML (remove personal details first). Confirm the assignment ID remains the same across month navigation before extending the adapter in `identity.js`.

## Privacy and storage

Only Chrome's `storage` permission is requested. Content scripts run only on HTTPS myschoolapp.com subdomains. The extension makes no network requests and never updates school records. Status keys may contain visible assignment titles, the school origin, and the profile name. They are stored in `chrome.storage.local`, not synced to other devices. Uninstalling the extension removes its saved data. There is no backend, build step, or third-party library.

## Validation

Run `node --test identity.test.cjs` and `node --check content.js`.

For a local interactive fixture, open `demo.html` in a browser. It supplies an in-memory Chrome storage stub, so fixture statuses intentionally reset on reload. Verify marking, clearing, repeated segments, independent profiles, normal clicks, and the simulated month-change button. This does not replace testing on the real site.

Built using Chrome's content script and storage model: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
