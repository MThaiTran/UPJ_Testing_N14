import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSendPasswordResetEmail } = vi.hoisted(() => ({
  mockSendPasswordResetEmail: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

vi.mock('../../lib/firebase/config', () => ({
  auth: { currentUser: null },
  db: { __mock: 'db' },
}));

import { resetPassword } from './services';

describe('Auth Services - resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AUTH-SVC-005: resetPassword gọi sendPasswordResetEmail đúng email', async () => {
    const email = 'recover@example.com';

    mockSendPasswordResetEmail.mockResolvedValue(undefined);

    await expect(resetPassword(email)).resolves.toBeUndefined();

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), email);
  });
});
