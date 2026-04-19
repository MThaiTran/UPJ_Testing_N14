// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import OTPVerification from './OTPVerification';

// i18n mock
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
// toast mock
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock otpService verifyOTP to be synchronous like implementation.
// Avoid importing actual module to prevent Firebase initialization.
vi.mock('../services/otpService', () => ({
  verifyOTP: vi.fn(() => ({ success: true, code: 'otp.verifySuccess' })),
  generateAndSendOTP: vi.fn(() => ({ success: true, code: 'otp.sent' })),
  getOTPExpiryTime: vi.fn(() => null),
}));

describe('OTPVerification auto-verify', () => {
  it('AUTH-OV-001: typing 6 digits triggers auto verify and calls onVerificationSuccess', async () => {
    const onVerificationSuccess = vi.fn();
    const onCancel = vi.fn();
    const email = 'user@example.com';

    render(<OTPVerification email={email} onVerificationSuccess={onVerificationSuccess} onCancel={onCancel} />);

    // Get all six input boxes
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs.length).toBe(6);

    // Type digits sequentially
    const digits = ['1','2','3','4','5','6'];
    for (let i = 0; i < digits.length; i++) {
      fireEvent.change(inputs[i], { target: { value: digits[i] } });
    }

    // verifyOTP should be called with joined code
    const otpService = await import('../services/otpService');
    await waitFor(() => {
      expect(otpService.verifyOTP).toHaveBeenCalledWith(email, '123456');
      expect(onVerificationSuccess).toHaveBeenCalled();
    });
  });
});
