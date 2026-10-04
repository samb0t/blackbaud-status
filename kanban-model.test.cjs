const { test } = require('node:test');
const assert = require('node:assert/strict');
const { identify } = require('./identity.js');
const { cards, placement, orderKey, assignmentURL, customPrefix, dataKey, customCards } = require('./kanban-model.js');
const origin = 'https://example.myschoolapp.com';
const event = (title, attributes = {}) => ({ textContent: title, querySelector: () => null, getAttribute: name => attributes[name] || null });
const identifyA = element => identify(element, origin, 'Student A');
const events = ['Alpha', 'Bravo', 'Charlie'].map((title, index) => event(title, { 'data-assignment-id': String(index) }));
const keys = events.map(element => identifyA(element).key);

test('custom cards isolate school/profile data and keep identical titles distinct', () => {
  const a = customPrefix(origin, 'Student A') + 'one', b = customPrefix(origin, 'Student A') + 'two';
  const value = { title: 'Alpha', dueDate: '2026-10-06', summary: 'Personal task' };
  const records = { [dataKey(a)]: value, [dataKey(b)]: value, [a]: 'progress' };
  assert.equal(customCards(records, origin, 'Student B').length, 0);
  assert.equal(customCards(records, 'https://other.myschoolapp.com', 'Student A').length, 0);
  const custom = customCards(records, origin, ' Student   A ');
  const result = cards(events, identifyA, records, () => '2026-10-07', custom);
  assert.equal(result.length, 5);
  assert.deepEqual(result.slice(0, 2).map(item => item.key), [a, b]);
  assert.equal(result[0].status, 'progress');
  assert.equal(cards([], identifyA, records, () => null, custom).length, 2);
  Object.assign(records, placement(result, records, b, '', keys[0]));
  assert.equal(cards(events, identifyA, records, () => '2026-10-07', custom)[0].key, b);
});

test('board deduplicates calendar segments and shares the calendar identity/status', () => {
  const duplicate = event('Alpha continued', { 'data-assignment-id': '0' });
  const result = cards([...events, duplicate, event(' ')], identifyA, { [keys[0]]: 'done', [keys[1]]: 'invalid' });
  assert.equal(result.length, 3);
  assert.equal(result[0].events.length, 2);
  assert.equal(result[0].status, 'done');
  assert.equal(result[1].status, '');
});

test('manual ordering survives rebuilding the board and leaves hidden-range ranks alone', () => {
  const records = { [orderKey('offscreen')]: 55 };
  Object.assign(records, placement(cards(events, identifyA, records), records, keys[2], '', keys[0]));
  assert.deepEqual(cards([...events].reverse(), identifyA, records).map(item => item.key), [keys[2], keys[0], keys[1]]);
  assert.equal(records[orderKey('offscreen')], 55);
  const move = placement(cards(events, identifyA, records), records, keys[2], '');
  assert.equal(Object.keys(move).length, 1);
  Object.assign(records, move);
  assert.deepEqual(cards(events, identifyA, records).map(item => item.key), keys);
});

test('default ordering uses earliest due dates, unknown dates last, and saved ranks first', () => {
  const duplicate = event('Bravo continued', { 'data-assignment-id': '1' });
  const dueDate = segments => segments.length > 1 ? '2026-10-06' : segments[0] === events[2] ? '2026-10-02' : null;
  const input = [...events, duplicate];
  assert.deepEqual(cards(input, identifyA, {}, dueDate).map(item => item.key), [keys[2], keys[1], keys[0]]);
  const records = { [orderKey(keys[0])]: 1024 };
  assert.deepEqual(cards(input, identifyA, records, dueDate).map(item => item.key), [keys[0], keys[2], keys[1]]);
});

test('moving across columns appends or inserts using the target column order', () => {
  const records = { [keys[0]]: 'done', [keys[1]]: 'done', [orderKey(keys[0])]: 1024, [orderKey(keys[1])]: 2048 };
  Object.assign(records, placement(cards(events, identifyA, records), records, keys[2], 'done', keys[1]), { [keys[2]]: 'done' });
  assert.deepEqual(cards(events, identifyA, records).map(item => item.key), [keys[0], keys[2], keys[1]]);
  assert.equal(records[orderKey(keys[2])], 1536);
});

test('exhausted or concurrent equal ranks are rebalanced without losing cards', () => {
  for (const ranks of [[1024, 1024], [1, 1 + Number.EPSILON]]) {
    const records = { [orderKey(keys[0])]: ranks[0], [orderKey(keys[1])]: ranks[1] };
    Object.assign(records, placement(cards(events, identifyA, records), records, keys[2], '', keys[1]));
    assert.deepEqual(cards(events, identifyA, records).map(item => item.key), [keys[0], keys[2], keys[1]]);
    assert.equal(new Set(keys.map(key => records[orderKey(key)])).size, 3);
  }
});

test('profile and school scopes isolate ordering as well as statuses', () => {
  const records = { [keys[2]]: 'soon', [orderKey(keys[2])]: -1024 };
  for (const identifyOther of [element => identify(element, origin, 'Student B'), element => identify(element, 'https://other.myschoolapp.com', 'Student A')]) {
    const result = cards(events, identifyOther, records);
    assert.deepEqual(result.map(item => item.title), ['Alpha', 'Bravo', 'Charlie']);
    assert.ok(result.every(item => item.status === ''));
  }
});

test('stale drag targets and unknown columns cannot produce writes', () => {
  const items = cards(events, identifyA, {});
  assert.equal(placement(items, {}, 'missing', 'done'), null);
  assert.equal(placement(items, {}, keys[0], 'unknown'), null);
  assert.equal(placement(items, {}, keys[0], 'done', keys[1]), null);
});

test('assignment links allow web routes but reject script and placeholder links', () => {
  assert.equal(assignmentURL([event('A', { href: '/assignment?assignmentId=42' })], origin), origin + '/assignment?assignmentId=42');
  assert.equal(assignmentURL([event('A', { href: '#assignment/42' })], origin + '/calendar'), origin + '/calendar#assignment/42');
  for (const href of ['#', 'javascript:void(0)', 'data:text/html,test', 'file:///tmp/example']) {
    assert.equal(assignmentURL([event('A', { href })], origin), null);
  }
});
