// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store';
import RoleSelection from './RoleSelection';

// Simple mocks
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), info: vi.fn() } }));

const mockSetDoc = vi.fn(() => Promise.resolve());
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    doc: (...args: any[]) => ({ __doc: args }),
    setDoc: (...args: any[]) => mockSetDoc(...args),
  };
});

describe('RoleSelection', () => {
  let store: any;
  beforeEach(() => {
    store = configureStore({ reducer: { auth: authReducer }, preloadedState: {
      auth: {
        user: {
          uid: 'u-rs-1',
          email: 'rs1@example.com',
          displayName: 'RS One',
          role: undefined,
        } as any,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        needsRoleSelection: true,
        authChecked: true,
      }
    } });
    mockSetDoc.mockReset();
    localStorage.clear();
  });

  it('AUTH-RS-001: success path calls setDoc + dispatch setRole + callback', async () => {
    const onRoleSelected = vi.fn();

    render(
      <Provider store={store}>
        <RoleSelection user={store.getState().auth.user} onRoleSelected={onRoleSelected} />
      </Provider>
    );

    // Click the creator role option (text is translation key)
    const creatorTitle = screen.getByText('roleSelection.creatorRole.title');
    fireEvent.click(creatorTitle);

    // Click confirm button (button text literal)
    const confirmButton = screen.getByText('Xác nhận vai trò');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
      expect(onRoleSelected).toHaveBeenCalledWith('creator');
    });

    // Redux store updated
    const authState = store.getState().auth;
    expect(authState.user).not.toBeNull();
    // After dispatch setRole, the slice sets needsRoleSelection=false
    expect(authState.needsRoleSelection).toBe(false);

    // localStorage backup saved
    expect(localStorage.getItem(`user_role_${authState.user.uid}`)).toBe('creator');
  });
});
