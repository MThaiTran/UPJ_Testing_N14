import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock firebase/firestore to avoid initializeApp() in otpService
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({})),
}));

import { storeOTP, verifyOTP } from './services/otpService';

describe('OTP Service - verifyOTP', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = {};
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem: (k: string) => (k in storage ? storage[k] : null),
        setItem: (k: string, v: string) => { storage[k] = v; },
        removeItem: (k: string) => { delete storage[k]; },
        clear: () => { storage = {}; },
      },
      configurable: true,
      writable: true,
    });
  });

  it('AUTH-OTP-003: verifyOTP success xóa OTP khỏi sessionStorage', () => {
    const email = 'tester@example.com';
    const otp = '654321';

    // Store OTP (this will hash and save into sessionStorage)
    storeOTP(email, otp);

    const key = `otp_${email.toLowerCase()}`;
    // Ensure stored
    expect(globalThis.sessionStorage.getItem(key)).not.toBeNull();

    // Verify with correct OTP
    const result = verifyOTP(email, otp);
    expect(result.success).toBe(true);
    expect(result.code).toBe('otp.verifySuccess');

    // Storage entry should be removed
    expect(globalThis.sessionStorage.getItem(key)).toBeNull();
  });

  it('AUTH-OTP-004: verifyOTP sai OTP tăng attempts và trả remaining', () => {
    const email = 'tester2@example.com';
    const correctOtp = '111222';
    const wrongOtp = '000000';

    // Store OTP
    storeOTP(email, correctOtp);
    const key = `otp_${email.toLowerCase()}`;

    // Initial stored attempts should be 0
    const initialRaw = globalThis.sessionStorage.getItem(key) as string;
    const initial = JSON.parse(initialRaw);
    expect(initial.attempts).toBe(0);

    // Verify with wrong OTP
    const result = verifyOTP(email, wrongOtp);
    expect(result.success).toBe(false);
    expect(result.code).toBe('otp.incorrect');
    expect(result.metadata).toBeDefined();
    const remaining = (result.metadata as any).remaining;
    expect(remaining).toBeGreaterThanOrEqual(0);

    // Stored attempts should have increased by 1
    const afterRaw = globalThis.sessionStorage.getItem(key) as string;
    const after = JSON.parse(afterRaw);
    expect(after.attempts).toBe(initial.attempts + 1);
    expect(remaining).toBe((after.maxAttempts - after.attempts));
  });

  it('AUTH-OTP-005: verifyOTP hết hạn trả otp.expired và xóa data', () => {
    const email = 'expired@example.com';
    const otp = '999888';

    // Manually craft expired OTP data and store in sessionStorage
    const key = `otp_${email.toLowerCase()}`;
    const expiredData = {
      email: email.toLowerCase(),
      hashedOTP: 'fakehash',
      expiresAt: Date.now() - 1000, // already expired
      attempts: 0,
      maxAttempts: 3,
    };

    // store raw JSON into mock sessionStorage
    (globalThis.sessionStorage as any).setItem(key, JSON.stringify(expiredData));

    // Ensure stored
    expect(globalThis.sessionStorage.getItem(key)).not.toBeNull();

    const result = verifyOTP(email, otp);
    expect(result.success).toBe(false);
    expect(result.code).toBe('otp.expired');

    // Data should be removed
    expect(globalThis.sessionStorage.getItem(key)).toBeNull();
  });

  it('AUTH-OTP-006: verifyOTP quá số lần trả otp.maxAttempts', () => {
    const email = 'locked@example.com';
    const otp = '121212';

    const key = `otp_${email.toLowerCase()}`;
    const data = {
      email: email.toLowerCase(),
      hashedOTP: 'fakehash',
      expiresAt: Date.now() + 60000,
      attempts: 3,
      maxAttempts: 3,
    };

    // Put data where attempts == maxAttempts
    (globalThis.sessionStorage as any).setItem(key, JSON.stringify(data));

    const result = verifyOTP(email, otp);
    expect(result.success).toBe(false);
    expect(result.code).toBe('otp.maxAttempts');

    // Entry should be removed after hitting max attempts
    expect(globalThis.sessionStorage.getItem(key)).toBeNull();
  });
});
