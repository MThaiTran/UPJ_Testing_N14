// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import OTPVerification from './OTPVerification';

// i18n mock
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
// toast mock
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock otpService to simulate failed verify
vi.mock('../services/otpService', () => ({
  verifyOTP: vi.fn(() => ({ success: false, code: 'otp.incorrect', metadata: { remaining: 2 } })),
  generateAndSendOTP: vi.fn(() => ({ success: true })),
  getOTPExpiryTime: vi.fn(() => null),
}));

describe('OTPVerification failure behavior', () => {
  it("AUTH-OV-002: on verify fail, inputs cleared and focus set to first input", async () => {
    const onVerificationSuccess = vi.fn();
    const onCancel = vi.fn();
    const email = 'user@example.com';

    render(<OTPVerification email={email} onVerificationSuccess={onVerificationSuccess} onCancel={onCancel} />);

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs.length).toBe(6);

    // Type 6 digits
    const digits = ['9','8','7','6','5','4'];
    for (let i = 0; i < digits.length; i++) {
      fireEvent.change(inputs[i], { target: { value: digits[i] } });
    }

    // Verify verifyOTP was called and inputs cleared + focus moved to first
    const otpService = await import('../services/otpService');
    await waitFor(() => {
      expect(otpService.verifyOTP).toHaveBeenCalledWith(email, '987654');
      // inputs cleared
      expect(inputs.every(inp => inp.value === '')).toBe(true);
      // first input focused
      expect(document.activeElement).toBe(inputs[0]);
    });
  });
});
