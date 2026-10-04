/* Pure board helpers, shared with the dependency-free tests. */
(function (root) {
  const columns = ['', 'progress', 'done', 'ignore'];
  const orderKey = key => 'bbs-order:' + key;
  const rank = (records, key) => Number.isFinite(records[orderKey(key)]) ? records[orderKey(key)] : null;
  const customPrefix = (origin, scope) => 'bbs-custom:' + JSON.stringify([origin, (scope || '').replace(/\s+/g, ' ').trim()]) + ':';
  const dataKey = key => 'bbs-card:' + key;
  const day = 86400000;
  function retention(value, status, now = Date.now()) {
    const completedAt = status === 'done' && Number.isFinite(value.completedAt) ? value.completedAt : null;
    const archiveAt = completedAt === null ? null : completedAt + 14 * day;
    const deleteAt = archiveAt === null ? null : archiveAt + 90 * day;
    return { archiveAt, deleteAt, archived: archiveAt !== null && now >= archiveAt, expired: deleteAt !== null && now >= deleteAt };
  }
  function customMove(value, previousStatus, status, now = Date.now()) {
    const { completedAt, ...details } = value;
    return status === 'done' ? { ...details, completedAt: previousStatus === 'done' && Number.isFinite(completedAt) ? completedAt : now } : details;
  }
  function cleanup(records, now = Date.now()) {
    const values = {}, remove = [];
    for (const [data, value] of Object.entries(records)) {
      if (!data.startsWith('bbs-card:bbs-custom:') || !value || typeof value.title !== 'string') continue;
      const key = data.slice('bbs-card:'.length);
      if (records[key] !== 'done') continue;
      if (!Number.isFinite(value.completedAt)) values[data] = customMove(value, 'done', 'done', now);
      else if (retention(value, records[key], now).expired) remove.push(data, key, orderKey(key));
    }
    return { values, remove };
  }
  function customCards(records, origin, scope) {
    const prefix = customPrefix(origin, scope);
    return Object.entries(records).filter(([key, value]) => key.startsWith(dataKey(prefix)) && value && typeof value.title === 'string' && typeof value.summary === 'string' && typeof value.dueDate === 'string')
      .map(([key, value]) => ({ key: key.slice('bbs-card:'.length), title: value.title, summary: value.summary, dueDate: value.dueDate, ...retention(value, records[key.slice('bbs-card:'.length)]), custom: true, events: [] }));
  }
  function cards(events, identify, records, getDueDate = () => null, custom = []) {
    const unique = new Map();
    for (const event of events) {
      const identity = identify(event);
      if (!identity) continue;
      if (unique.has(identity.key)) { unique.get(identity.key).events.push(event); continue; }
      unique.set(identity.key, { ...identity, events: [event], status: columns.includes(records[identity.key]) ? records[identity.key] : '' });
    }
    return [...[...unique.values()].map(item => ({ ...item, dueDate: getDueDate(item.events) })),
      ...custom.map(item => ({ ...item, status: columns.includes(records[item.key]) ? records[item.key] : '' }))].sort((a, b) => {
      const left = rank(records, a.key), right = rank(records, b.key);
      if (left !== right) {
        if (left === null) return 1;
        if (right === null) return -1;
        return left - right;
      }
      return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') || a.title.localeCompare(b.title) || a.key.localeCompare(b.key);
    });
  }
  // Return only changed ranks. Normally one item is written; rebalance when
  // inserting among unranked cards or when floating-point gaps are exhausted.
  function placement(items, records, key, status, beforeKey = null) {
    if (!columns.includes(status) || !items.some(item => item.key === key)) return null;
    const target = items.filter(item => item.status === status && item.key !== key);
    let index = beforeKey === null ? target.length : target.findIndex(item => item.key === beforeKey);
    if (index < 0) return null;
    target.splice(index, 0, items.find(item => item.key === key));
    const previous = index > 0 ? rank(records, target[index - 1].key) : null;
    const next = index + 1 < target.length ? rank(records, target[index + 1].key) : null;
    const value = previous === null ? (next === null ? 1024 : next - 1024)
      : next === null ? previous + 1024 : previous + (next - previous) / 2;
    const unranked = target.some(item => item.key !== key && rank(records, item.key) === null);
    if (!unranked && Number.isFinite(value) && (previous === null || value > previous) && (next === null || value < next)) {
      return { [orderKey(key)]: value };
    }
    return Object.fromEntries(target.map((item, i) => [orderKey(item.key), (i + 1) * 1024])
      .filter(([key, value]) => records[key] !== value));
  }
  function assignmentURL(events, base) {
    for (const event of events) {
      const href = event.getAttribute('href') || event.querySelector('a[href]')?.getAttribute('href');
      if (!href || href.trim() === '#') continue;
      try {
        const url = new URL(href, base);
        if (['https:', 'http:'].includes(url.protocol)) return url.href;
      } catch { /* Leave cards without usable links as plain titles. */ }
    }
    return null;
  }
  root.SchoolStatusKanbanModel = { columns, orderKey, customPrefix, dataKey, customCards, retention, customMove, cleanup, cards, placement, assignmentURL };
  if (typeof module !== 'undefined') module.exports = root.SchoolStatusKanbanModel;
})(globalThis);
