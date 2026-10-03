const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseDate, today, isDueSoon } = require('./calendar-dates.js');

test('calendar dates retain the written day instead of shifting across timezones', () => {
  for (const value of ['2026-10-06', '2026-10-06T00:00:00Z', '2026-10-06T23:00:00-07:00', '10/6/2026', 'October 6, 2026', 'Tue, Oct 6, 2026']) {
    assert.equal(parseDate(value), '2026-10-06');
  }
  assert.equal(today(new Date(2026, 9, 6, 23, 59)), '2026-10-06');
});

test('invalid, missing-year, and impossible dates stay unknown', () => {
  for (const value of [null, '', 'tomorrow', 'Oct 6', '2026-02-29', '2026-13-01', '2026-04-31', '2/30/2026', 'Homework 2026-10-06']) {
    assert.equal(parseDate(value), null);
  }
  assert.equal(parseDate('2028-02-29'), '2028-02-29');
});

test('two school days includes today and skips weekends, with an inclusive cutoff', () => {
  const friday = new Date(2026, 9, 2, 23, 59);
  for (const date of ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06']) assert.equal(isDueSoon(date, friday), true, date);
  assert.equal(isDueSoon('2026-10-07', friday), false);
  assert.equal(isDueSoon('2026-10-01', friday), false);
  assert.equal(isDueSoon(null, friday), false);
  assert.equal(isDueSoon('2026-10-06', new Date(2026, 9, 3)), true);
  assert.equal(isDueSoon('2026-10-07', new Date(2026, 9, 3)), false);
});

test('school-day calculation handles DST and year boundaries without holiday assumptions', () => {
  assert.equal(isDueSoon('2026-03-10', new Date(2026, 2, 6)), true);
  assert.equal(isDueSoon('2026-03-11', new Date(2026, 2, 6)), false);
  assert.equal(isDueSoon('2027-01-04', new Date(2026, 11, 31)), true);
  assert.equal(isDueSoon('2027-01-05', new Date(2026, 11, 31)), false);
});
