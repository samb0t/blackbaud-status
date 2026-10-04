/* Local fixture only. Not loaded by the extension manifest. */
const saved = {}, listeners = [];
globalThis.chrome = { storage: {
  local: { get: async () => ({}), set: async () => {} },
  sync: {
    get: async () => ({ ...saved }),
    set: async values => {
      const changes = {};
      for (const [key, value] of Object.entries(values)) { changes[key] = { newValue: value }; saved[key] = value; }
      listeners.forEach(fn => fn(changes, 'sync'));
    },
    remove: async keys => {
      const changes = {};
      for (const key of Array.isArray(keys) ? keys : [keys]) { delete saved[key]; changes[key] = {}; }
      listeners.forEach(fn => fn(changes, 'sync'));
    }
  },
  onChanged: { addListener: fn => listeners.push(fn) }
} };
document.getElementById('calendar').addEventListener('click', event => {
  const item = event.target.closest('.fc-event');
  if (item) { event.preventDefault(); const opened = document.getElementById('opened'); if (opened) opened.textContent = 'Normal assignment click: ' + item.textContent; }
});
document.getElementById('next')?.addEventListener('click', () => {
  const calendar = document.querySelector('#calendar .fc-view-container');
  const copy = calendar.firstElementChild.cloneNode(true);
  copy.querySelector('h2').textContent = 'New month (same assignments)';
  copy.querySelectorAll('[data-bbs-status]').forEach(el => el.removeAttribute('data-bbs-status'));
  calendar.replaceChildren(copy);
});
