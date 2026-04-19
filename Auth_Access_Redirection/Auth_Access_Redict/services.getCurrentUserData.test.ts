import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../lib/firebase/config', () => ({
  auth: { currentUser: null },
  db: { __mock: 'db' },
}));

import { getCurrentUserData } from './services';

describe('Auth Services - getCurrentUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AUTH-SVC-008: getCurrentUserData trả null khi currentUser null', async () => {
    const result = await getCurrentUserData();
    expect(result).toBeNull();
  });
});
