import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock firebase/firestore to avoid initializeApp() call in otpService
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({})),
}));

import { getOTPExpiryTime } from './services/otpService';

describe('OTP Service - getOTPExpiryTime', () => {
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

  it('AUTH-OTP-008a: returns null when no OTP stored', () => {
    const email = 'missing@example.com';
    const res = getOTPExpiryTime(email);
    expect(res).toBeNull();
  });

  it('AUTH-OTP-008b: returns null when stored JSON is invalid', () => {
    const email = 'corrupt@example.com';
    const key = `otp_${email.toLowerCase()}`;
    // store invalid JSON
    (globalThis.sessionStorage as any).setItem(key, 'not-a-json');

    const res = getOTPExpiryTime(email);
    expect(res).toBeNull();
  });
});
