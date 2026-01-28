import { describe, it, expect } from 'vitest';
import {
  interpolateData,
  hasInterpolatableGaps,
} from '../../src/utils/interpolate.js';

describe('interpolateData', () => {
  it('returns empty arrays for empty input', () => {
    const result = interpolateData([]);
    expect(result.real).toEqual([]);
    expect(result.estimated).toEqual([]);
    expect(result.isEstimated).toEqual([]);
  });

  it('returns empty arrays for null/undefined input', () => {
    expect(interpolateData(null).real).toEqual([]);
    expect(interpolateData(undefined).real).toEqual([]);
  });

  it('returns original array when no nulls present', () => {
    const input = [10, 20, 30, 40];
    const result = interpolateData(input);
    
    expect(result.real).toEqual([10, 20, 30, 40]);
    expect(result.estimated).toEqual([null, null, null, null]);
    expect(result.isEstimated).toEqual([false, false, false, false]);
  });

  it('interpolates single null gap between values', () => {
    const input = [10, null, 30];
    const result = interpolateData(input);
    
    expect(result.real).toEqual([10, 20, 30]);
    expect(result.estimated).toEqual([null, 20, null]);
    expect(result.isEstimated).toEqual([false, true, false]);
  });

  it('interpolates multiple consecutive nulls', () => {
    const input = [10, null, null, 40];
    const result = interpolateData(input);
    
    expect(result.real).toEqual([10, 20, 30, 40]);
    expect(result.estimated).toEqual([null, 20, 30, null]);
    expect(result.isEstimated).toEqual([false, true, true, false]);
  });

  it('does not interpolate leading nulls', () => {
    const input = [null, null, 30, 40];
    const result = interpolateData(input);
    
    expect(result.real).toEqual([null, null, 30, 40]);
    expect(result.isEstimated).toEqual([false, false, false, false]);
  });

  it('does not interpolate trailing nulls', () => {
    const input = [10, 20, null, null];
    const result = interpolateData(input);
    
    expect(result.real).toEqual([10, 20, null, null]);
    expect(result.isEstimated).toEqual([false, false, false, false]);
  });

  it('handles multiple separate gaps', () => {
    const input = [10, null, 30, null, 50];
    const result = interpolateData(input);
    
    expect(result.real).toEqual([10, 20, 30, 40, 50]);
    expect(result.isEstimated).toEqual([false, true, false, true, false]);
  });

  it('rounds interpolated values to integers', () => {
    const input = [10, null, null, null, 23];
    const result = interpolateData(input);
    
    // Step = (23-10)/4 = 3.25
    // Values should be 10, 13.25 -> 13, 16.5 -> 17, 19.75 -> 20, 23
    expect(result.real).toEqual([10, 13, 17, 20, 23]);
  });

  it('handles decreasing values', () => {
    const input = [100, null, 60];
    const result = interpolateData(input);
    
    expect(result.real).toEqual([100, 80, 60]);
  });

  it('does not modify original array', () => {
    const input = [10, null, 30];
    interpolateData(input);
    
    expect(input).toEqual([10, null, 30]);
  });
});

describe('hasInterpolatableGaps', () => {
  it('returns false for empty or small arrays', () => {
    expect(hasInterpolatableGaps([])).toBe(false);
    expect(hasInterpolatableGaps([1])).toBe(false);
    expect(hasInterpolatableGaps([1, 2])).toBe(false);
    expect(hasInterpolatableGaps(null)).toBe(false);
  });

  it('returns false when no nulls present', () => {
    expect(hasInterpolatableGaps([1, 2, 3, 4])).toBe(false);
  });

  it('returns true for interpolatable gaps', () => {
    expect(hasInterpolatableGaps([1, null, 3])).toBe(true);
    expect(hasInterpolatableGaps([1, 2, null, 4, 5])).toBe(true);
  });

  it('returns false for leading nulls only', () => {
    expect(hasInterpolatableGaps([null, null, 3, 4])).toBe(false);
  });

  it('returns false for trailing nulls only', () => {
    expect(hasInterpolatableGaps([1, 2, null, null])).toBe(false);
  });

  it('returns true when there is at least one interpolatable gap', () => {
    expect(hasInterpolatableGaps([null, 2, null, 4, null])).toBe(true);
  });
});
