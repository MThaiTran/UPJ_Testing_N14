// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
// Mocks — hoisted before importing the component to avoid firebase initialization
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../lib/firebase/config', () => ({
  auth: { currentUser: { uid: 'u-test', email: 'user@test.com' } }
}));
// Stub heavy children to prevent import-time firebase/storage usage
vi.mock('../../../components/ImageUploader', () => ({ default: () => <div /> }));

import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store';
import Profile from './Profile';

describe('Profile change password validation', () => {
  it("AUTH-PRO-001: when new !== confirm, shows mismatch and button disabled", () => {
    const store = configureStore({
      reducer: { auth: authReducer, quiz: (s = { userResults: [] }) => s },
      preloadedState: {
        auth: {
          user: {
            uid: 'u-test',
            email: 'user@test.com',
            displayName: 'Test User',
            photoURL: null,
            emailVerified: true,
            role: 'user'
          },
          isLoading: false,
          error: null,
          isAuthenticated: true,
          needsRoleSelection: false,
          authChecked: true,
        }
      }
    });

    render(
      <Provider store={store}>
        <Profile />
      </Provider>
    );

    // Find inputs by their label text (i18n mocked to return keys)
    const currentInput = screen.getByLabelText('profile.currentPassword');
    const newInput = screen.getByLabelText('profile.newPassword');
    const confirmInput = screen.getByLabelText('profile.confirmNewPassword');

    // Fill inputs with mismatch new/confirm
    fireEvent.change(currentInput, { target: { value: 'OldPass@123' } });
    fireEvent.change(newInput, { target: { value: 'NewPass@123' } });
    fireEvent.change(confirmInput, { target: { value: 'Different@123' } });

    // Mismatch message should be visible
    expect(screen.getByText('profile.passwordMismatch')).toBeTruthy();

    // The change password button should be disabled
    const changeBtn = screen.getByRole('button', { name: 'profile.changePassword' });
    expect(changeBtn).toBeDisabled();
  });
});
