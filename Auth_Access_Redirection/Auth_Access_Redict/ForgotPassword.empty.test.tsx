// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { ForgotPassword } from './ForgotPassword';

// Mocks
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ForgotPassword validation', () => {
  beforeEach(() => {
    mockToastError.mockReset();
  });

  it('AUTH-FP-001: empty email shows toast validation', async () => {
    const onBack = vi.fn();

    render(<ForgotPassword onBack={onBack} />);

    // Click submit without entering email
    const submitButton = screen.getByText('Gửi email đặt lại mật khẩu');
    fireEvent.click(submitButton);

    // Import the mocked toast and assert
    const { toast } = await import('react-toastify');
    expect(toast.error).toHaveBeenCalledWith('auth.validation.emailRequired');
  });
});
