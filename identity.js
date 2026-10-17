/* Shared by the content script and the dependency-free identity tests. */
(function (root) {
  const normalize = value => (value || '').replace(/\s+/g, ' ').trim();
  function identify(event, origin, scope) {
    const title = normalize(event.querySelector('.fc-event-title, .fc-title, .fc-list-event-title, .fc-list-item-title')?.textContent || event.textContent);
    if (!title) return null;
    let id = null;
    for (const type of ['assignment', 'event']) {
      const value = event.getAttribute(`data-bbs-${type}-id`)?.trim();
      if (!value || value === '0') continue;
      id = [type + 'id', value];
      const userId = event.getAttribute('data-bbs-user-id')?.trim();
      if (userId && userId !== '0') id.push('userid', userId);
      break;
    }
    for (const attribute of ['data-assignment-id', 'data-assignmentid', 'data-event-id', 'data-eventid']) {
      if (id) break;
      const value = event.getAttribute(attribute);
      if (value) { id = [attribute.replaceAll('-', '').replace('data', ''), value]; break; }
    }
    if (!id) {
      const href = event.getAttribute('href') || event.querySelector('a[href]')?.getAttribute('href');
      if (href) {
        try {
          const url = new URL(href, origin);
          // Only explicit assignment/event IDs qualify; never use a calendar or student ID.
          const match = (url.search + url.hash).match(/(?:[?&#/]|^)(assignmentid|eventid)[=/]([^&#/?]+)/i);
          if (match) id = [match[1].toLowerCase(), match[2]];
        } catch { /* Non-URL calendar links are handled by title fallback. */ }
      }
    }
    return { title, fallback: !id, key: 'bbs:' + JSON.stringify([origin, normalize(scope), ...(id || ['title', title])]) };
  }
  root.SchoolStatusIdentity = { identify };
  if (typeof module !== 'undefined') module.exports = { identify };
})(globalThis);
