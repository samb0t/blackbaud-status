# My School Assignment Statuses

A dependency-free Chrome Manifest V3 extension for personal calendar colors, dark mode, and an assignment Kanban board on `https://*.myschoolapp.com/*`.

## Install

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `blackbaud-status` folder.
4. Reload your Blackbaud calendar page.
5. In the bottom-right **My statuses** panel, enter a student/profile name, then click **Start marking**.
6. Click a calendar item and choose **In progress** (yellow), **Done** (green), **In class** (grey), or **Clear personal status**.
7. Click **Finish marking** or press Escape to restore ordinary assignment clicks. Collapsing the panel also stops marking.

Colors persist across reloads and month changes. Automatic date-based red flags appear on calendar events and Kanban cards. The former manual Due soon status is no longer used; previously labeled items appear without a personal status (To do in Kanban). Switching the profile changes the set of personal statuses. Use distinct profile names for different children, especially if the site doesn't include a child name in event titles.

Calendar items expose personal statuses as accessible descriptions while preserving the school's existing descriptions and event names. The status panel fits narrow or short viewports and scrolls internally so its controls remain reachable when zoomed in. Large calendar updates paint in batches, and unrelated page changes do not trigger calendar rescans.

Click the **Dark mode** moon icon beside the minimize button in the **My statuses** header to toggle a dark appearance for the entire calendar page, including navigation, calendar cells, controls, and the status panel. The adjacent Kanban icon switches to a calendar icon while the board is open. Both controls have tooltips and accessible labels and remain available when the panel is minimized. Light mode is the default. The preference is saved alongside statuses in Chrome Sync, restored on reload, and applied to other open calendar tabs when it changes. It is shared across schools and student profiles. Status colors stay recognizable in both themes. Turning dark mode off restores the site's original appearance, and newly loaded calendar content automatically follows the selected theme.

Dark mode applies only on the `#calendar` route and its subroutes. Navigating to Resources or another page restores the site's normal theme; returning to Calendar reapplies your saved preference. The top site bars retain their native blue/yellow backgrounds and active-tab styling, with dark text for readable navigation labels and user information. Navigation dropdowns use a light background with dark text.

The theme preserves background colors on wrappers around the site navigation as well as on the navigation itself. Notification badges use a light fill so their dark text remains readable.

## Kanban board

1. Switch the calendar to **Grid** view, then select the range you want to work with and your student/profile name.
2. Click the small **Kanban board icon** immediately to the right of **Month**, or **Open Kanban** in **My statuses**. The icon has a tooltip and an accessible label.
3. Organize assignments into **To do**, **In progress**, **Done**, and **In class**.
4. Drag a card using its **⠿ grip icon**. Drop it on a column's heading or empty space to append it, or over another card to insert above it.
5. For keyboard or touch use, choose a column with **Move to**, and reorder with the small **↑ / ↓** buttons (with tooltips and accessible labels).
6. Click **Back to calendar**, press Escape while focused in the board, or select a native calendar toolbar button to return to the calendar. Choose another range there, then reopen Kanban.

The board uses the **currently loaded calendar items**, with repeated segments of the same assignment combined into one card. It does not fetch additional assignments or keep a historical assignment collection. Items the calendar hasn't rendered (for example, behind a “more” link) may be absent. Select the Assignments calendar to avoid including unrelated events. Custom cards remain visible even in empty calendar ranges.

### Custom cards

Click **Add custom card**, enter a **title** and **due date**, add an optional **summary**, and click **Save card**. New cards start in **To do**. Titles support up to 200 characters and summaries up to 1,000 characters; summaries display as plain text with line breaks preserved. Custom cards use the same due-date flags, sorting, drag-and-drop, column menus, and ordering controls as assignments.

Custom cards show a **Custom card** label and use their subject's border color, or a **purple border** when no subject is set. The optional **Subject** field accepts up to 120 characters and suggests subjects from loaded cards. Use the **pencil** icon beside the grab handle to edit details while preserving the card's column and position, or the **trash-can** icon to delete it after confirmation. Both icons have tooltips and accessible labels. **Cancel** or Escape dismisses the editor. Custom cards, including their subjects, are saved in Chrome Sync for the current school and student/profile and remain on the board across calendar ranges and reloads. Cards with identical titles are independent. They appear only on the board and do not create school calendar events.

Custom cards automatically **archive after 14 days in Done or In class**, measured from when they entered that column. **Show archived** opens the current profile's archive, where each card shows its permanent deletion date and offers **Restore to To do** and the trash-can icon. Archived cards are **permanently deleted after 90 additional days**. Moving to another column resets the timer; moving to To do or In progress cancels it. Editing or reordering does not reset the timer. Existing Done or In class custom cards without a timestamp start their timer when this update first loads.

Retention uses elapsed days, not school days or due dates. Cleanup runs when a calendar page loads, gains focus, and periodically while it is open; expired data may remain in storage until the next visit. Deletion removes the card's details, status, and ordering. The policy bounds retention time, though Chrome Sync's storage limits still apply if many cards are created within that time.

After restoring or deleting an archived card, keyboard focus moves to a remaining archived card's control, or to the archive toggle when the archive is empty.

Moving a card updates the same synced status that colors its calendar entries; **To do** clears that status. By default, each column sorts by earliest due date first, with undated items last and titles breaking ties. Manual ordering also saves in Chrome Sync, separately for each school and student profile, and is restored when those items appear again. Saved manual ordering takes precedence; new/unordered cards sort by due date after ordered cards. A move through **Move to** appends the card to its destination column. Other open tabs update when Chrome delivers synced changes. The board follows the saved dark-mode preference.

Click an assignment's linked title to open it in a new tab. When the calendar supplies no usable web link, open the assignment from the calendar.

### What should I work on?

Click **Group by deadline** above the board to group active work into **Overdue**, **Due today**, **Upcoming**, and **Due date unavailable**. Done and In class are excluded. Each group sorts by earliest due date, then title, independently of manual Kanban ordering. **Move to** updates the same saved status and calendar colors; completed cards immediately leave this view. Toggle the button again to return to Kanban, where drag-and-drop and manual ordering are available.

This view includes only loaded calendar assignments plus the current profile's active custom cards across all dates. It does not fetch missing or historical assignments. Groups refresh when the date changes or calendar data updates. Overdue means a due date before today, using your device's local day; unknown dates remain in their own group.

### Subjects and filtering

The subject picklist is the left-most control in the board's top-right toolbar. The adjacent **clock icon** toggles **Group by deadline**, with hover text and a pressed state. Custom cards without an explicit subject show **custom** on their cards and in the subject picklist; their editor field stays optional and their border remains purple.

Cards display the school's course/group name (`GroupName`) as their subject, with a matching colored border. Colors are deterministic by subject name and adapt to light/dark mode; text labels identify subjects independently of color. Subject matching ignores capitalization and repeated whitespace. Assignments without subject metadata show **No subject**.

Use the **Subject** selector in Kanban, the deadline view, or the archive. Counts reflect unique cards in the current view before subject filtering; deadline counts exclude Done and In class. **All subjects** clears the filter. A selected subject with no matches remains selected with a zero count. Filtering lasts for the page session and resets when changing student profiles. Status changes and manual ordering still save normally; filtered-out cards retain their data.

Cards show available assignment descriptions, limited to 200 characters with `...` for longer text. Descriptions are read directly from FullCalendar's already-loaded event data, without automatic clicks, popup flicker, or additional network requests. The page-context adapter in `calendar-data.js` shares a small set of fields through DOM attributes: `LongDescription`, `AssignmentId`, `EventId`, `UserId`, `DateDue`, `DetailLink`, and `GroupName`. The board converts descriptions to inert plain text. This also works while marking or viewing Kanban, and refreshes when calendar events are rendered. Manual calendar popups remain a fallback for unsupported calendar markup; captured descriptions stay available for the page session. Some assignments genuinely have no description.

Every card includes a **due-date line**. Event-data `DateDue` takes priority over other explicit DOM dates and inferred calendar placement, including for assignments ending beyond the loaded range. The written calendar day is retained without timezone conversion (the live site's format includes values such as `1/8/2027 10:00 AM`). Invalid or missing values fall back to existing DOM extraction. Grid segments must carry FullCalendar's ending marker before their placement can establish a deadline; the edge of a clipped week is not a due date. Repeated segments are combined, using the latest applicable date at the highest available priority. Unknown dates show **Due date unavailable**. Event-data `DetailLink` similarly takes priority over DOM links; only HTTP(S) links are opened, with relative paths resolved against the current page.

A **red flag** on calendar events and in the upper-right corner of Kanban cards marks assignments due today through the next **two school days**, inclusive. School days mean Monday–Friday; weekends are skipped when calculating the cutoff, and holidays are not available to the extension. For example, on Friday, assignments due through Tuesday are flagged. Past dates and unknown dates are not flagged. Flags appear regardless of status, refresh when dates change or a new day begins, and do not change the assignment's saved status.

Kanban is available only in recognized calendar grid views. Both the toolbar icon and **Open Kanban** panel button are hidden in list views or unsupported views. Switching away from grid closes an open board. If a supported grid has no recognized toolbar, use **Open Kanban** in the panel.

## Compatibility and identity

This implementation targets FullCalendar's older `.fc-event` markup and newer month/list event classes. Direct summary extraction has been checked on a logged-in Blackbaud FullCalendar 6.1.11 grid: descriptions were present in JavaScript event data before any click, but not in event HTML. Other calendar versions and views may differ. The panel is shown when a supported calendar container or calendar items exist. It permits marking any supported calendar event, so select the Assignments calendar in Blackbaud when marking homework.

FullCalendar event-data `AssignmentId` is the preferred identity, falling back to event-data `EventId`. When available, `UserId` is included to separate students even within the same chosen profile. School origin and profile label always scope saved data. Existing DOM IDs and explicit IDs in links remain fallbacks, followed by the exact normalized title. The chooser warns when title matching is used; identical titles can still share a status when IDs are unavailable. No private APIs are called.

**No migration:** assignments switching to event-data identities start with fresh statuses and ordering. Previous keys are not copied or automatically deleted; custom cards and preferences continue to use their existing keys.

If the panel doesn't appear, or repeated assignments don't behave correctly, inspect one assignment with Chrome DevTools and share its outer HTML (remove personal details first). Confirm the assignment ID remains the same across month navigation before extending the adapter in `identity.js`.

## Privacy and storage

Only Chrome's `storage` permission is requested. Statuses and Kanban ordering use `chrome.storage.sync`: school origins, profile labels, assignment/event IDs and student user IDs when available, or fallback titles in keys are sent through Chrome Sync when enabled. Custom card titles, due dates, and summaries and the dark-mode preference are also synced. Each custom card uses one data item, plus separate status and ordering items when set; deleting the card removes all three. No school records are changed. The selected student profile stays local so viewing a different child on one device does not switch another device's calendar.

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

Regression checks also cover archive focus recovery, panel scrolling in a 320×240 viewport, accessible status descriptions alongside native descriptions, large calendar updates, and ignoring unrelated page mutations.

### Visual theme checks

Open `theme-preview.html#calendar` for a screenshot-based reproduction of the school header, navigation, active Calendar tab, dropdown, and calendar grid. Its blue/yellow backgrounds live on outer wrappers, reproducing the contrast failure missed by the simpler demo. It uses sample data, not a saved copy of a signed-in Blackbaud page.

Run `node theme.browser.cjs` to check navigation contrast (at least 4.5:1), preserved bar backgrounds, active/hover/focus states, dropdowns, route changes, and theme toggling at desktop and narrower widths. To save screenshots for visual inspection, pass an existing output directory: `node theme.browser.cjs /absolute/path/to/screenshots`. Review those images as well as the assertions; a passing fixture cannot confirm the live site's markup matches it.

Built using Chrome's content script and storage model: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts

## Future enhancements

Backlog for future sessions, in recommended implementation order:

- [x] **Stable assignment identity:** Prefer FullCalendar assignment/event IDs with student isolation. New identities start fresh, with no migration. Fixture checks cover repeated segments, range replacement, identical titles, and school/profile/student isolation.
- [x] **Reliable due dates and assignment links:** Prefer explicit event-data deadlines and detail links, retaining DOM fallbacks for unsupported versions.
- [x] **“What should I work on?” view:** Group active work by deadline, excluding Done and In class, with an explicit unknown-date group and status controls.
- [ ] **Search and filters:** Subject filtering is implemented. Remaining: text search and student, deadline, or status filters, including a quick “Hide completed” option in Kanban.
- [ ] **Personal notes and checklists:** Attach personal reminders and subtasks to school assignments without changing the school's description. Define storage and retention behavior before implementing.
- [ ] **Progress overview:** Show a compact weekly completion indicator, such as “5 of 8 assignments finished,” counting In class separately. Define the reporting range and make clear when totals cover only loaded calendar items.

### Technical starting point

The live Blackbaud FullCalendar 6.1.11 grid exposes event data through `element.fcSeg.eventRange.def.extendedProps`. Observed fields include `AssignmentId`, `AssignmentIndexId`, `EventId`, `UserId`, `GroupId`, `GroupName`, `DateDue`, `DetailLink`, and `LongDescription`. Verify field semantics and stability before using them as identifiers or deadlines.

`calendar-data.js` runs in the page's MAIN world and publishes the allowlisted description, ID, student, deadline, and detail-link fields through `data-bbs-*` attributes for isolated content scripts. Extend this adapter rather than simulating event clicks. Live inspection confirmed the deadline format and that `DetailLink` matches the native popup link. Cross-range identity behavior is covered by fixtures; continued live verification across school calendar variants is useful. Automatic popup clicking was replaced because it caused flicker and could stall on empty descriptions.

Relevant files: `identity.js` (identity), `calendar-dates.js` (deadlines), `calendar-data.js` (page-data adapter), `kanban-model.js` (board model), `kanban.js` (board UI), and `content.js` (storage and calendar integration). Existing unit and browser checks are documented under Validation above.

## Fixed extension identity

The manifest public `key` keeps the extension ID at `oieledcehcfhfmghmhimalpjdjjcddab` across devices and folder locations. Keep it unchanged when copying or updating the extension. The public key is safe to commit; no private signing key is included. A future Chrome Web Store release may use a different identity.

Chrome reference: https://developer.chrome.com/docs/extensions/reference/manifest/key
