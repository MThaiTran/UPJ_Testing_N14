// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { ForgotPassword } from './ForgotPassword';

// i18n mock
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

// toast mock (hoist-safe)
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// Mock firebase/auth to reject with user-not-found
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<any>('firebase/auth');
  return {
    ...actual,
    sendPasswordResetEmail: vi.fn(() => Promise.reject({ code: 'auth/user-not-found' })),
  };
});

describe('ForgotPassword error handling', () => {
  it("AUTH-FP-003: shows user-not-found toast when auth/user-not-found returned", async () => {
    const onBack = vi.fn();

    render(<ForgotPassword onBack={onBack} />);

    const input = screen.getByPlaceholderText('auth.emailPlaceholder') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'noone@example.com' } });

    const submitButton = screen.getByText('Gửi email đặt lại mật khẩu');
    fireEvent.click(submitButton);

    await waitFor(async () => {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      expect(sendPasswordResetEmail).toHaveBeenCalled();
    });

    const { toast } = await import('react-toastify');
    expect(toast.error).toHaveBeenCalledWith('auth.errors.userNotFound');
  });
});
