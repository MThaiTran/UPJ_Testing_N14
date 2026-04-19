// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';

// Mocks hoisted
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../../lib/firebase/config', () => ({ auth: { currentUser: { uid: 'u-test', email: 'user@test.com' } } }));
vi.mock('../../../components/ImageUploader', () => ({ default: () => <div /> }));

import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store';
import Profile from './Profile';

describe('Profile change password validation - new equals current', () => {
  it("AUTH-PRO-002: when newPassword === currentPassword, shows error and button disabled", () => {
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

    const currentInput = screen.getByLabelText('profile.currentPassword');
    const newInput = screen.getByLabelText('profile.newPassword');
    const confirmInput = screen.getByLabelText('profile.confirmNewPassword');

    // Fill where newPassword equals currentPassword
    fireEvent.change(currentInput, { target: { value: 'SamePass@123' } });
    fireEvent.change(newInput, { target: { value: 'SamePass@123' } });
    fireEvent.change(confirmInput, { target: { value: 'SamePass@123' } });

    // Expect passwordMustDiffer message to be present (i18n mocked)
    expect(screen.getByText('profile.passwordMustDiffer')).toBeTruthy();

    // Button should be disabled
    const changeBtn = screen.getByRole('button', { name: 'profile.changePassword' });
    expect(changeBtn).toBeDisabled();
  });
});
