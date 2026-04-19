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
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

// Mock setDoc to reject to simulate failure
const mockSetDoc = vi.fn(() => Promise.reject(new Error('setdoc-fail')));
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    doc: (...args: any[]) => ({ __doc: args }),
    setDoc: (...args: any[]) => mockSetDoc(...args),
  };
});

describe('RoleSelection fallback', () => {
  let store: any;
  beforeEach(() => {
    store = configureStore({ reducer: { auth: authReducer }, preloadedState: {
      auth: {
        user: {
          uid: 'u-rs-2',
          email: 'rs2@example.com',
          displayName: 'RS Two',
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

  it('AUTH-RS-002: fallback when setDoc fails still setRole + localStorage + callback', async () => {
    const onRoleSelected = vi.fn();

    render(
      <Provider store={store}>
        <RoleSelection user={store.getState().auth.user} onRoleSelected={onRoleSelected} />
      </Provider>
    );

    const creatorTitle = screen.getByText('roleSelection.creatorRole.title');
    fireEvent.click(creatorTitle);

    const confirmButton = screen.getByText('Xác nhận vai trò');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // setDoc rejected, but component should still call the callback and dispatch setRole
      expect(onRoleSelected).toHaveBeenCalledWith('creator');
      const authState = store.getState().auth;
      expect(authState.needsRoleSelection).toBe(false);
      expect(localStorage.getItem(`user_role_${authState.user.uid}`)).toBe('creator');
    });

    // Ensure we attempted to call setDoc (and it failed)
    expect(mockSetDoc).toHaveBeenCalled();
  });
});
