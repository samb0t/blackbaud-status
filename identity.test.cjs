const { test } = require('node:test');
const assert = require('node:assert/strict');
const { identify } = require('./identity.js');
const origin = 'https://example.myschoolapp.com';
const event = (title, attributes = {}) => ({ textContent: title, querySelector: () => null, getAttribute: name => attributes[name] || null });
test('segments with a stable assignment ID match despite differing text', () => {
  assert.equal(identify(event('First segment', { 'data-assignment-id': '12' }), origin, 'Student A').key,
    identify(event('Continued', { 'data-assignment-id': '12' }), origin, 'Student A').key);
});
test('different assignment IDs never merge identical titles', () => {
  assert.notEqual(identify(event('Homework', { 'data-event-id': '1' }), origin, 'Student A').key,
    identify(event('Homework', { 'data-event-id': '2' }), origin, 'Student A').key);
});
test('title fallback normalizes whitespace and explicitly reports fallback', () => {
  const a = identify(event('  Homework\n (Student A) '), origin, 'Student A');
  assert.equal(a.key, identify(event('Homework (Student A)'), origin, 'Student A').key);
  assert.equal(a.fallback, true);
});
test('school and student profile isolate statuses', () => {
  const a = identify(event('Homework'), origin, 'Student A').key;
  assert.notEqual(a, identify(event('Homework'), origin, 'Student B').key);
  assert.notEqual(a, identify(event('Homework'), 'https://other.myschoolapp.com', 'Student A').key);
});
test('explicit link ID is recognized but student IDs and javascript links are not', () => {
  assert.equal(identify(event('HW', { href: '/calendar?assignmentId=42' }), origin, '').fallback, false);
  assert.equal(identify(event('HW', { href: '/calendar?studentId=42' }), origin, '').fallback, true);
  assert.equal(identify(event('HW', { href: 'javascript:void(0)' }), origin, '').fallback, true);
});
test('empty events are ignored', () => assert.equal(identify(event(' '), origin, ''), null));
