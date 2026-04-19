import { describe, expect, it, vi } from 'vitest';

// Mock firebase/firestore before importing the module that calls getFirestore()
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({})),
}));

import { generateOTP } from './services/otpService';

describe('OTP Service', () => {
  it('AUTH-OTP-001: generateOTP luôn 6 chữ số', () => {
    // Run multiple times to reduce flakiness
    for (let i = 0; i < 100; i++) {
      const otp = generateOTP();
      expect(typeof otp).toBe('string');
      expect(otp).toHaveLength(6);
      expect(/^[0-9]{6}$/.test(otp)).toBe(true);
    }
  });
});
