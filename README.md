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

Only Chrome's `storage` permission is requested. Statuses use `chrome.storage.sync`: school origins, profile labels, and assignment IDs or fallback titles in keys are sent through Chrome Sync when enabled. No school records are changed. The selected student profile stays local so viewing a different child on one device does not switch another device's calendar.

### Enable cross-device sync

1. Update/reload the existing extension in `chrome://extensions`, then reload calendar tabs.
2. Enable Chrome Sync, including extension syncing, under the same Google account on each device.
3. Copy the entire project folder to each device and use **Load unpacked**. The committed manifest public `key` fixes the extension ID to `oieledcehcfhfmghmhimalpjdjjcddab`, regardless of folder location. Keep the key unchanged. No per-device edits are needed.
4. Select the same student/calendar profile label and school site on each device. Mark an assignment and check it on the other device after Chrome syncs.

Sync is eventual, not instant. Offline changes remain stored in Chrome and sync on reconnection. Different Google accounts do not share data. Chrome resolves concurrent writes to the same assignment; this extension does not provide a collaborative conflict history. Open pages listen for synced changes and repaint automatically.

Chrome limits sync storage to 100 KB, 8 KB per item, and 512 items, with write-rate limits. Each marked assignment consumes one item. Clearing a status removes that item from sync storage. Save failures are shown in the panel, not silently discarded. A successful save means Chrome accepted it locally, not that every device has received it. This API does not expose sync progress.

Reference: https://developer.chrome.com/docs/extensions/reference/api/storage

## Validation

Run `node --test *.test.cjs` and `node --check content.js`.

For a local interactive fixture, open `demo.html` in a browser. It supplies an in-memory Chrome storage stub, so fixture statuses intentionally reset on reload. Verify marking, clearing, repeated segments, independent profiles, normal clicks, and the simulated month-change button. This does not replace testing on the real site.

Built using Chrome's content script and storage model: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts

## Fixed extension identity

The manifest public `key` keeps the extension ID at `oieledcehcfhfmghmhimalpjdjjcddab` across devices and folder locations. Keep it unchanged when copying or updating the extension. The public key is safe to commit; no private signing key is included. A future Chrome Web Store release may use a different identity.

Chrome reference: https://developer.chrome.com/docs/extensions/reference/manifest/key
