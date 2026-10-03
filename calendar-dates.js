/* Calendar DOM dates and date-only arithmetic (no timezone or DST shifts). */
(function (root) {
  const dueAttributes = ['data-due-date', 'data-duedate', 'data-due', 'data-due-at', 'data-due-on'];
  const attributes = [...dueAttributes, 'data-date', 'datetime', 'title', 'aria-label', 'colspan', 'rowspan'];
  const measuredDates = new WeakMap();
  function parseDate(value) {
    const text = String(value || '').trim();
    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
    let year, month, day;
    if (match) [, year, month, day] = match;
    else if ((match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:$|\s)/))) [, month, day, year] = match;
    else {
      match = text.match(/^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day|sday|nesday|rsday|urday)?[,]?\s+)?([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})(?:$|\s)/i);
      if (!match) return null;
      month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(match[1].slice(0, 3).toLowerCase()) + 1;
      [, , day, year] = match;
    }
    year = Number(year); month = Number(month); day = Number(day);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date.toISOString().slice(0, 10);
  }
  function today(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  function isDueSoon(value, now = new Date()) {
    const date = parseDate(value), start = today(now);
    if (!date || date < start) return false;
    const limit = new Date(start + 'T00:00:00Z');
    for (let days = 0; days < 2;) {
      limit.setUTCDate(limit.getUTCDate() + 1);
      if (![0, 6].includes(limit.getUTCDay())) days++;
    }
    return date <= limit.toISOString().slice(0, 10);
  }
  function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(value + 'T00:00:00Z'));
  }
  const latest = values => values.filter(Boolean).sort().at(-1) || null;
  function explicitDate(event) {
    const nodes = [event, ...event.querySelectorAll(dueAttributes.map(name => `[${name}]`).join(',') + ', .due-date, .dueDate, [itemprop="dueDate"]')];
    for (const node of nodes) {
      for (const attribute of dueAttributes) {
        const date = parseDate(node.getAttribute(attribute));
        if (date) return date;
      }
      if (node !== event) {
        const date = parseDate(node.getAttribute('datetime') || node.querySelector('time[datetime]')?.getAttribute('datetime') || node.textContent.replace(/^\s*due(?:\s+date)?\s*:?\s*/i, ''));
        if (date) return date;
      }
    }
    for (const label of [event.getAttribute('title'), event.getAttribute('aria-label')]) {
      const match = label?.match(/\bdue(?:\s+date)?\s*:?\s+(.+)/i);
      const date = match && parseDate(match[1]);
      if (date) return date;
    }
    return null;
  }
  // Older FullCalendar lays multi-day events over a background date table.
  // Account for rowspans as well as colspans when locating the final segment.
  function legacyGridDate(event) {
    const cell = event.closest('.fc-content-skeleton td');
    const row = event.closest('.fc-row');
    if (!cell || !row) return null;
    const dates = [...row.querySelectorAll('.fc-bg td[data-date]')].map(node => parseDate(node.getAttribute('data-date')));
    const occupied = [];
    for (const [rowIndex, tableRow] of [...cell.closest('table').rows].entries()) {
      occupied[rowIndex] ||= [];
      let column = 0;
      for (const current of tableRow.cells) {
        while (occupied[rowIndex][column]) column++;
        if (current === cell) return latest(dates.slice(column, column + current.colSpan));
        for (let y = 0; y < current.rowSpan; y++) {
          occupied[rowIndex + y] ||= [];
          for (let x = 0; x < current.colSpan; x++) occupied[rowIndex + y][column + x] = true;
        }
        column += current.colSpan;
      }
    }
    return null;
  }
  function calendarDate(event) {
    // A segment continuing beyond the displayed range cannot establish a deadline.
    if ((event.classList.contains('fc-start') || event.classList.contains('fc-end')) && !event.classList.contains('fc-end')) return null;
    if ((event.classList.contains('fc-event-start') || event.classList.contains('fc-event-end')) && !event.classList.contains('fc-event-end')) return null;
    const ownDate = parseDate(event.getAttribute('data-date'));
    if (ownDate) return ownDate;
    const gridDate = legacyGridDate(event);
    if (gridDate) return gridDate;
    const dayCell = event.closest('.fc-daygrid-day[data-date]');
    if (dayCell) {
      // Modern month events can stretch over several day cells. Measure the
      // occupied cells while visible, then retain that result while Kanban hides it.
      const bounds = event.getBoundingClientRect();
      if (bounds.width > 0) {
        const dates = [...dayCell.parentElement.querySelectorAll('.fc-daygrid-day[data-date]')].filter(cell => {
          const rect = cell.getBoundingClientRect();
          return Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left) > 2;
        }).map(cell => parseDate(cell.getAttribute('data-date')));
        const date = latest(dates);
        measuredDates.set(event, { date, anchor: dayCell.getAttribute('data-date') });
        return date;
      }
      const cached = measuredDates.get(event);
      return cached?.anchor === dayCell.getAttribute('data-date') ? cached.date : null;
    }
    const containerDate = parseDate(event.closest('[data-date]')?.getAttribute('data-date'));
    if (containerDate) return containerDate;
    if (event.matches('.fc-list-event, .fc-list-item')) {
      for (let row = event.previousElementSibling; row; row = row.previousElementSibling) {
        if (!row.matches('.fc-list-day, .fc-list-heading')) continue;
        return parseDate(row.getAttribute('data-date') || row.querySelector('[data-date]')?.getAttribute('data-date'));
      }
    }
    return null;
  }
  function dueDate(events) {
    return latest(events.map(explicitDate)) || latest(events.map(calendarDate));
  }
  function createFlag(className) {
    const flag = document.createElement('span'); flag.className = className;
    flag.title = 'Due today or within 2 school days'; flag.setAttribute('role', 'img'); flag.setAttribute('aria-label', flag.title);
    flag.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2h2v2h13l-4 5 4 5H7v8H5z"/></svg>';
    return flag;
  }
  root.SchoolStatusCalendarDates = { attributes, parseDate, today, isDueSoon, formatDate, dueDate, createFlag };
  if (typeof module !== 'undefined') module.exports = root.SchoolStatusCalendarDates;
})(globalThis);
