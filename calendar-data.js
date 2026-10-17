/* Runs in the page's MAIN world: FullCalendar's JS properties are not visible
 * to isolated content scripts. Publish only the fields used by the extension. */
(() => {
  'use strict';
  const selector = '.fc-event, .fc-list-event, .fc-list-item';
  const fields = { LongDescription: 'summary', AssignmentId: 'assignment-id', EventId: 'event-id', UserId: 'user-id', DateDue: 'due-date', DetailLink: 'detail-link', GroupName: 'subject' };
  let frame;
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(publish);
  }
  function publish() {
    const events = [...document.querySelectorAll(selector)];
    let index = 0;
    function batch() {
      for (let count = 0; count < 20 && index < events.length; count++, index++) {
        const event = events[index];
        if (!event.isConnected) continue;
        const props = event.fcSeg?.eventRange?.def?.extendedProps;
        for (const [field, suffix] of Object.entries(fields)) {
          const attribute = 'data-bbs-' + suffix;
          const raw = props?.[field];
          const value = typeof raw === 'string' || (typeof raw === 'number' && Number.isFinite(raw)) ? String(raw) : null;
          if (value !== null) {
            if (event.getAttribute(attribute) !== value) event.setAttribute(attribute, value);
          } else if (event.hasAttribute(attribute)) event.removeAttribute(attribute);
        }
      }
      if (index < events.length) frame = requestAnimationFrame(batch);
    }
    batch();
  }
  new MutationObserver(mutations => {
    if (mutations.some(mutation => {
      const target = mutation.target.nodeType === Node.ELEMENT_NODE ? mutation.target : mutation.target.parentElement;
      if (target?.closest('#bbs-kanban, .bbs-kanban-tab, .bbs-due-flag')) return false;
      if (target?.closest(selector)) return true;
      return [...mutation.addedNodes, ...mutation.removedNodes].some(node =>
        node.nodeType === Node.ELEMENT_NODE && (node.matches(selector) || node.querySelector(selector)));
    })) schedule();
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  schedule();
})();
