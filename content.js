(() => {
  'use strict';
  if (document.getElementById('bbs-personal-status')) return;
  const selector = '.fc-event, .fc-list-event, .fc-list-item';
  const statuses = { progress: ['In progress', '#ffe49a'], soon: ['Due soon', '#ffc1bb'], done: ['Done', '#bce8c7'], ignore: ['In class / don’t worry', '#d7dce2'] };
  const host = document.createElement('div');
  host.id = 'bbs-personal-status';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `<style>
    :host { all: initial; position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; font: 14px/1.45 system-ui, sans-serif; color: #182636; }
    :host([hidden]) { display: none !important; }
    * { box-sizing: border-box; } section { width: 290px; border: 1px solid #cbd5df; background: white; border-radius: 14px; padding: 16px; box-shadow: 0 8px 35px #18263630; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 12px; } strong { font-size: 16px; } button, input { font: inherit; } button { cursor: pointer; border: 1px solid #b9c7d4; border-radius: 7px; padding: 8px 10px; background: #f5f8fb; color: #182636; } button:hover { filter: brightness(.96); } button:focus-visible, input:focus-visible { outline: 3px solid #276ac3; outline-offset: 2px; }
    #toggle { width: 100%; margin-top: 12px; } #toggle[aria-pressed=true] { background: #163d68; color: white; } p { margin: 10px 0; } small { color: #536479; display: block; margin-top: 8px; } label { display: block; margin-top: 12px; } input { width: 100%; padding: 7px; border: 1px solid #b9c7d4; border-radius: 6px; } #choices { display: grid; gap: 6px; } #selection { border-top: 1px solid #dce3e9; margin-top: 12px; padding-top: 12px; } #title { overflow-wrap: anywhere; font-weight: 600; } #message { color: #9b3028; } [hidden] { display: none !important; } #legend { font-size: 12px; } #legend span { display: inline-block; padding: 2px 5px; border-radius: 4px; margin: 3px 2px 0 0; }
    :host { color-scheme: light; }
    #theme { width: 100%; margin-top: 12px; }
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
    <header><strong>My statuses</strong><button id="collapse" aria-expanded="true" aria-label="Collapse status panel">−</button></header>
    <div id="body"><button id="theme" aria-pressed="false" disabled>Dark mode</button><button id="toggle" aria-pressed="false">Start marking</button>
    <small id="count" role="status"></small>
    <div id="legend"><span style="background:#ffe49a">In progress</span><span style="background:#ffc1bb">Due soon</span><span style="background:#bce8c7">Done</span><span style="background:#d7dce2">In class / don’t worry</span></div>
    <label for="scope">Student / calendar profile</label><input id="scope" maxlength="100" placeholder="e.g. Student A" />
    <small>Use a different profile for each child. Statuses sync through Chrome when Chrome Sync is enabled. “Due soon” is a manual label.</small>
    <div id="selection" hidden><p id="title"></p><small id="identity"></small><div id="choices"></div><button id="cancel" style="margin-top:8px">Cancel</button></div>
    <small id="message" role="alert"></small></div>
  </section>`;
  const $ = id => shadow.getElementById(id);
  let records = {}, scope = '', marking = false, selected = null, pending = false;
  const scopeKey = 'bbs-profile:' + location.origin;
  const themeKey = 'bbs-setting:dark-mode';
  function applyTheme() {
    const dark = records[themeKey] === true;
    host.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.toggleAttribute('data-bbs-dark', dark);
    $('theme').setAttribute('aria-pressed', String(dark));
  }
  const identify = event => SchoolStatusIdentity.identify(event, location.origin, scope);
  function closeSelection() { selected = null; $('selection').hidden = true; }
  function refresh() {
    const events = [...document.querySelectorAll(selector)];
    host.hidden = events.length === 0;
    $('count').textContent = `${events.length} calendar items found. ${marking ? 'Click an item to set its status. Esc stops marking.' : 'Normal calendar clicks are enabled.'}`;
    for (const event of events) {
      const identity = identify(event);
      const status = identity && records[identity.key];
      if (Object.hasOwn(statuses, status)) {
        if (event.getAttribute('data-bbs-status') !== status) event.setAttribute('data-bbs-status', status);
      } else if (event.hasAttribute('data-bbs-status')) event.removeAttribute('data-bbs-status');
      event.classList.toggle('bbs-marking', marking);
    }
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
    refresh();
    let timer;
    new MutationObserver(mutations => {
      if (!mutations.some(m => m.type !== 'attributes' || !['data-bbs-status', 'class'].includes(m.attributeName))) return;
      clearTimeout(timer); timer = setTimeout(refresh, 100);
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'data-event-id', 'data-eventid', 'data-assignment-id', 'data-assignmentid'] });
  }
  start();
})();
