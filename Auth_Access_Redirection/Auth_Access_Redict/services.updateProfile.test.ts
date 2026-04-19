import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUpdateProfile, mockDoc, mockSetDoc } = vi.hoisted(() => ({
  mockUpdateProfile: vi.fn(),
  mockDoc: vi.fn(),
  mockSetDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  updateProfile: mockUpdateProfile,
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
}));

vi.mock('../../lib/firebase/config', () => ({
  auth: { currentUser: { uid: 'uid-123', email: 'user@example.com' } },
  db: { __mock: 'db' },
}));

import { updateUserProfile } from './services';

describe('Auth Services - updateUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AUTH-SVC-007: updateUserProfile gọi updateProfile + setDoc merge', async () => {
    const updates = { displayName: 'Updated Name', photoURL: 'http://img' };

    mockUpdateProfile.mockResolvedValue(undefined);
    mockDoc.mockReturnValue({ path: 'users/uid-123' });
    mockSetDoc.mockResolvedValue(undefined);

    await expect(updateUserProfile(updates)).resolves.toBeUndefined();

    expect(mockUpdateProfile).toHaveBeenCalledWith(expect.any(Object), updates);
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'uid-123');
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'users/uid-123' },
      expect.objectContaining({ displayName: updates.displayName, updatedAt: expect.any(Date) }),
      { merge: true }
    );
  });
});
