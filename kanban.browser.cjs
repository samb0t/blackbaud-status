/* Optional browser integration check: install Playwright, then run this file. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { join } = require('node:path');

(async () => {
  let seed = {};
  const files = new Set(['demo.html', 'demo.js', 'identity.js', 'calendar-dates.js', 'kanban-model.js', 'kanban.js', 'content.js', 'content.css']);
  const server = createServer(async (request, response) => {
    const file = request.url.slice(1);
    if (!files.has(file)) { response.writeHead(404).end(); return; }
    try {
      let body = await readFile(join(__dirname, file), 'utf8');
      if (file === 'demo.js') body += '\nObject.assign(saved, ' + JSON.stringify(seed) + ');';
      response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
      response.end(body);
    } catch { response.writeHead(500).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
    await page.clock.setFixedTime(new Date(2026, 9, 2, 12));
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/demo.html#calendar`);
    const board = page.locator('#bbs-kanban');
    const panel = page.locator('#bbs-personal-status');
    const column = status => board.locator(`.column[data-status="${status}"]`);
    const titles = status => column(status).locator('.title').allTextContents();
    const settled = () => page.waitForFunction(() => {
      const root = document.querySelector('#bbs-kanban')?.shadowRoot;
      return root && !root.querySelector('select:disabled') && root.querySelector('#message').textContent !== 'Saving…';
    });
    await panel.locator('#collapse').click();
    assert.equal(await panel.locator('#body').isVisible(), false);
    for (const id of ['theme', 'board']) {
      const button = panel.locator('#' + id);
      assert.equal(await button.isVisible(), true);
      const bounds = await button.boundingBox(), collapseBounds = await panel.locator('#collapse').boundingBox();
      assert.ok(bounds.width <= 32 && Math.abs(bounds.y - collapseBounds.y) < 1);
    }
    await panel.locator('#collapse').click();
    await panel.locator('#board').click();
    assert.equal(await panel.locator('#board').getAttribute('aria-label'), 'Back to calendar');
    assert.deepEqual(await board.locator('.card time').evaluateAll(nodes => nodes.map(node => node.dateTime)), ['2026-10-02', '2026-10-06', '2026-10-07']);
    assert.equal(await page.locator('.fc-month-button').evaluate(element => element.nextElementSibling.matches('.bbs-kanban-tab')), true);
    assert.equal(await page.locator('.bbs-kanban-tab').getAttribute('aria-label'), 'Kanban board');
    assert.equal((await page.locator('.bbs-kanban-tab').textContent()).trim(), '');
    const monthBox = await page.locator('.fc-month-button').boundingBox(), tabBox = await page.locator('.bbs-kanban-tab').boundingBox();
    assert.ok(tabBox.x >= monthBox.x + monthBox.width - 1 && tabBox.y < monthBox.y + monthBox.height && tabBox.width <= 34);
    assert.equal(await board.locator('.column').count(), 4);
    assert.equal(await page.locator('.bbs-due-flag').count(), 3);
    assert.equal(await board.locator('.card').count(), 4);
    assert.equal(await page.locator('.fc-view-container').isVisible(), false);

    const project = board.locator('.card').filter({ hasText: 'Sample Project' });
    const reading = board.locator('.card').filter({ hasText: 'Sample Reading' });
    assert.equal(await board.locator('.due-date').count(), 4);
    assert.equal(await project.locator('time').getAttribute('datetime'), '2026-10-06');
    assert.equal(await board.locator('.due-flag').count(), 2);
    assert.equal(await reading.locator('.due-flag').count(), 0);
    assert.equal(await board.getByText('Due date unavailable', { exact: true }).count(), 1);
    assert.deepEqual(await board.locator('.drag-handle').allTextContents(), ['⠿', '⠿', '⠿', '⠿']);

    // Flags update on date rollover even when the calendar DOM has not changed.
    await page.clock.setFixedTime(new Date(2026, 9, 5, 12));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    assert.equal(await reading.locator('.due-flag').count(), 1);
    assert.equal(await page.locator('.bbs-due-flag').count(), 3);
    await page.clock.setFixedTime(new Date(2026, 9, 2, 12));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await project.locator('select').selectOption('progress'); await settled();
    assert.equal(await project.locator('time').getAttribute('datetime'), '2026-10-06');
    assert.equal(await project.locator('.due-flag').count(), 1);
    assert.equal(await column('progress').locator('.card').count(), 1);
    assert.equal(await page.locator('[data-assignment-id="101"][data-bbs-status="progress"]').count(), 2);
    assert.equal(await page.locator('[data-assignment-id="101"] .bbs-due-flag path').first().evaluate(node => getComputedStyle(node).fill), 'rgb(198, 40, 40)');

    // The menu and actual browser drag/drop both update the calendar's status.
    await project.locator('.drag-handle').dragTo(column('done').locator('h3')); await settled();
    assert.equal(await column('done').locator('.card').count(), 1);
    assert.equal(await page.locator('[data-assignment-id="101"] .bbs-due-flag path').first().evaluate(node => getComputedStyle(node).fill), 'rgb(198, 40, 40)');
    await project.locator('select').selectOption(''); await settled();
    assert.equal(await page.locator('[data-assignment-id="101"][data-bbs-status]').count(), 0);
    await project.getByRole('button', { name: /Move .* up in/ }).click(); await settled();
    assert.equal((await titles(''))[2], 'Sample Project (Student A)');
    await project.locator('.drag-handle').dragTo(column('').locator('.card').first().locator('.drag-handle')); await settled();
    assert.equal((await titles(''))[0], 'Sample Project (Student A)');
    const ordered = await titles('');

    await panel.locator('#theme').click();
    assert.equal(await board.getAttribute('data-dark'), '');
    assert.equal(await page.locator('nav').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(255, 251, 220)');
    assert.equal(await page.locator('.site-banner').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(117, 197, 223)');
    assert.equal(await page.locator('.site-banner span').evaluate(node => getComputedStyle(node).color), 'rgb(24, 38, 54)');
    assert.equal(await page.locator('nav .active').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(217, 242, 250)');
    assert.equal(await page.locator('nav .active span').evaluate(node => getComputedStyle(node).color), 'rgb(24, 38, 54)');
    assert.equal(await page.locator('.fc-toolbar').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(34, 48, 68)');
    await page.evaluate(() => { location.hash = 'resources'; });
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-bbs-dark'));
    assert.equal(await board.getAttribute('data-dark'), null);
    assert.equal(await page.locator('.site-banner span').evaluate(node => getComputedStyle(node).color), 'rgb(181, 196, 213)');
    assert.equal(await page.evaluate(async () => (await chrome.storage.sync.get(null))['bbs-setting:dark-mode']), true);
    await page.evaluate(() => { location.hash = 'calendar/week'; });
    await page.waitForFunction(() => document.documentElement.hasAttribute('data-bbs-dark'));
    assert.equal(await page.locator('.bbs-due-flag path').first().evaluate(node => getComputedStyle(node).fill), 'rgb(255, 130, 123)');
    seed = await page.evaluate(() => chrome.storage.sync.get(null));
    await page.reload(); await page.locator('.bbs-kanban-tab').click();
    assert.deepEqual(await titles(''), ordered);
    assert.equal(await board.getAttribute('data-dark'), '');

    // Simulate a remote sync update and a write failure without losing saved data.
    const key = await project.getAttribute('data-key');
    await page.evaluate(key => chrome.storage.sync.set({ [key]: 'soon' }), key);
    assert.equal(await column('soon').count(), 0);
    assert.equal(await column('').locator('.card').count(), 4);
    await page.evaluate(key => chrome.storage.sync.set({ [key]: 'progress' }), key);
    await page.evaluate(() => { window.originalSet = chrome.storage.sync.set; chrome.storage.sync.set = async () => { throw new Error('quota'); }; });
    await project.locator('select').selectOption('done'); await settled();
    assert.equal(await column('progress').locator('.card').count(), 1);
    assert.match(await board.locator('#message').textContent(), /Could not save/);
    await page.evaluate(() => { chrome.storage.sync.set = window.originalSet; });
    await page.evaluate(() => { window.originalRemove = chrome.storage.sync.remove; chrome.storage.sync.remove = async () => { throw new Error('quota'); }; });
    await project.locator('select').selectOption(''); await settled();
    assert.equal(await column('progress').locator('.card').count(), 1);
    assert.match(await board.locator('#message').textContent(), /Could not save/);
    await page.evaluate(() => { chrome.storage.sync.remove = window.originalRemove; });

    await panel.locator('#scope').fill('Student B'); await panel.locator('#scope').dispatchEvent('change');
    assert.equal(await column('progress').locator('.card').count(), 0);
    assert.equal(await column('').locator('.card').count(), 4);
    await panel.locator('#scope').fill(''); await panel.locator('#scope').dispatchEvent('change');
    assert.equal(await column('progress').locator('.card').count(), 1);

    // Board follows range replacements, including an empty range, without retaining cards.
    await page.locator('#next').click();
    await page.waitForFunction(() => document.querySelector('#bbs-kanban').shadowRoot.querySelectorAll('.card').length === 3);
    await page.evaluate(() => { const grid = document.createElement('div'); grid.className = 'fc-month-view'; document.querySelector('.fc-view-container').replaceChildren(grid); });
    await board.locator('#empty').waitFor({ state: 'visible' });
    assert.equal(await board.locator('.card').count(), 0);
    await page.getByRole('button', { name: 'Month', exact: true }).click();
    assert.equal(await board.isVisible(), false);
    assert.notEqual(await page.locator('.fc-view-container').evaluate(element => getComputedStyle(element).display), 'none');
    assert.equal(await page.locator('.bbs-kanban-tab').count(), 1);

    // List views, including empty lists, cannot open Kanban through either entry.
    await page.reload();
    await page.evaluate(() => document.querySelector('.fc-month-view').className = 'week fc-list-view');
    await page.locator('.bbs-kanban-tab').waitFor({ state: 'detached' });
    assert.equal(await panel.locator('#board').isVisible(), false);
    await panel.locator('#board').evaluate(button => button.click());
    assert.equal(await board.isVisible(), false);
    await page.evaluate(() => document.querySelector('.fc-list-view').className = 'week fc-month-view');
    await page.locator('.bbs-kanban-tab').waitFor();
    await page.locator('.bbs-kanban-tab').click();
    await page.evaluate(() => document.querySelector('.fc-month-view').className = 'week fc-list-view');
    await board.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.fc-view-container').isVisible(), true);
    await page.reload();
    await page.evaluate(() => { document.querySelector('.fc-toolbar').remove(); document.querySelector('#calendar').id = 'unknown-calendar'; });
    await page.locator('.bbs-kanban-tab').waitFor({ state: 'detached' });
    await panel.locator('#board').waitFor({ state: 'hidden' });
    assert.equal(await panel.locator('#board').isVisible(), false);
    assert.equal(await page.locator('.fc-view-container').isVisible(), true);

    // A modern FullCalendar container can be replaced while the board is open.
    await page.evaluate(() => {
      const calendar = document.querySelector('#unknown-calendar'); calendar.classList.add('fc');
      const toolbar = document.createElement('div'); toolbar.className = 'fc-header-toolbar';
      toolbar.innerHTML = '<div class="fc-toolbar-chunk"><button type="button">Month</button></div>';
      calendar.prepend(toolbar); document.querySelector('.fc-view-container').className = 'fc-view-harness';
    });
    await page.locator('.bbs-kanban-tab').waitFor();
    await page.locator('.bbs-kanban-tab').click();
    assert.equal(await board.getAttribute('data-overlay'), null);
    assert.equal(await page.locator('.fc-view-harness').isVisible(), false);
    await page.evaluate(() => {
      const view = document.querySelector('.fc-view-harness'); const replacement = view.cloneNode(true);
      replacement.removeAttribute('data-bbs-kanban-hidden'); view.replaceWith(replacement);
    });
    await page.waitForFunction(() => document.querySelector('.fc-view-harness').hasAttribute('data-bbs-kanban-hidden'));
    await board.locator('#back').click();
    assert.equal(await page.locator('.fc-view-harness').isVisible(), true);

    // Due-date extraction from real DOM shapes, including spanning month events.
    const extracted = await page.evaluate(() => {
      const parse = html => {
        const fixture = document.createElement('div'); fixture.innerHTML = html;
        return SchoolStatusCalendarDates.dueDate([...fixture.querySelectorAll('.fc-event, .fc-list-event')]);
      };
      return [
        parse('<div data-date="2026-10-02"><a class="fc-event" data-due-date="2026-10-06">Project</a></div>'),
        parse('<a class="fc-event"><span class="due-date">Due: October 6, 2026</span></a>'),
        parse('<a class="fc-event" aria-label="Project, due: 10/6/2026">Project</a>'),
        parse('<table><tbody><tr class="fc-list-day" data-date="2026-10-06"><td>Tuesday</td></tr><tr class="fc-list-event"><td>Project</td></tr></tbody></table>'),
        parse('<div class="fc-row"><div class="fc-bg"><table><tr><td data-date="2026-10-04"></td><td data-date="2026-10-05"></td><td data-date="2026-10-06"></td></tr></table></div><div class="fc-content-skeleton"><table><tr><td rowspan="2"></td><td colspan="2"></td></tr><tr><td colspan="2"><a class="fc-event fc-end">Project</a></td></tr></table></div></div>'),
        parse('<div data-date="2026-10-06"><a class="fc-event fc-start">Continues beyond this range</a></div>'),
        parse('<a class="fc-event" data-due-date="2026-10-06">Project</a><a class="fc-event" data-date="2026-10-09">Repeated segment</a>')
      ];
    });
    assert.deepEqual(extracted, ['2026-10-06', '2026-10-06', '2026-10-06', '2026-10-06', '2026-10-06', null, '2026-10-06']);
    const measured = await page.evaluate(() => {
      const fixture = document.createElement('div');
      fixture.innerHTML = '<table style="table-layout:fixed;width:300px;border-collapse:collapse"><tbody><tr><td class="fc-daygrid-day" data-date="2026-10-04" style="width:100px"><a class="fc-event fc-event-start fc-event-end" style="width:280px;box-sizing:border-box">Three-day project</a></td><td class="fc-daygrid-day" data-date="2026-10-05" style="width:100px"></td><td class="fc-daygrid-day" data-date="2026-10-06" style="width:100px"></td></tr></tbody></table>';
      document.body.append(fixture);
      const event = fixture.querySelector('.fc-event');
      // Like Blackbaud's clipped week segment: neither start nor end is present.
      event.className = 'fc-event fc-event-past fc-daygrid-event fc-daygrid-block-event fc-h-event has-open-popover';
      const clipped = SchoolStatusCalendarDates.dueDate([event]);
      event.setAttribute('data-due-date', '2026-10-09');
      const explicit = SchoolStatusCalendarDates.dueDate([event]);
      event.removeAttribute('data-due-date');
      event.classList.add('fc-event-end');
      const visible = SchoolStatusCalendarDates.dueDate([event]);
      fixture.style.display = 'none';
      const hidden = SchoolStatusCalendarDates.dueDate([event]);
      fixture.querySelector('[data-date]').setAttribute('data-date', '2026-10-11');
      const invalidated = SchoolStatusCalendarDates.dueDate([event]);
      fixture.remove();
      return [clipped, explicit, visible, hidden, invalidated];
    });
    assert.deepEqual(measured, [null, '2026-10-09', '2026-10-06', '2026-10-06', null]);
    await page.locator('.bbs-kanban-tab').click();
    await page.evaluate(() => document.querySelectorAll('[data-assignment-id="101"]').forEach(event => event.setAttribute('data-due-date', '2026-10-09')));
    await project.locator('time[datetime="2026-10-09"]').waitFor();
    assert.equal(await project.locator('.due-flag').count(), 0);
    assert.equal(await page.locator('[data-assignment-id="101"] .bbs-due-flag').count(), 0);
    // Blackbaud renders descriptions in a separate Bootstrap popup, not the event.
    const description = 'Your informative zine and 150-200 word summary for your Meso/Indus research topic is due on Tues. Oct. 6th. We will be presenting them in class on that day.';
    await page.evaluate(description => {
      const popup = document.createElement('div'); popup.className = 'popover fade bottom in'; popup.id = 'summary-fixture';
      popup.innerHTML = '<div class="popover-content"><div class="results"><a class="popover-close">×</a><p class="simple"><span class="bb-headline">Sample Project</span></p><p class="bb-emphasized simple">Student A</p><p class="simple">Course name</p><p class="simple">Due: Tue, Oct 06</p><p class="simple">Assigned: Thu, Sep 24</p><div class="simple-topoffset"></div><hr><div><a href="/lms-assignment/assignment/assignment-parent-view/41969538/7023091">More Details</a></div></div></div>';
      popup.querySelector('.simple-topoffset').textContent = description + '\u00a0';
      document.body.append(popup);
    }, description);
    await page.waitForFunction(description => [...document.querySelector('#bbs-kanban').shadowRoot.querySelectorAll('.note')].some(node => node.textContent === description), description);
    assert.equal(await project.locator('.note').textContent(), description);
    assert.equal(await reading.locator('.note').count(), 0);
    assert.deepEqual(await project.locator('.ordering button').allTextContents(), ['↑', '↓']);
    assert.equal(await project.locator('[data-control="up"]').getAttribute('title'), 'Move up');
    const longDescription = description.repeat(3);
    await page.evaluate(text => { document.querySelector('#summary-fixture .simple-topoffset').textContent = text; }, longDescription);
    const truncated = longDescription.slice(0, 197).trimEnd() + '...';
    await page.waitForFunction(text => [...document.querySelector('#bbs-kanban').shadowRoot.querySelectorAll('.note')].some(node => node.textContent === text), truncated);
    await page.evaluate(() => document.querySelector('#summary-fixture').remove());
    await project.locator('select').selectOption('done'); await settled();
    assert.equal(await project.locator('.note').textContent(), truncated);
    assert.equal(await project.locator('.note').evaluate(node => node.children.length), 0);
    // A popup can be created and dismissed before the calendar debounce fires.
    await board.locator('#back').click();
    await page.evaluate(() => {
      const popup = document.createElement('div'); popup.className = 'popover';
      popup.innerHTML = '<div class="popover-content"><span class="bb-headline">Sample Reading</span><p class="bb-emphasized">Student A</p><div class="simple-topoffset">Read chapters 3 and 4 before class.</div></div>';
      document.body.append(popup);
      popup.remove();
    });
    await page.locator('.bbs-kanban-tab').click();
    assert.equal(await reading.locator('.note').textContent(), 'Read chapters 3 and 4 before class.');
    // Custom cards persist independently of calendar events and keep stable IDs when edited.
    await board.locator('#add').click();
    await board.locator('#card-title').fill('Personal project');
    await board.locator('#card-due').fill('2026-10-06');
    await board.locator('#card-summary').fill('Bring <b>supplies</b>\nand notes.');
    await page.evaluate(() => {
      globalThis.restoreCustomSet = chrome.storage.sync.set;
      chrome.storage.sync.set = async () => { throw new Error('Storage full'); };
    });
    await board.locator('#save-card').click(); await settled();
    assert.equal(await board.locator('#editor').isVisible(), true);
    assert.equal(await board.locator('#message').getAttribute('data-error'), '');
    assert.equal(await board.locator('#card-title').inputValue(), 'Personal project');
    await page.evaluate(() => { chrome.storage.sync.set = globalThis.restoreCustomSet; });
    await board.locator('#save-card').click(); await settled();
    const custom = board.locator('.card').filter({ hasText: 'Personal project' });
    assert.equal(await custom.locator('time').getAttribute('datetime'), '2026-10-06');
    assert.equal(await custom.locator('.due-flag').count(), 1);
    assert.equal(await custom.locator('.note').last().textContent(), 'Bring <b>supplies</b>\nand notes.');
    assert.equal(await custom.locator('.note b').count(), 0);
    const customKey = await custom.getAttribute('data-key');
    await custom.locator('select').selectOption('progress'); await settled();
    await custom.getByRole('button', { name: 'Edit Personal project', exact: true }).click();
    await board.locator('#card-due').fill('2026-11-10');
    await board.locator('#save-card').click(); await settled();
    assert.equal(await custom.getAttribute('data-key'), customKey);
    assert.equal(await custom.locator('select').inputValue(), 'progress');
    assert.equal(await custom.locator('.due-flag').count(), 0);
    await panel.locator('#scope').fill('Other student'); await panel.locator('#scope').dispatchEvent('change');
    await custom.waitFor({ state: 'detached' });
    await panel.locator('#scope').fill(''); await panel.locator('#scope').dispatchEvent('change');
    await custom.waitFor();
    seed = await page.evaluate(() => ({ ...saved }));
    await page.reload(); await panel.locator('#board').click(); await custom.waitFor();
    assert.equal(await custom.locator('time').getAttribute('datetime'), '2026-11-10');
    await page.evaluate(() => document.querySelectorAll('.fc-event').forEach(node => node.remove()));
    await page.waitForFunction(() => document.querySelector('#bbs-kanban').shadowRoot.querySelectorAll('.card').length === 1);
    await custom.locator('select').selectOption('done'); await settled();
    const completedAt = await page.evaluate(key => saved[SchoolStatusKanbanModel.dataKey(key)].completedAt, customKey);
    await custom.getByRole('button', { name: 'Edit Personal project', exact: true }).click();
    await board.locator('#card-summary').fill('Completed notes');
    await board.locator('#save-card').click(); await settled();
    assert.equal(await page.evaluate(key => saved[SchoolStatusKanbanModel.dataKey(key)].completedAt, customKey), completedAt);
    await page.clock.setFixedTime(new Date(completedAt + 14 * 86400000));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await custom.waitFor({ state: 'detached' });
    await board.locator('#archive').click(); await custom.waitFor();
    assert.match(await custom.locator('.note').last().textContent(), /Permanently deletes/);
    await custom.getByRole('button', { name: 'Restore to To do' }).click(); await settled();
    assert.equal(await custom.count(), 0);
    await board.locator('#archive').click(); await custom.waitFor();
    assert.equal(await custom.locator('select').inputValue(), '');
    assert.equal(await page.evaluate(key => saved[SchoolStatusKanbanModel.dataKey(key)].completedAt, customKey), undefined);
    page.once('dialog', dialog => dialog.accept());
    await custom.getByRole('button', { name: 'Delete Personal project', exact: true }).click(); await settled();
    assert.equal(await custom.count(), 0);
    assert.equal(await page.evaluate(key => [key, SchoolStatusKanbanModel.dataKey(key), SchoolStatusKanbanModel.orderKey(key)].some(key => key in saved), customKey), false);
    await page.evaluate(({ key, completedAt }) => chrome.storage.sync.set({
      [key]: 'done', [SchoolStatusKanbanModel.orderKey(key)]: 1024,
      [SchoolStatusKanbanModel.dataKey(key)]: { title: 'Expired card', summary: '', dueDate: '2026-10-06', completedAt }
    }), { key: customKey, completedAt });
    await page.clock.setFixedTime(new Date(completedAt + 104 * 86400000));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(key => !Object.hasOwn(saved, SchoolStatusKanbanModel.dataKey(key)), customKey);
    assert.equal(await page.evaluate(key => [key, SchoolStatusKanbanModel.orderKey(key)].some(key => key in saved), customKey), false);
    assert.deepEqual(errors, []);
    console.log('Kanban browser checks passed: toolbar icon, due dates/flags, date rollover, view switching, deduplication, drag/drop, menus, ordering, reload, sync, failures, profiles, dark mode, range updates, and custom card create/edit/delete/persistence.');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
