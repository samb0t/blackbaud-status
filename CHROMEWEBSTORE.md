# Chrome Web Store Listing — My School Assignment Statuses

> Last Updated: 2026-10-17
> Draft reference for a potential store release. Current installation uses Load unpacked.

## Store Listing

**Extension Name:** My School Assignment Statuses

**Short Description:** Personal calendar statuses, dark mode, and a Kanban assignment board with Chrome Sync.

**Detailed Description:**

Organize assignments on your school's myschoolapp.com calendar with personal statuses and a Kanban board.

Mark assignments In progress, Done, or In class. See red flags for deadlines due today through the next two school days. Switch to a dark calendar appearance, organize loaded assignments into columns, and add custom cards with titles, due dates, and notes.

Choose “Group by deadline” to see unfinished work grouped into overdue, due today, upcoming, and unknown deadlines. Update progress directly from this view. Subject-colored borders and text labels identify courses; filter by subject in either view or the archive. Add optional subjects to custom cards. Improved assignment matching keeps same-named assignments and different students separate when school identifiers are available, and available school deadlines and detail links improve multi-day assignment cards.

Use drag and drop or keyboard-friendly controls to organize cards. Personal calendar statuses include accessible descriptions, and the status panel scrolls to keep controls within reach in short windows. Custom cards in Done or In class archive after 14 days and are permanently deleted 90 days later. Available summaries load automatically as you browse visible calendar assignments.

Open your school calendar in Grid view, select a student/profile label, and use My statuses or the Kanban button to get started. Select the Assignments calendar to avoid including unrelated events.

Statuses, ordering, custom cards, and the dark-mode preference sync through Chrome when enabled. Each school and profile has separate assignment data. School records are not changed. Only assignments currently loaded by the calendar appear; this extension does not retrieve additional assignments.

**Category:** Productivity

**Single Purpose:** Organize personal assignment progress on myschoolapp.com calendars.

**Primary Language:** English

## Graphics & Assets

| Asset | Dimensions | Status |
|-------|------------|--------|
| Store icon | 128×128 PNG | Not created; manifest currently omits icons |
| Screenshot | 1280×800 or 640×400 | Not created |

Screenshot notes: show the status panel and Kanban board with sample data, including dark mode and custom cards. Capture the current scrollable panel design and the new work-priority toggle and grouped view.

Refresh screenshots to include the Group by deadline label, Subject filter with counts, subject borders/labels in both themes, and the custom-card Subject field.

## Permissions Justification

| Permission / site access | Type | Justification |
|--------------------------|------|---------------|
| `storage` | permission | Save personal statuses, card ordering, custom cards, and theme preferences across devices; keep the selected profile local to each device. |
| `https://*.myschoolapp.com/*` | content-script matches | Read rendered calendar items and their already-loaded descriptions, assignment and student identifiers, deadlines, and detail links; add personal status indicators, calendar styling, and assignment views on school sites. |

## Privacy & Data Use

The extension processes rendered assignment titles, assignment/event and student user IDs, dates, links, and descriptions already loaded by the calendar. School origins, profile labels, assignment/event IDs with available student user IDs or fallback titles, statuses, ordering, custom card titles/dates/summaries, and the theme preference are stored through Chrome Sync and may be transmitted by Chrome when syncing is enabled. The selected profile is stored locally. School descriptions, deadlines, and detail links are retained only for the page session. Reading this data does not trigger additional school-site requests or open assignment popups.

There is no developer-operated collection endpoint or analytics. Data is used for assignment organization, not sold, used for unrelated purposes, or used for creditworthiness. User-entered labels and notes may contain personal information. Dashboard disclosures must account for this stored website content and user-provided information, including transmission through Chrome Sync.

School course/group names are read from already-loaded calendar data for subject labels, colors, and filtering, and retained only for the page session. User-entered custom-card subjects are stored and synced with the card. The subject filter selection is page-session state.

## Privacy Policy

**Public privacy policy URL:** Not configured.

## Distribution & Developer Info

Store visibility, regions, publisher name, contact email, and support URL: not configured.

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| Unreleased (based on 0.3.0) | 2026-10-17 | Group by deadline toggle label, subject-colored card borders and labels, counted subject filters, and optional synced subjects on custom cards. | Draft |
| Unreleased (based on 0.3.0) | 2026-10-17 | Event-data assignment identities with student isolation (no migration), explicit deadlines/detail links, and an active-work view grouped by deadline. | Draft |
| Unreleased (based on 0.3.0) | 2026-10-17 | In class custom-card archiving and automatic summaries from already-loaded calendar data, without popup flicker. | Draft |
| Unreleased (based on 0.3.0) | 2026-10-04 | Archive focus recovery, viewport-safe status panel, accessible calendar status descriptions, and filtered/batched calendar updates. | Draft |

## Review Notes

Direct summary extraction was checked on a signed-in Blackbaud FullCalendar 6.1.11 grid; other features and calendar variants also use fixture-based checks. Title fallback can merge different assignments with identical titles in one profile. Chrome Sync quotas apply. The manifest's public key stabilizes the unpacked extension identity; a store release may use a different identity.
