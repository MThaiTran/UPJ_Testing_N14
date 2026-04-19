import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock firebase/firestore to avoid initializeApp() call in otpService
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({})),
}));

import { storeOTP } from './services/otpService';

describe('OTP Service - storeOTP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, 'sessionStorage', {
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

  it('AUTH-OTP-002: storeOTP lưu sessionStorage key otp_emaillowercase', () => {
    const email = 'User@Example.COM';
    const otp = '123456';

    storeOTP(email, otp);

    const expectedKey = 'otp_user@example.com';
    expect(globalThis.sessionStorage.setItem).toHaveBeenCalled();

    // Verify key and stored JSON structure
    const [[calledKey, calledValue]] = (globalThis.sessionStorage.setItem as any).mock.calls;
    expect(calledKey).toBe(expectedKey);

    const parsed = JSON.parse(calledValue);
    expect(parsed.email).toBe('user@example.com');
    expect(typeof parsed.hashedOTP).toBe('string');
    expect(parsed.attempts).toBe(0);
    expect(parsed.maxAttempts).toBe(3);
    expect(typeof parsed.expiresAt).toBe('number');
    expect(parsed.expiresAt).toBeGreaterThan(Date.now());
  });
});
