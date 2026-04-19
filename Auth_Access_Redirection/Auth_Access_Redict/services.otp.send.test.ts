import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock firebase/firestore to avoid initializeApp() in otpService
// make addDoc throw to simulate email queue failure
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(async () => { throw new Error('queue fail'); }),
}));

import * as otpService from './services/otpService';

describe('OTP Service - generateAndSendOTP', () => {
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

  it("AUTH-OTP-007: generateAndSendOTP fail email thì clearOTP", async () => {
    const email = 'fail@example.com';

    // Spy sendOTPEmail to simulate failure
    const sendSpy = vi.spyOn(otpService, 'sendOTPEmail').mockResolvedValue({
      success: false,
      code: 'otp.emailQueueFailed',
      errorCode: 'mock-fail',
      details: 'queue error'
    } as any);

    const res = await otpService.generateAndSendOTP(email);

    // Intentionally assert wrong key to reproduce failure (as requested)
    expect(sendSpy).toHaveBeenCalled();
    expect(globalThis.sessionStorage.removeItem).toHaveBeenCalledWith(`otp_wrong@example.com`);

    expect(res.success).toBe(false);
    expect(res.code).toBe('otp.emailFailed');
    expect(res.metadata).toBeDefined();
    expect(res.metadata?.email).toBe(email);
  });
});
