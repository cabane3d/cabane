import { describe, expect, it } from 'vitest';
import { createFakePlatform } from './platform';

describe('createFakePlatform', () => {
  it('returns the provided application info', async () => {
    const platform = createFakePlatform({ name: 'Cabane', version: '1.2.3' });
    expect(platform.kind).toBe('fake');
    await expect(platform.getAppInfo()).resolves.toEqual({ name: 'Cabane', version: '1.2.3' });
  });
});
