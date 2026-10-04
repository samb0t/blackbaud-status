# My School Assignment Statuses

A dependency-free Chrome Manifest V3 extension for personal calendar colors, dark mode, and an assignment Kanban board on `https://*.myschoolapp.com/*`.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `blackbaud-status` folder.
4. Reload your Blackbaud calendar page.
5. In the bottom-right **My statuses** panel, enter a student/profile name, then click **Start marking**.
6. Click a calendar item and choose **In progress** (yellow), **Done** (green), **In class / don’t worry** (grey), or **Clear personal status**.
7. Click **Finish marking** or press Escape to restore ordinary assignment clicks. Collapsing the panel also stops marking.

Colors persist across reloads and month changes. Automatic date-based red flags appear on calendar events and Kanban cards. The former manual Due soon status is no longer used; previously labeled items appear without a personal status (To Do in Kanban). Switching the profile changes the set of personal statuses. Use distinct profile names for different children, especially if the site doesn't include a child name in event titles.

Click the **Dark mode** moon icon beside the minimize button in the **My statuses** header to toggle a dark appearance for the entire calendar page, including navigation, calendar cells, controls, and the status panel. The adjacent Kanban icon switches to a calendar icon while the board is open. Both controls have tooltips and accessible labels and remain available when the panel is minimized. Light mode is the default. The preference is saved alongside statuses in Chrome Sync, restored on reload, and applied to other open calendar tabs when it changes. It is shared across schools and student profiles. Status colors stay recognizable in both themes. Turning dark mode off restores the site's original appearance, and newly loaded calendar content automatically follows the selected theme.

Dark mode applies only on the `#calendar` route and its subroutes. Navigating to Resources or another page restores the site's normal theme; returning to Calendar reapplies your saved preference. The top site bars retain their native blue/yellow backgrounds and active-tab styling, with dark text for readable navigation labels and user information. Navigation dropdowns use a light background with dark text.

The theme preserves background colors on wrappers around the site navigation as well as on the navigation itself. Notification badges use a light fill so their dark text remains readable.

## Kanban board

1. Switch the calendar to **Grid** view, then select the range you want to work with and your student/profile name.
2. Click the small **Kanban board icon** immediately to the right of **Month**, or **Open Kanban** in **My statuses**. The icon has a tooltip and an accessible label.
3. Organize assignments into **To Do**, **In progress**, **Done**, and **In class / don’t worry**.
4. Drag a card using its **⠿ grip icon**. Drop it on a column's heading or empty space to append it, or over another card to insert above it.
5. For keyboard or touch use, choose a column with **Move to**, and reorder with the small **↑ / ↓** buttons (with tooltips and accessible labels).
6. Click **Back to calendar**, press Escape while focused in the board, or select a native calendar toolbar button to return to the calendar. Choose another range there, then reopen Kanban.

The board uses the **currently loaded calendar items**, with repeated segments of the same assignment combined into one card. It does not fetch additional assignments or keep a historical assignment collection. Items the calendar hasn't rendered (for example, behind a “more” link) may be absent. Select the Assignments calendar to avoid including unrelated events. Empty ranges show an empty board.

Moving a card updates the same synced status that colors its calendar entries; **To Do** clears that status. By default, each column sorts by earliest due date first, with undated items last and titles breaking ties. Manual ordering also saves in Chrome Sync, separately for each school and student profile, and is restored when those items appear again. Saved manual ordering takes precedence; new/unordered cards sort by due date after ordered cards. A move through **Move to** appends the card to its destination column. Other open tabs update when Chrome delivers synced changes. The board follows the saved dark-mode preference.

Click an assignment's linked title to open it in a new tab. When the calendar supplies no usable web link, open the assignment from the calendar.

Cards show available assignment descriptions, limited to 200 characters with `...` for longer text. Descriptions in Blackbaud's calendar popups are captured when those popups appear and retained for the current page session after they close. Open an assignment's calendar popup first if its description is not already available. Only the description paragraph is shown, without the popup's course, dates, or navigation links.

Every card includes a **due-date line**. Explicit due-date metadata takes priority; otherwise, the extension reads the assignment's calendar day or the actual ending segment of a multi-day event from supported FullCalendar markup. Grid segments must carry FullCalendar's ending marker before their placement can establish a deadline; the edge of a clipped week is not a due date. Repeated segments are combined, using the latest applicable date. If a date cannot be determined reliably (including a multi-day event continuing beyond the loaded range), the card shows **Due date unavailable**. Switching to a range that includes the actual ending segment can make its date available.

A **red flag** on calendar events and in the upper-right corner of Kanban cards marks assignments due today through the next **two school days**, inclusive. School days mean Monday–Friday; weekends are skipped when calculating the cutoff, and holidays are not available to the extension. For example, on Friday, assignments due through Tuesday are flagged. Past dates and unknown dates are not flagged. Flags appear regardless of status, refresh when dates change or a new day begins, and do not change the assignment's saved status.

Kanban is available only in recognized calendar grid views. Both the toolbar icon and **Open Kanban** panel button are hidden in list views or unsupported views. Switching away from grid closes an open board. If a supported grid has no recognized toolbar, use **Open Kanban** in the panel.

## Compatibility and identity

This implementation targets FullCalendar's older `.fc-event` markup and newer month/list event classes, based on common FullCalendar markup. It has **not been validated against a logged-in Blackbaud page**. The panel is shown when a supported calendar container or calendar items exist. It permits marking any supported calendar event, so select the Assignments calendar in Blackbaud when marking homework.

Assignment/event data attributes or explicit assignment/event IDs in links are used when available. Otherwise, the exact normalized visible title and your chosen profile identify the item. The chooser explicitly warns when title matching is used. Identical titles in the same school/profile share a status across all dates; this handles repeated segments of long assignments but can conflate separate assignments named alike. A live DOM sample is needed to improve identification if Blackbaud stores IDs only in its internal JavaScript state. No private APIs are called.

If the panel doesn't appear, or repeated assignments don't behave correctly, inspect one assignment with Chrome DevTools and share its outer HTML (remove personal details first). Confirm the assignment ID remains the same across month navigation before extending the adapter in `identity.js`.

## Privacy and storage

Only Chrome's `storage` permission is requested. Statuses and Kanban ordering use `chrome.storage.sync`: school origins, profile labels, and assignment IDs or fallback titles in keys are sent through Chrome Sync when enabled. The dark-mode preference is also synced. No school records are changed. The selected student profile stays local so viewing a different child on one device does not switch another device's calendar.

### Enable cross-device sync

1. Update/reload the existing extension in `chrome://extensions`, then reload calendar tabs.
2. Enable Chrome Sync, including extension syncing, under the same Google account on each device.
3. Copy the entire project folder to each device and use **Load unpacked**. The committed manifest public `key` fixes the extension ID to `oieledcehcfhfmghmhimalpjdjjcddab`, regardless of folder location. Keep the key unchanged. No per-device edits are needed.
4. Select the same student/calendar profile label and school site on each device. Mark an assignment and check it on the other device after Chrome syncs.

Sync is eventual, not instant. Offline changes remain stored in Chrome and sync on reconnection. Different Google accounts do not share data. Chrome resolves concurrent writes to the same assignment; this extension does not provide a collaborative conflict history. Open pages listen for synced changes and repaint automatically.

Chrome limits sync storage to 100 KB, 8 KB per item, and 512 items, with write-rate limits. Each marked assignment consumes one item; each assignment with saved Kanban ordering consumes an additional item. Ordering previously unordered cards can also assign positions to their column peers. Clearing a status removes the status item but preserves its ordering. Save failures are shown in the panel or board. Clearing a status and saving ordering require separate storage operations; on a partial failure, the board reloads the available saved data and reports the failure. A successful save means Chrome accepted it locally, not that every device has received it. This API does not expose sync progress.

Reference: https://developer.chrome.com/docs/extensions/reference/api/storage

## Validation

Run `node --test *.test.cjs`, `node --check content.js`, `node --check kanban.js`, and `node --check calendar-dates.js`. The dependency-free tests cover assignment identity, deduplication, manual ordering, profile isolation, usable assignment links, date parsing, and school-day calculations across weekends, DST, and year boundaries.

For a local interactive fixture, open `demo.html#calendar` in a browser. It supplies an in-memory Chrome storage stub, so fixture statuses, ordering, and theme intentionally reset on reload. Verify marking, clearing, repeated segments, independent profiles, normal clicks, Kanban moves/reordering, and the simulated month-change button. The Calendar/Resources links exercise route-scoped dark mode. The demo's Day/Week/Month buttons exercise returning from Kanban; they do not implement actual date views.

Optional automated browser checks:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node kanban.browser.cjs
```

These checks use the demo with simulated Chrome storage, reload persistence, and a fixed clock to exercise the toolbar icon, due-date extraction and flags, date rollover, drag/drop, menu moves, ordering, syncing, save failures, profile changes, dark mode, and range/view changes. The extension itself needs no npm dependencies. Fixture checks do not replace testing on the real site.

### Visual theme checks

Open `theme-preview.html#calendar` for a screenshot-based reproduction of the school header, navigation, active Calendar tab, dropdown, and calendar grid. Its blue/yellow backgrounds live on outer wrappers, reproducing the contrast failure missed by the simpler demo. It uses sample data, not a saved copy of a signed-in Blackbaud page.

Run `node theme.browser.cjs` to check navigation contrast (at least 4.5:1), preserved bar backgrounds, active/hover/focus states, dropdowns, route changes, and theme toggling at desktop and narrower widths. To save screenshots for visual inspection, pass an existing output directory: `node theme.browser.cjs /absolute/path/to/screenshots`. Review those images as well as the assertions; a passing fixture cannot confirm the live site's markup matches it.

Built using Chrome's content script and storage model: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts

## Fixed extension identity

The manifest public `key` keeps the extension ID at `oieledcehcfhfmghmhimalpjdjjcddab` across devices and folder locations. Keep it unchanged when copying or updating the extension. The public key is safe to commit; no private signing key is included. A future Chrome Web Store release may use a different identity.

Chrome reference: https://developer.chrome.com/docs/extensions/reference/manifest/key
