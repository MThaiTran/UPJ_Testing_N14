// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store';
import RoleSelection from './RoleSelection';

// Simple mocks
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

describe('RoleSelection - no selection', () => {
  let store: any;
  beforeEach(() => {
    store = configureStore({ reducer: { auth: authReducer }, preloadedState: {
      auth: {
        user: {
          uid: 'u-rs-3',
          email: 'rs3@example.com',
          displayName: 'RS Three',
          role: undefined,
        } as any,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        needsRoleSelection: true,
        authChecked: true,
      }
    } });
    localStorage.clear();
  });

  it('AUTH-RS-003: confirm button disabled when no role selected', () => {
    render(
      <Provider store={store}>
        <RoleSelection user={store.getState().auth.user} onRoleSelected={vi.fn()} />
      </Provider>
    );

    const confirmButton = screen.getByText('Xác nhận vai trò') as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);

    // After selecting a role, the button becomes enabled
    const creatorTitle = screen.getByText('roleSelection.creatorRole.title');
    fireEvent.click(creatorTitle);
    expect(confirmButton.disabled).toBe(false);
  });
});
