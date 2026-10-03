const { test } = require('node:test');
const assert = require('node:assert/strict');
const { identify } = require('./identity.js');
const { cards, placement, orderKey, assignmentURL } = require('./kanban-model.js');
const origin = 'https://example.myschoolapp.com';
const event = (title, attributes = {}) => ({ textContent: title, querySelector: () => null, getAttribute: name => attributes[name] || null });
const identifyA = element => identify(element, origin, 'Student A');
const events = ['Alpha', 'Bravo', 'Charlie'].map((title, index) => event(title, { 'data-assignment-id': String(index) }));
const keys = events.map(element => identifyA(element).key);

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
