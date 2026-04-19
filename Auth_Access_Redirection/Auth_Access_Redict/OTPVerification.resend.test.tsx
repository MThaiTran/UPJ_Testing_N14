// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import OTPVerification from './OTPVerification';

// i18n mock
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
// toast mock
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock otpService to simulate resend success and expiry in the past (so resend button shows)
vi.mock('../services/otpService', () => ({
  generateAndSendOTP: vi.fn(() => Promise.resolve({ success: true })),
  getOTPExpiryTime: vi.fn(() => Date.now() - 1000),
  verifyOTP: vi.fn(() => ({ success: false })),
}));

describe('OTPVerification resend behavior', () => {
  it("AUTH-OV-003: on resend success, reset timer and canResend; clear inputs and focus first", async () => {
    const onVerificationSuccess = vi.fn();
    const onCancel = vi.fn();
    const email = 'user@example.com';

    render(<OTPVerification email={email} onVerificationSuccess={onVerificationSuccess} onCancel={onCancel} />);

    // Resend button should be visible because getOTPExpiryTime returned past time
    const resendButton = await screen.findByRole('button', { name: 'auth.otp.resendAction' });
    expect(resendButton).toBeTruthy();

    // Fill some inputs to ensure they get cleared after resend
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs.length).toBe(6);
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '2' } });

    const otpService = await import('../services/otpService');

    // Click resend
    fireEvent.click(resendButton);

    // Wait for generateAndSendOTP to be called and UI to update: resend button hidden, timer shown
    await waitFor(() => {
      expect(otpService.generateAndSendOTP).toHaveBeenCalledWith(email);
    });

    // After successful resend, the resend button should be replaced by timer text
    await waitFor(() => {
      expect(screen.queryByText('auth.otp.resendAction')).toBeNull();
      expect(screen.getByText(/auth.otp.timer/)).toBeTruthy();
    });

    // Inputs should be cleared and first input focused
    expect(inputs.every(inp => inp.value === '')).toBe(true);
    expect(document.activeElement).toBe(inputs[0]);
  });
});
