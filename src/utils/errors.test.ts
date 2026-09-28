import { describe, expect, it } from 'vitest';
import { errorMessage } from './errors';

describe('errorMessage', () => {
  it('reads Error.message', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('reads string errors', () => {
    expect(errorMessage('nope')).toBe('nope');
  });

  it('falls back for unknown values', () => {
    expect(errorMessage(null, 'fallback')).toBe('fallback');
    expect(errorMessage({ message: 12 }, 'fallback')).toBe('fallback');
  });
});
