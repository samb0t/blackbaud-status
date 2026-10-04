(() => {
  'use strict';
  if (document.getElementById('bbs-personal-status')) return;
  const selector = '.fc-event, .fc-list-event, .fc-list-item';
  const statuses = { progress: ['In progress', '#ffe49a'], done: ['Done', '#bce8c7'], ignore: ['In class', '#d7dce2'] };
  const host = document.createElement('div');
  host.id = 'bbs-personal-status';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>
    :host { all: initial; position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; font: 14px/1.45 system-ui, sans-serif; color: #182636; }
    :host([hidden]) { display: none !important; }
    * { box-sizing: border-box; } section { width: min(290px, calc(100vw - 36px)); max-height: calc(100dvh - 36px); overflow: auto; border: 1px solid #cbd5df; background: white; border-radius: 14px; padding: 16px; box-shadow: 0 8px 35px #18263630; } header { flex-wrap: wrap; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; } strong { font-size: 16px; } button, input { font: inherit; } button { cursor: pointer; border: 1px solid #b9c7d4; border-radius: 7px; padding: 8px 10px; background: #f5f8fb; color: #182636; } button:hover { filter: brightness(.96); } button:focus-visible, input:focus-visible { outline: 3px solid #276ac3; outline-offset: 2px; }
    #toggle { width: 100%; margin-top: 12px; } #toggle[aria-pressed=true] { background: #163d68; color: white; } p { margin: 10px 0; } small { color: #536479; display: block; margin-top: 8px; } label { display: block; margin-top: 12px; } input { width: 100%; padding: 7px; border: 1px solid #b9c7d4; border-radius: 6px; } #choices { display: grid; gap: 6px; } #selection { border-top: 1px solid #dce3e9; margin-top: 12px; padding-top: 12px; } #title { overflow-wrap: anywhere; font-weight: 600; } #message { color: #9b3028; } [hidden] { display: none !important; } #legend { font-size: 12px; } #legend span { display: inline-block; padding: 2px 5px; border-radius: 4px; margin: 3px 2px 0 0; }
    :host { color-scheme: light; }
    .header-actions { display: flex; gap: 5px; flex-shrink: 0; }
    .header-actions button { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; padding: 5px; }
    .header-actions svg { width: 18px; height: 18px; fill: currentColor; }
    #theme[aria-pressed=true], #board[aria-pressed=true] { background: #163d68; color: white; }
    button:disabled { cursor: wait; opacity: .65; }
    input { background: white; color: #182636; }
    #legend span { color: #182636; }
    :host([data-theme="dark"]) { color: #edf2f7; color-scheme: dark; }
    :host([data-theme="dark"]) section { background: #18222f; border-color: #586b80; }
    :host([data-theme="dark"]) button, :host([data-theme="dark"]) input { background: #273649; color: #edf2f7; border-color: #586b80; }
    :host([data-theme="dark"]) small, :host([data-theme="dark"]) input::placeholder { color: #b5c4d5; }
    :host([data-theme="dark"]) #selection { border-color: #586b80; }
    :host([data-theme="dark"]) #message { color: #ffaaa2; }
    :host([data-theme="dark"]) button:focus-visible, :host([data-theme="dark"]) input:focus-visible { outline-color: #8bbcff; }
  </style><section aria-label="Personal assignment statuses">
    <header><strong>My statuses</strong><div class="header-actions">
      <button id="theme" aria-pressed="false" aria-label="Dark mode" title="Dark mode" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14z"/></svg></button>
      <button id="board" aria-pressed="false" aria-label="Open Kanban" title="Open Kanban"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></svg></button>
      <button id="collapse" aria-expanded="true" aria-label="Collapse status panel" title="Collapse status panel">−</button>
    </div></header>
    <div id="body"><button id="toggle" aria-pressed="false">Start marking</button>
    <small id="count" role="status"></small>
    <div id="legend"><span style="background:#ffe49a">In progress</span><span style="background:#bce8c7">Done</span><span style="background:#d7dce2">In class</span></div>
    <label for="scope">Student / calendar profile</label><input id="scope" maxlength="100" placeholder="e.g. Student A" />
    <small>Use a different profile for each child. Statuses sync through Chrome when Chrome Sync is enabled. Red flags mark items due today or within 2 school days.</small>
    <div id="selection" hidden><p id="title"></p><small id="identity"></small><div id="choices"></div><button id="cancel" style="margin-top:8px">Cancel</button></div>
    <small id="message" role="alert"></small></div>
  </section>`;
  const $ = id => shadow.getElementById(id);
  let records = {}, scope = '', marking = false, selected = null, pending = false;
  const scopeKey = 'bbs-profile:' + location.origin;
  const themeKey = 'bbs-setting:dark-mode';
  // Keep descriptions outside event markup so title-based identity is unaffected.
  const descriptions = document.createElement('div');
  descriptions.id = 'bbs-status-descriptions';
  descriptions.className = 'bbs-visually-hidden';
  const descriptionIds = new Set();
  for (const [status, [label]] of Object.entries(statuses)) {
    const description = document.createElement('span');
    description.id = `bbs-status-description-${status}`;
    description.textContent = `Personal status: ${label}.`;
    descriptionIds.add(description.id); descriptions.append(description);
  }
  document.documentElement.append(descriptions);
  function describeStatus(event, status) {
    const previous = event.getAttribute('aria-describedby') || '';
    const ids = previous.split(/\s+/).filter(id => id && !descriptionIds.has(id));
    if (Object.hasOwn(statuses, status)) ids.push(`bbs-status-description-${status}`);
    const next = ids.join(' ');
    if (next !== previous) {
      if (next) event.setAttribute('aria-describedby', next);
      else event.removeAttribute('aria-describedby');
    }
  }
  const kanban = SchoolStatusKanban.create({
    identify: event => identify(event), getRecords: () => records, getScope: () => scope, statuses,
    async saveCustom(key, value) {
      if (pending) throw new Error('A save is already in progress.');
      pending = true;
      const model = SchoolStatusKanbanModel;
      try {
        if (value) {
          value = { ...records[model.dataKey(key)], ...value };
          await chrome.storage.sync.set({ [model.dataKey(key)]: value });
          records[model.dataKey(key)] = value;
        } else {
          const keys = [model.dataKey(key), key, model.orderKey(key)];
          await chrome.storage.sync.remove(keys);
          keys.forEach(key => delete records[key]);
        }
      } catch (error) {
        try { records = await chrome.storage.sync.get(null); } catch { /* Keep the last known data. */ }
        throw error;
      } finally { pending = false; refresh(); }
    },
    async saveMove(key, status, ranks) {
      if (pending) throw new Error('A save is already in progress.');
      pending = true;
      try {
        const values = { ...ranks, ...(status ? { [key]: status } : {}) };
        const model = SchoolStatusKanbanModel, data = model.dataKey(key);
        const custom = key.startsWith('bbs-custom:') && records[data];
        if (custom) {
          values[data] = model.customMove(custom, records[key], status);
          values[key] = status;
        }
        await chrome.storage.sync.set(values);
        Object.assign(records, values);
        if (!status && !custom) { await chrome.storage.sync.remove(key); delete records[key]; }
      } catch (error) {
        // Clearing a status and saving ordering are separate storage operations.
        // Re-read after partial failure so the board reflects what actually saved.
        try { records = await chrome.storage.sync.get(null); } catch { /* Keep the last known data. */ }
        throw error;
      } finally { pending = false; refresh(); }
    },
    onOpenChange(open) {
      $('board').setAttribute('aria-pressed', String(open));
      $('board').title = open ? 'Back to calendar' : 'Open Kanban';
      $('board').setAttribute('aria-label', $('board').title);
      $('board').innerHTML = open
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v3h6V2h2v3h4v17H3V5h4V2zm-2 9v9h14v-9H5z"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></svg>';
      $('toggle').hidden = open;
      if (open) setMarking(false);
    }
  });
  function applyTheme() {
    const calendarPage = /^#calendar(?:$|[/?&])/i.test(location.hash);
    const dark = calendarPage && records[themeKey] === true;
    host.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.toggleAttribute('data-bbs-dark', dark);
    kanban.applyTheme(dark);
    $('theme').setAttribute('aria-pressed', String(dark));
  }
  window.addEventListener('hashchange', applyTheme);
  window.addEventListener('popstate', applyTheme);
  const identify = event => SchoolStatusIdentity.identify(event, location.origin, scope);
  function closeSelection() { selected = null; $('selection').hidden = true; }
  let refreshFrame;
  function refresh() {
    cancelAnimationFrame(refreshFrame);
    applyTheme();
    const events = [...document.querySelectorAll(selector)];
    host.hidden = events.length === 0 && !document.querySelector('.fc, #calendar') && !kanban.isOpen;
    const count = `${events.length} calendar items found. ${marking ? 'Click an item to set its status. Esc stops marking.' : 'Normal calendar clicks are enabled.'}`;
    if ($('count').textContent !== count) $('count').textContent = count;
    const cards = SchoolStatusKanbanModel.cards(events, identify, records);
    function* updates() {
      for (const item of cards) {
        const flagged = SchoolStatusCalendarDates.isDueSoon(SchoolStatusCalendarDates.dueDate(item.events));
        for (const event of item.events) yield { event, key: item.key, flagged };
      }
    }
    const queue = updates();
    function paintBatch() {
      for (let count = 0; count < 20; count++) {
        const next = queue.next();
        if (next.done) return;
        const { event, key, flagged } = next.value;
        if (!event.isConnected) continue;
        const status = records[key];
        if (Object.hasOwn(statuses, status)) {
          if (event.getAttribute('data-bbs-status') !== status) event.setAttribute('data-bbs-status', status);
        } else if (event.hasAttribute('data-bbs-status')) event.removeAttribute('data-bbs-status');
        event.classList.toggle('bbs-marking', marking);
        describeStatus(event, status);
        const flag = event.querySelector('.bbs-due-flag');
        if (!flagged) {
          flag?.parentElement.classList.remove('bbs-flagged-title');
          flag?.remove();
        }
        else if (!flag) {
          const target = event.querySelector('.fc-title, .fc-event-title, .fc-list-event-title, .fc-list-item-title') || event.querySelector('td:last-child') || event;
          target.classList.add('bbs-flagged-title');
          target.append(SchoolStatusCalendarDates.createFlag('bbs-due-flag'));
        }
      }
      refreshFrame = requestAnimationFrame(paintBatch);
    }
    paintBatch();
    kanban.update(events);
    $('board').hidden = !kanban.isAvailable;
  }
  function setMarking(value) {
    marking = value;
    $('toggle').setAttribute('aria-pressed', String(value));
    $('toggle').textContent = value ? 'Finish marking' : 'Start marking';
    closeSelection(); refresh();
  }
  for (const [value, [label, color]] of [...Object.entries(statuses), ['', ['Clear personal status', '#f5f8fb']]]) {
    const button = document.createElement('button');
    button.textContent = label;
    if (value) { button.style.backgroundColor = color; button.style.color = '#182636'; }
    button.addEventListener('click', async () => {
      if (!selected || pending) return;
      const key = selected.key;
      pending = true; $('message').textContent = '';
      try {
        if (value) await chrome.storage.sync.set({ [key]: value });
        else await chrome.storage.sync.remove(key);
        if (value) records[key] = value; else delete records[key];
        closeSelection(); refresh(); $('toggle').focus();
      } catch { $('message').textContent = 'Could not save to Chrome sync storage. A storage or write-rate limit may have been reached. Wait and try again.'; }
      finally { pending = false; }
    });
    $('choices').append(button);
  }
  $('toggle').addEventListener('click', () => setMarking(!marking));
  $('board').addEventListener('click', () => kanban.setOpen(!kanban.isOpen));
  $('theme').addEventListener('click', async () => {
    if ($('theme').disabled) return;
    const dark = records[themeKey] !== true;
    $('theme').disabled = true; $('message').textContent = '';
    try {
      await chrome.storage.sync.set({ [themeKey]: dark });
      records[themeKey] = dark; applyTheme();
    } catch { $('message').textContent = 'Dark mode could not be saved to Chrome sync storage. Wait and try again.'; }
    finally { $('theme').disabled = false; }
  });
  $('cancel').addEventListener('click', () => { closeSelection(); $('toggle').focus(); });
  $('collapse').addEventListener('click', () => {
    const collapsed = !$('body').hidden;
    $('body').hidden = collapsed;
    $('collapse').textContent = collapsed ? '+' : '−';
    $('collapse').setAttribute('aria-expanded', String(!collapsed));
    $('collapse').setAttribute('aria-label', collapsed ? 'Expand status panel' : 'Collapse status panel');
    $('collapse').title = $('collapse').getAttribute('aria-label');
    if (collapsed) setMarking(false);
  });
  $('scope').addEventListener('change', async () => {
    scope = $('scope').value.trim(); closeSelection(); refresh();
    try { await chrome.storage.local.set({ [scopeKey]: scope }); $('message').textContent = ''; }
    catch { $('message').textContent = 'Profile could not be saved. Reload and try again.'; }
  });
  document.addEventListener('click', event => {
    if (!marking || event.composedPath().includes(host)) return;
    const item = event.target instanceof Element && event.target.closest(selector);
    if (!item) return;
    event.preventDefault(); event.stopImmediatePropagation();
    selected = identify(item);
    if (!selected) return;
    $('title').textContent = selected.title;
    $('identity').textContent = selected.fallback
      ? 'Matched by title: items with this exact title in this profile share a status, including other dates.'
      : 'Matched by assignment/event ID. All matching calendar segments share this status.';
    $('selection').hidden = false;
    $('choices').querySelector('button').focus();
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && marking) { setMarking(false); $('toggle').focus(); }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [key, change] of Object.entries(changes)) {
      if (change.newValue === undefined) delete records[key]; else records[key] = change.newValue;
    }
    applyTheme(); refresh();
  });
  async function start() {
    try {
      records = await chrome.storage.sync.get(null);
      applyTheme(); $('theme').disabled = false;
      const local = await chrome.storage.local.get(scopeKey);
      scope = typeof local[scopeKey] === 'string' ? local[scopeKey] : '';
      $('scope').value = scope;
    } catch { $('message').textContent = 'Chrome storage unavailable. Reload the page to retry.'; $('toggle').disabled = true; }
    document.documentElement.append(host);
    async function cleanupCustomCards() {
      if (pending || !document.querySelector('.fc, #calendar')) return;
      const { values, remove } = SchoolStatusKanbanModel.cleanup(records);
      if (!Object.keys(values).length && !remove.length) return;
      pending = true;
      try {
        if (Object.keys(values).length) { await chrome.storage.sync.set(values); Object.assign(records, values); }
        if (remove.length) { await chrome.storage.sync.remove(remove); remove.forEach(key => delete records[key]); }
      } catch {
        try { records = await chrome.storage.sync.get(null); } catch { /* Keep the last known data. */ }
        $('message').textContent = 'Archived card cleanup could not be saved. It will retry automatically.';
      } finally { pending = false; refresh(); }
    }
    await cleanupCustomCards();
    setInterval(cleanupCustomCards, 60000);
    window.addEventListener('focus', cleanupCustomCards);
    refresh();
    let renderedDay = SchoolStatusCalendarDates.today();
    const refreshDay = () => {
      const day = SchoolStatusCalendarDates.today();
      if (day !== renderedDay) { renderedDay = day; refresh(); }
    };
    setInterval(refreshDay, 60000);
    window.addEventListener('focus', refreshDay);
    document.addEventListener('visibilitychange', refreshDay);
    let timer;
    new MutationObserver(mutations => {
      const relevant = mutations.filter(m => {
        const target = m.target.nodeType === Node.ELEMENT_NODE ? m.target : m.target.parentElement;
        const owned = node => node.nodeType === Node.ELEMENT_NODE && node.matches('#bbs-kanban, .bbs-kanban-tab, .bbs-due-flag');
        if (target?.closest('#bbs-kanban, .bbs-kanban-tab, .bbs-due-flag')) return false;
        if (m.type === 'childList' && [...m.addedNodes, ...m.removedNodes].every(owned)) return false;
        if (m.attributeName === 'aria-describedby') {
          const nativeIds = value => (value || '').split(/\s+/).filter(id => id && !descriptionIds.has(id)).join(' ');
          if (nativeIds(m.oldValue) === nativeIds(target.getAttribute('aria-describedby'))) return false;
        }
        const calendarSelector = '.fc, #calendar, .popover, .fc-toolbar, .fc-header-toolbar, .fc-header, .fc-view-container, .fc-view-harness';
        return target?.closest(`${calendarSelector}, ${selector}`) || (m.type === 'attributes' && target?.querySelector(calendarSelector)) ||
          [...m.addedNodes, ...m.removedNodes].some(node => node.nodeType === Node.ELEMENT_NODE &&
            (node.matches(`${calendarSelector}, ${selector}`) || node.querySelector(`${calendarSelector}, ${selector}`)));
      });
      mutations = relevant;
      const nativeClasses = value => (value || '').split(/\s+/).filter(value => value && !['bbs-marking', 'bbs-flagged-title'].includes(value)).join(' ');
      if (!mutations.some(m => m.type !== 'attributes' || m.attributeName !== 'class' || nativeClasses(m.oldValue) !== nativeClasses(m.target.getAttribute('class')))) return;
      clearTimeout(timer); timer = setTimeout(refresh, 100);
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true, attributeFilter: ['class', 'style', 'hidden', 'href', 'aria-describedby', 'data-event-id', 'data-eventid', 'data-assignment-id', 'data-assignmentid', 'data-summary', 'data-description', ...SchoolStatusCalendarDates.attributes] });
  }
  start();
})();
