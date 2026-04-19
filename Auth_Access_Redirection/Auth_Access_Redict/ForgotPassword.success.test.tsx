// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { ForgotPassword } from './ForgotPassword';

// Mock i18n
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

// Mock toast safely inside factory
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Mock firebase auth function but keep original exports (getAuth etc.)
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<any>('firebase/auth');
  return {
    ...actual,
    sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  };
});

describe('ForgotPassword success', () => {
  it('AUTH-FP-002: successful reset sets sent=true and shows sent UI', async () => {
    const onBack = vi.fn();

    render(<ForgotPassword onBack={onBack} />);

    // Fill email input
    const input = screen.getByPlaceholderText('auth.emailPlaceholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'user@example.com' } });

    // Submit
    const submitButton = screen.getByText('Gửi email đặt lại mật khẩu');
    fireEvent.click(submitButton);

    // Wait for async actions
    await waitFor(async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      expect(sendPasswordResetEmail).toHaveBeenCalled();
    });

    // toast.success called with translation key
    const { toast } = await import('react-toastify');
    expect(toast.success).toHaveBeenCalledWith('auth.resetPasswordSuccess');

    // Sent UI displayed
    expect(screen.getByText('auth.emailSent')).toBeTruthy();
    expect(screen.getByText('user@example.com')).toBeTruthy();
  });
});
