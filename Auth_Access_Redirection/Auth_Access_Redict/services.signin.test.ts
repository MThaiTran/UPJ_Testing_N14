import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSignInWithEmailAndPassword, mockDoc, mockGetDoc, mockSetDoc } = vi.hoisted(() => ({
  mockSignInWithEmailAndPassword: vi.fn(),
  mockDoc: vi.fn(),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
}));

vi.mock('../../lib/firebase/config', () => ({
  auth: { currentUser: null },
  db: { __mock: 'db' },
}));

import { signIn } from './services';

describe('Auth Services - signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  it('AUTH-SVC-001: signIn thành công user thường, lấy role từ Firestore', async () => {
    // TCID: AUTH-SVC-001
    const credentials = { email: 'student@example.com', password: 'Password@123' };

    const fakeUserCredential = {
      user: {
        uid: 'uid-user-001',
        email: 'student@example.com',
        displayName: 'Student One',
        photoURL: null,
        emailVerified: true,
      },
    };

    mockSignInWithEmailAndPassword.mockResolvedValue(fakeUserCredential);
    mockDoc.mockReturnValue({ path: 'users/uid-user-001' });
    mockGetDoc.mockResolvedValue({ data: () => ({ role: 'creator' }) });

    const result = await signIn(credentials);

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), credentials.email, credentials.password);
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'uid-user-001');
    expect(mockGetDoc).toHaveBeenCalledWith({ path: 'users/uid-user-001' });

    expect(result).toEqual({
      uid: 'uid-user-001',
      email: 'student@example.com',
      displayName: 'Student One',
      photoURL: null,
      emailVerified: true,
      role: 'creator',
    });
  });

  it('AUTH-SVC-002: signIn với admin123@gmail.com tự gán admin + setDoc + localStorage', async () => {
    // TCID: AUTH-SVC-002
    const credentials = { email: 'admin123@gmail.com', password: 'Admin@123' };

    const fakeUserCredential = {
      user: {
        uid: 'uid-admin-001',
        email: 'admin123@gmail.com',
        displayName: null,
        photoURL: null,
        emailVerified: true,
      },
    };

    mockSignInWithEmailAndPassword.mockResolvedValue(fakeUserCredential);
    mockDoc.mockReturnValue({ path: 'users/uid-admin-001' });

    const result = await signIn(credentials);

    // setDoc should be called to save admin role
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: 'users/uid-admin-001' },
      expect.objectContaining({ role: 'admin', isAdmin: true, email: 'admin123@gmail.com' }),
      { merge: true }
    );

    // localStorage saved
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('user_role_uid-admin-001', 'admin');
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith('isAdmin', 'true');

    expect(result).toEqual({
      uid: 'uid-admin-001',
      email: 'admin123@gmail.com',
      displayName: null,
      photoURL: null,
      emailVerified: true,
      role: 'admin',
    });
  });

  it("AUTH-SVC-003: signIn fail auth/wrong-password trả message tiếng Việt đúng", async () => {
    // TCID: AUTH-SVC-003
    const credentials = { email: 'student@example.com', password: 'wrongpass' };

    // Simulate Firebase wrong password error
    const fakeError = { code: 'auth/wrong-password' };
    mockSignInWithEmailAndPassword.mockRejectedValue(fakeError);

    await expect(signIn(credentials)).rejects.toThrow('Mật khẩu không chính xác');

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), credentials.email, credentials.password);
  });
});
