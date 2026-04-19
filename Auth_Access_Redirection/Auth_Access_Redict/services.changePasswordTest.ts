import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../lib/firebase/config', () => ({
  auth: { currentUser: null },
  db: { __mock: 'db' },
}));

import { changePassword } from './services';

describe('Auth Services - changePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AUTH-SVC-006: changePassword khi chưa login ném lỗi Người dùng chưa đăng nhập", async () => {
    await expect(changePassword('SomeNewPass@123')).rejects.toThrow('Người dùng chưa đăng nhập');
  });
});
