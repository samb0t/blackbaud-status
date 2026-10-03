/* In-page board UI. Calendar DOM stays owned by the school site. */
(() => {
  'use strict';
  const model = SchoolStatusKanbanModel;
  const dates = SchoolStatusCalendarDates;
  const normalize = value => (value || '').replace(/\s+/g, ' ').trim();
  const truncate = text => text.length > 200 ? text.slice(0, 197).trimEnd() + '...' : text;
  function summary(events) {
    for (const event of events) {
      const sources = [event, ...event.querySelectorAll('[data-summary], [data-description], .fc-event-summary, .fc-event-description, .event-summary, .event-description, .summary, .description')];
      for (const source of sources) {
        const values = [source.getAttribute('data-summary'), source.getAttribute('data-description'), source !== event ? source.textContent : ''];
        for (const value of values) {
          if (!value) continue;
          // Calendar descriptions may contain HTML. Keep only inert, plain text.
          const template = document.createElement('template'); template.innerHTML = value;
          template.content.querySelectorAll('script, style').forEach(node => node.remove());
          template.content.querySelectorAll('br, p, div, li').forEach(node => node.append(document.createTextNode(' ')));
          const text = template.content.textContent.replace(/\s+/g, ' ').trim();
          if (text) return truncate(text);
        }
      }
    }
    return '';
  }
  function create({ identify, getRecords, getScope, statuses, saveMove, onOpenChange }) {
    const host = document.createElement('div');
    host.id = 'bbs-kanban'; host.hidden = true;
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>
      :host { all: initial; display: block; --bg: #fff; --column: #f1f5f9; --text: #182636; --muted: #536479; --edge: #b9c7d4; --focus: #276ac3; font: 14px/1.45 system-ui, sans-serif; color: var(--text); color-scheme: light; }
      :host([hidden]) { display: none !important; }
      :host([data-dark]) { --bg: #18222f; --column: #111923; --text: #edf2f7; --muted: #b5c4d5; --edge: #586b80; --focus: #8bbcff; color-scheme: dark; }
      :host([data-overlay]) { position: fixed; inset: 12px; z-index: 2147483646; overflow: auto; background: var(--bg); box-shadow: 0 8px 35px #0006; }
      * { box-sizing: border-box; } [hidden] { display: none !important; }
      section { background: var(--bg); color: var(--text); padding: 18px; border: 1px solid var(--edge); border-radius: 10px; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      h2, h3, p { margin: 0; } h2 { font-size: 22px; } h3 { font-size: 15px; margin-bottom: 12px; }
      #context, #help, .note { color: var(--muted); } #context, #help { margin-top: 8px; }
      button, select { font: inherit; background: var(--bg); color: var(--text); border: 1px solid var(--edge); border-radius: 6px; padding: 6px 8px; }
      button, select { cursor: pointer; } button:disabled, select:disabled { opacity: .55; cursor: default; }
      :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
      #columns { display: grid; grid-template-columns: repeat(5, minmax(220px, 1fr)); gap: 12px; overflow-x: auto; padding: 8px 3px 16px; margin-top: 12px; }
      .column { background: var(--column); border: 1px solid var(--edge); border-top: 5px solid var(--accent); border-radius: 8px; padding: 12px; min-height: 260px; }
      .card { position: relative; background: var(--bg); border: 1px solid var(--edge); border-radius: 8px; padding: 12px; margin-bottom: 10px; overflow-wrap: anywhere; }
      .card[draggable=true] { cursor: grab; } .card.dragging { opacity: .45; }
      .drag-handle { display: block; width: 28px; font-size: 20px; line-height: 24px; color: var(--muted); margin-bottom: 4px; cursor: grab; user-select: none; }
      .due-date { display: block; color: var(--muted); font-size: 12px; margin: 8px 0; }
      .due-flag { position: absolute; top: 10px; right: 10px; color: #c62828; line-height: 1; } .due-flag svg { width: 20px; height: 20px; fill: currentColor; }
      :host([data-dark]) .due-flag { color: #ff827b; }
      .card.drop-before { box-shadow: 0 -4px var(--focus); } .column.drop-end { box-shadow: inset 0 -4px var(--focus); }
      .title { display: block; font-weight: 600; color: var(--text); margin-bottom: 8px; } a.title { color: var(--focus); }
      .note { display: block; font-size: 12px; margin: 8px 0; }
      label { display: block; font-size: 12px; margin-top: 12px; } select { display: block; width: 100%; margin-top: 4px; }
      .ordering { display: flex; gap: 6px; margin-top: 8px; } .ordering button { width: 32px; height: 32px; padding: 0; font-size: 18px; }
      #message { min-height: 1.5em; margin-top: 8px; } #message[data-error] { color: #a62c23; } :host([data-dark]) #message[data-error] { color: #ffaaa2; }
    </style><section aria-label="Assignment Kanban board">
      <header><h2 tabindex="-1">Assignment Kanban</h2><button id="back" type="button">Back to calendar</button></header>
      <p id="context"></p><p id="help">Drag cards between columns or above another card to reorder. Use Move to and the ↑/↓ buttons with a keyboard or touch.</p>
      <p id="message" role="status" aria-live="polite"></p><p id="empty" hidden>No assignments in the loaded calendar range.</p>
      <div id="columns"></div>
    </section>`;
    const $ = id => shadow.getElementById(id);
    const labels = Object.fromEntries(model.columns.map(status => [status, status ? statuses[status][0] : 'To Do']));
    let open = false, items = [], events = [], busy = false, dragged = null, calendar = null, toolbar = null, signature = '', dateTimer;
    let renderedDay = dates.today();
    const summaries = new Map();
    function capturePopups(popups, cards = model.cards(events, identify, getRecords())) {
      let changed = false;
      for (const popup of popups) {
        const description = popup.querySelector('.simple-topoffset');
        if (!description) continue;
        const popupId = popup.closest('.popover').id;
        const headline = normalize(popup.querySelector('.bb-headline')?.textContent);
        const student = normalize(popup.querySelector('.bb-emphasized')?.textContent);
        const url = model.assignmentURL([popup], location.href);
        // Prefer explicit popup ownership or an exact assignment link. Only use
        // the displayed title/student when it identifies one unique card.
        let matches = cards.filter(item => item.events.some(event => popupId &&
          [event, ...event.querySelectorAll('[aria-describedby]')].some(node => (node.getAttribute('aria-describedby') || '').split(/\s+/).includes(popupId))) ||
          (url && model.assignmentURL(item.events, location.href) === url));
        if (!matches.length && headline) matches = cards.filter(item => normalize(item.title) === (student ? `${headline} (${student})` : headline));
        if (matches.length === 1) {
          const key = matches[0].key, text = truncate(normalize(description.textContent));
          if (text && summaries.get(key) !== text) { summaries.set(key, text); changed = true; }
        }
      }
      return changed;
    }
    function collect() {
      const cards = model.cards(events, identify, getRecords());
      capturePopups(document.querySelectorAll('.popover .popover-content'), cards);
      return cards.map(item => ({ ...item, dueDate: dates.dueDate(item.events), summary: summaries.get(item.key) ?? summary(item.events) }));
    }
    // Capture independently of the calendar's debounced refresh. Include removed
    // popups: Bootstrap may remove them before that refresh ever gets to run.
    new MutationObserver(mutations => {
      const popups = new Set(document.querySelectorAll('.popover .popover-content'));
      for (const mutation of mutations) {
        for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches('.popover-content') && node.closest('.popover')) popups.add(node);
          node.querySelectorAll('.popover .popover-content').forEach(popup => popups.add(popup));
        }
      }
      if (capturePopups(popups)) { items = collect(); render(); }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    const hidden = new Set();
    const tab = document.createElement('button');
    tab.type = 'button'; tab.className = 'fc-button fc-button-default bbs-kanban-tab';
    tab.setAttribute('aria-label', 'Kanban board'); tab.title = 'Kanban board';
    tab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></svg>';
    tab.setAttribute('aria-pressed', 'false');
    tab.addEventListener('click', () => setOpen(!open));
    function restoreCalendar() {
      for (const element of hidden) element.removeAttribute('data-bbs-kanban-hidden');
      hidden.clear();
    }
    function mount() {
      const root = events.find(event => event.closest('.fc, #calendar'))?.closest('.fc, #calendar')
        || document.querySelector('.fc, #calendar');
      const nextToolbar = root?.querySelector('.fc-header-toolbar, .fc-toolbar, .fc-header');
      if (toolbar !== nextToolbar) {
        toolbar?.removeEventListener('click', calendarClick, true);
        toolbar = nextToolbar;
        toolbar?.addEventListener('click', calendarClick, true);
      }
      const month = toolbar?.querySelector('.fc-dayGridMonth-button, .fc-month-button, .fc-button-month')
        || [...(toolbar?.querySelectorAll('button, a, [role="button"], .fc-button') || [])].find(button => button !== tab && /^month$/i.test(button.textContent.trim()));
      if (month) {
        if (month.nextElementSibling !== tab) month.after(tab);
      } else if (toolbar && !toolbar.contains(tab)) {
        // Legacy FullCalendar uses a table header rather than toolbar divs.
        (toolbar.querySelector('.fc-right, .fc-toolbar-chunk:last-child, .fc-header-right') || toolbar).append(tab);
      } else if (!toolbar) tab.remove();
      if (calendar !== root || !host.isConnected) {
        restoreCalendar(); calendar = root;
        (calendar || document.documentElement).append(host);
      }
      host.toggleAttribute('data-overlay', !calendar);
      if (!open || !calendar) return;
      const view = calendar.querySelector('.fc-view-harness, .fc-view-container');
      const targets = view ? [view] : [...calendar.children].filter(child => child !== host && child !== toolbar && !child.contains(toolbar));
      for (const element of targets) {
        if (!element.hasAttribute('data-bbs-kanban-hidden')) element.setAttribute('data-bbs-kanban-hidden', '');
        hidden.add(element);
      }
    }
    function calendarClick(event) {
      if (!open || event.composedPath().includes(tab)) return;
      if (event.target.closest('button, .fc-button, [role="button"]')) setOpen(false, false);
    }
    function setOpen(value, focus = true) {
      if (open === value) return;
      if (value) items = collect();
      open = value; dragged = null;
      clearInterval(dateTimer);
      if (open) dateTimer = setInterval(refreshDay, 60000);
      host.hidden = !open; tab.setAttribute('aria-pressed', String(open));
      if (!open) restoreCalendar();
      onOpenChange(open);
      if (open) { mount(); render(); if (focus) shadow.querySelector('h2').focus(); }
      else if (focus) {
        if (tab.isConnected) tab.focus();
        else document.getElementById('bbs-personal-status')?.shadowRoot?.getElementById('board')?.focus();
      }
      // FullCalendar recalculates its dimensions after its view becomes visible.
      if (!open) window.dispatchEvent(new Event('resize'));
    }
    function announce(text, error = false) {
      $('message').textContent = text; $('message').toggleAttribute('data-error', error);
    }
    function clearDrop() { shadow.querySelectorAll('.drop-before, .drop-end').forEach(node => node.classList.remove('drop-before', 'drop-end')); }
    async function move(key, status, beforeKey = null, focusControl = 'move') {
      if (busy) return;
      const ranks = model.placement(items, getRecords(), key, status, beforeKey);
      if (!ranks) return;
      const item = items.find(item => item.key === key);
      busy = true; dragged = null; render(); announce('Saving…');
      try {
        await saveMove(key, status, ranks);
        announce(`${item.title} saved in ${labels[status]}.`);
      } catch {
        announce('Could not save the move completely. The board shows the latest available saved data. Wait and try again.', true);
      } finally {
        busy = false; items = collect(); render();
        const card = [...shadow.querySelectorAll('.card')].find(node => node.dataset.key === key);
        const control = card?.querySelector(`[data-control="${focusControl}"]`);
        (control?.disabled ? card?.querySelector('select') : control)?.focus();
      }
    }
    function render() {
      if (!open) return;
      renderedDay = dates.today();
      const focused = shadow.activeElement;
      const focusKey = focused?.closest('.card')?.dataset.key;
      const focusControl = focused?.dataset.control;
      const columns = $('columns'); const scroll = columns.scrollLeft;
      columns.replaceChildren();
      $('context').textContent = `${getScope() || 'Default profile'} · ${items.length} unique assignments · loaded calendar range only`;
      $('empty').hidden = items.length !== 0;
      for (const status of model.columns) {
        const columnItems = items.filter(item => item.status === status);
        const column = document.createElement('div'); column.className = 'column'; column.dataset.status = status;
        column.style.setProperty('--accent', status ? statuses[status][1] : '#9bc7ff');
        const heading = document.createElement('h3'); heading.textContent = `${labels[status]} (${columnItems.length})`; column.append(heading);
        column.addEventListener('dragover', event => {
          if (!dragged || busy) return;
          event.preventDefault(); event.dataTransfer.dropEffect = 'move'; clearDrop();
          const card = event.target.closest('.card');
          if (card && card.dataset.key !== dragged) card.classList.add('drop-before');
          else if (!card) column.classList.add('drop-end');
        });
        column.addEventListener('drop', event => {
          if (!dragged || busy) return;
          event.preventDefault(); clearDrop();
          const before = event.target.closest('.card')?.dataset.key || null;
          if (before !== dragged) move(dragged, status, before);
        });
        columnItems.forEach((item, index) => {
          const card = document.createElement('article'); card.className = 'card'; card.dataset.key = item.key; card.draggable = !busy;
          const handle = document.createElement('span'); handle.className = 'drag-handle'; handle.textContent = '⠿'; handle.title = 'Drag to move'; handle.setAttribute('aria-hidden', 'true'); handle.draggable = !busy; card.append(handle);
          if (dates.isDueSoon(item.dueDate)) {
            const flag = document.createElement('span'); flag.className = 'due-flag'; flag.title = 'Due today or within 2 school days'; flag.setAttribute('role', 'img'); flag.setAttribute('aria-label', flag.title);
            flag.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2h2v2h13l-4 5 4 5H7v8H5z"/></svg>'; card.append(flag);
          }
          const url = model.assignmentURL(item.events, location.href);
          const title = document.createElement(url ? 'a' : 'span'); title.className = 'title'; title.textContent = item.title;
          if (url) { title.href = url; title.target = '_blank'; title.rel = 'noopener'; title.title = 'Open assignment in a new tab'; title.draggable = false; }
          card.append(title);
          const due = document.createElement(item.dueDate ? 'time' : 'span'); due.className = 'due-date';
          if (item.dueDate) { due.dateTime = item.dueDate; due.textContent = 'Due ' + dates.formatDate(item.dueDate); }
          else due.textContent = 'Due date unavailable';
          card.append(due);
          if (item.summary) {
            const note = document.createElement('small'); note.className = 'note';
            note.textContent = item.summary;
            card.append(note);
          }
          const label = document.createElement('label'); label.textContent = 'Move to';
          const select = document.createElement('select'); select.dataset.control = 'move'; select.disabled = busy;
          select.setAttribute('aria-label', `Move ${item.title} to`);
          for (const value of model.columns) { const option = document.createElement('option'); option.value = value; option.textContent = labels[value]; select.append(option); }
          select.value = status; select.addEventListener('change', () => move(item.key, select.value));
          label.append(select); card.append(label);
          const ordering = document.createElement('div'); ordering.className = 'ordering';
          for (const direction of ['up', 'down']) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = direction === 'up' ? '↑' : '↓'; button.title = `Move ${direction}`; button.dataset.control = direction;
            button.setAttribute('aria-label', `Move ${item.title} ${direction} in ${labels[status]}`);
            button.disabled = busy || (direction === 'up' ? index === 0 : index === columnItems.length - 1);
            button.addEventListener('click', () => move(item.key, status, direction === 'up' ? columnItems[index - 1].key : columnItems[index + 2]?.key || null, direction));
            ordering.append(button);
          }
          card.append(ordering);
          card.addEventListener('dragstart', event => {
            if (busy || event.target.closest('button, select, a')) { event.preventDefault(); return; }
            dragged = item.key; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.key); card.classList.add('dragging');
          });
          card.addEventListener('dragend', () => { dragged = null; card.classList.remove('dragging'); clearDrop(); });
          column.append(card);
        });
        columns.append(column);
      }
      columns.scrollLeft = scroll;
      if (focusKey && focusControl) [...shadow.querySelectorAll('.card')].find(node => node.dataset.key === focusKey)?.querySelector(`[data-control="${focusControl}"]`)?.focus();
    }
    $('back').addEventListener('click', () => setOpen(false));
    function refreshDay() { if (open && renderedDay !== dates.today()) render(); }
    document.addEventListener('visibilitychange', refreshDay);
    window.addEventListener('focus', refreshDay);
    shadow.addEventListener('keydown', event => { if (event.key === 'Escape' && !dragged) setOpen(false); });
    return {
      get isOpen() { return open; },
      setOpen,
      applyTheme(dark) { host.toggleAttribute('data-dark', dark); },
      update(nextEvents) {
        events = nextEvents;
        items = collect();
        mount();
        const next = JSON.stringify([getScope(), dates.today(), items.map(item => [item.key, item.title, item.status, item.dueDate, item.summary, model.assignmentURL(item.events, location.href)])]);
        if (signature !== next) { signature = next; dragged = null; render(); }
      }
    };
  }
  globalThis.SchoolStatusKanban = { create };
})();
