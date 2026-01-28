import { describe, it, expect } from 'vitest';
import {
  parseDate,
  parseDateToTimestamp,
  dateInRange,
  isoToDisplayDate,
  getMonthNames,
} from '../../src/utils/dates.js';

describe('parseDate', () => {
  it('removes dashes from date strings', () => {
    expect(parseDate('Jun 4 - 2025')).toBe('Jun 4 2025');
    expect(parseDate('Dec 15 - 2024')).toBe('Dec 15 2024');
  });

  it('removes _N suffixes', () => {
    expect(parseDate('Jun 4 2025_1')).toBe('Jun 4 2025');
    expect(parseDate('Jun 4 - 2025_2')).toBe('Jun 4 2025');
    expect(parseDate('Jun 4 2025_123')).toBe('Jun 4 2025');
  });

  it('trims whitespace', () => {
    expect(parseDate('  Jun 4 2025  ')).toBe('Jun 4 2025');
  });

  it('handles already clean dates', () => {
    expect(parseDate('Jun 4 2025')).toBe('Jun 4 2025');
  });

  it('returns empty string for invalid input', () => {
    expect(parseDate(null)).toBe('');
    expect(parseDate(undefined)).toBe('');
    expect(parseDate('')).toBe('');
  });
});

describe('parseDateToTimestamp', () => {
  it('parses valid date strings to timestamp', () => {
    const timestamp = parseDateToTimestamp('Jun 4 2025');
    const date = new Date(timestamp);
    
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(5); // June is month 5 (0-indexed)
    expect(date.getDate()).toBe(4);
  });

  it('handles dates with dashes', () => {
    const timestamp = parseDateToTimestamp('Jun 4 - 2025');
    const date = new Date(timestamp);
    
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(4);
  });

  it('returns null for invalid input', () => {
    expect(parseDateToTimestamp(null)).toBe(null);
    expect(parseDateToTimestamp(undefined)).toBe(null);
    expect(parseDateToTimestamp('')).toBe(null);
    expect(parseDateToTimestamp('invalid')).toBe(null);
  });

  it('returns null for invalid month names', () => {
    expect(parseDateToTimestamp('Foo 4 2025')).toBe(null);
    expect(parseDateToTimestamp('January 4 2025')).toBe(null); // Full name not supported
  });

  it('parses all valid month names', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    months.forEach((month, index) => {
      const timestamp = parseDateToTimestamp(`${month} 1 2025`);
      const date = new Date(timestamp);
      expect(date.getMonth()).toBe(index);
    });
  });
});

describe('dateInRange', () => {
  it('returns true when date is within range', () => {
    // Use mid-month dates to avoid timezone boundary issues
    expect(dateInRange('Jun 15 2025', '2025-06-01', '2025-06-30')).toBe(true);
    expect(dateInRange('Jun 10 2025', '2025-06-01', '2025-06-30')).toBe(true);
    expect(dateInRange('Jun 20 2025', '2025-06-01', '2025-06-30')).toBe(true);
  });

  it('returns false when date is outside range', () => {
    expect(dateInRange('May 15 2025', '2025-06-01', '2025-06-30')).toBe(false);
    expect(dateInRange('Jul 15 2025', '2025-06-01', '2025-06-30')).toBe(false);
  });

  it('handles dates with dashes', () => {
    expect(dateInRange('Jun 15 - 2025', '2025-06-01', '2025-06-30')).toBe(true);
  });

  it('returns false for invalid dates', () => {
    expect(dateInRange('invalid', '2025-06-01', '2025-06-30')).toBe(false);
    expect(dateInRange('', '2025-06-01', '2025-06-30')).toBe(false);
  });
});

describe('isoToDisplayDate', () => {
  it('converts ISO date to display format', () => {
    expect(isoToDisplayDate('2025-06-04')).toBe('Jun 4 2025');
    expect(isoToDisplayDate('2025-01-15')).toBe('Jan 15 2025');
    expect(isoToDisplayDate('2025-12-31')).toBe('Dec 31 2025');
  });

  it('removes leading zeros from day', () => {
    expect(isoToDisplayDate('2025-06-01')).toBe('Jun 1 2025');
    expect(isoToDisplayDate('2025-06-09')).toBe('Jun 9 2025');
  });

  it('returns original for invalid input', () => {
    expect(isoToDisplayDate('')).toBe('');
    expect(isoToDisplayDate(null)).toBe('');
    expect(isoToDisplayDate(undefined)).toBe('');
    expect(isoToDisplayDate('invalid')).toBe('invalid');
  });

  it('returns original for invalid month', () => {
    expect(isoToDisplayDate('2025-13-01')).toBe('2025-13-01');
    expect(isoToDisplayDate('2025-00-01')).toBe('2025-00-01');
  });
});

describe('getMonthNames', () => {
  it('returns array of 12 month abbreviations', () => {
    const months = getMonthNames();
    
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('Jan');
    expect(months[5]).toBe('Jun');
    expect(months[11]).toBe('Dec');
  });

  it('returns a copy, not the original array', () => {
    const months1 = getMonthNames();
    const months2 = getMonthNames();
    
    months1[0] = 'Changed';
    expect(months2[0]).toBe('Jan');
  });
});
