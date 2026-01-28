import { describe, it, expect } from 'vitest';
import {
  getStatClass,
  formatMetricValue,
  formatChangeValue,
  formatCurrency,
} from '../../src/utils/formatters.js';

describe('getStatClass', () => {
  it('returns "positive" for values greater than 5', () => {
    expect(getStatClass(10)).toBe('positive');
    expect(getStatClass(5.1)).toBe('positive');
    expect(getStatClass(100)).toBe('positive');
    expect(getStatClass('+15.2%')).toBe('positive');
  });

  it('returns "negative" for values less than -5', () => {
    expect(getStatClass(-10)).toBe('negative');
    expect(getStatClass(-5.1)).toBe('negative');
    expect(getStatClass(-100)).toBe('negative');
    expect(getStatClass('-15.2%')).toBe('negative');
  });

  it('returns "neutral" for values between -5 and 5', () => {
    expect(getStatClass(0)).toBe('neutral');
    expect(getStatClass(5)).toBe('neutral');
    expect(getStatClass(-5)).toBe('neutral');
    expect(getStatClass(3)).toBe('neutral');
    expect(getStatClass(-3)).toBe('neutral');
    expect(getStatClass('+2.5%')).toBe('neutral');
  });

  it('handles edge cases', () => {
    expect(getStatClass(NaN)).toBe('neutral');
    expect(getStatClass('invalid')).toBe('neutral');
  });
});

describe('formatMetricValue', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatMetricValue(null)).toBe('--');
    expect(formatMetricValue(undefined)).toBe('--');
  });

  it('formats millions with M suffix', () => {
    expect(formatMetricValue(1000000)).toBe('1M');
    expect(formatMetricValue(1500000)).toBe('1.5M');
    expect(formatMetricValue(2000000)).toBe('2M');
    expect(formatMetricValue(10500000)).toBe('10.5M');
  });

  it('formats thousands with K suffix', () => {
    expect(formatMetricValue(1000)).toBe('1K');
    expect(formatMetricValue(1500)).toBe('1.5K');
    expect(formatMetricValue(25000)).toBe('25K');
    expect(formatMetricValue(999000)).toBe('999K');
  });

  it('formats small numbers without suffix', () => {
    expect(formatMetricValue(0)).toBe('0');
    expect(formatMetricValue(500)).toBe('500');
    expect(formatMetricValue(999)).toBe('999');
  });

  it('removes trailing .0 from formatted values', () => {
    expect(formatMetricValue(1000000)).toBe('1M');
    expect(formatMetricValue(2000)).toBe('2K');
  });
});

describe('formatChangeValue', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatChangeValue(null)).toBe('--');
    expect(formatChangeValue(undefined)).toBe('--');
  });

  it('adds + prefix for positive values', () => {
    expect(formatChangeValue(100)).toBe('+100');
    expect(formatChangeValue(1500)).toBe('+1.5K');
    expect(formatChangeValue(2000000)).toBe('+2M');
  });

  it('keeps - prefix for negative values', () => {
    expect(formatChangeValue(-100)).toBe('-100');
    expect(formatChangeValue(-1500)).toBe('-1.5K');
    expect(formatChangeValue(-2000000)).toBe('-2M');
  });

  it('handles zero correctly', () => {
    expect(formatChangeValue(0)).toBe('0');
  });

  it('formats large changes with M suffix', () => {
    expect(formatChangeValue(1500000)).toBe('+1.5M');
    expect(formatChangeValue(-1500000)).toBe('-1.5M');
  });
});

describe('formatCurrency', () => {
  it('returns "--" for null or undefined', () => {
    expect(formatCurrency(null)).toBe('--');
    expect(formatCurrency(undefined)).toBe('--');
  });

  it('formats with $ prefix and thousands separator', () => {
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrency(100)).toBe('$100');
    expect(formatCurrency(1000)).toBe('$1,000');
    expect(formatCurrency(1234567)).toBe('$1,234,567');
  });
});
