import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateUserWithEmailAndPassword, mockUpdateProfile, mockSendEmailVerification, mockDoc, mockSetDoc } = vi.hoisted(() => ({
  mockCreateUserWithEmailAndPassword: vi.fn(),
  mockUpdateProfile: vi.fn(),
  mockSendEmailVerification: vi.fn(),
  mockDoc: vi.fn(),
  mockSetDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  updateProfile: mockUpdateProfile,
  sendEmailVerification: mockSendEmailVerification,
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
}));

vi.mock('../../lib/firebase/config', () => ({
  auth: { currentUser: null },
  db: { __mock: 'db' },
}));

import { register } from './services';

describe('Auth Services - register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AUTH-SVC-004: register thành công tạo doc users role=user và sendEmailVerification', async () => {
    const credentials = { email: 'newuser@example.com', password: 'NewPass@123', displayName: 'New User' };

    const fakeUserCredential = {
      user: {
        uid: 'uid-new-001',
        email: 'newuser@example.com',
        displayName: 'New User',
        photoURL: null,
        emailVerified: false,
      },
    };

    mockCreateUserWithEmailAndPassword.mockResolvedValue(fakeUserCredential);
    mockUpdateProfile.mockResolvedValue(undefined);
    mockDoc.mockReturnValue({ path: 'users/uid-new-001' });
    mockSetDoc.mockResolvedValue(undefined);
    mockSendEmailVerification.mockResolvedValue(undefined);

    const result = await register(credentials as any);

    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), credentials.email, credentials.password);
    expect(mockUpdateProfile).toHaveBeenCalledWith(fakeUserCredential.user, { displayName: credentials.displayName });
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'uid-new-001');
    expect(mockSetDoc).toHaveBeenCalledWith({ path: 'users/uid-new-001' }, expect.objectContaining({ email: credentials.email, role: 'user' }));
    expect(mockSendEmailVerification).toHaveBeenCalledWith(fakeUserCredential.user);

    expect(result).toEqual({
      uid: 'uid-new-001',
      email: 'newuser@example.com',
      displayName: 'New User',
      photoURL: null,
      emailVerified: false,
      role: 'user',
    });
  });
});
