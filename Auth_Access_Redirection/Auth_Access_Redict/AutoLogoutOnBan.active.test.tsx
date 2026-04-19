// @vitest-environment jsdom
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Register module mocks (do not reference top-level variables inside factories)
vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('../../../utils/presenceUtils', () => ({ setUserOffline: vi.fn(() => Promise.resolve()) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

// Provide a simple, hoist-safe mock for firestore so `getDoc` is always a mock
vi.mock('firebase/firestore', () => ({
  getDoc: vi.fn(),
  doc: (...args: any[]) => ({ __doc: args }),
}));

vi.mock('../../../lib/firebase/config', () => ({
  db: {},
  auth: { currentUser: { uid: 'u-active' }, signOut: vi.fn(() => Promise.resolve()) },
}));

// References to mocked functions will be loaded inside beforeEach using async import
let mockedToastError: any;
let mockedSetUserOffline: any;
let mockGetDoc: any;
let mockedSignOut: any;

import authReducer from '../store';
import AutoLogoutOnBan from './AutoLogoutOnBan';

describe('AutoLogoutOnBan (active user)', () => {
  let store: any;
  beforeEach(async () => {
    store = configureStore({ reducer: { auth: authReducer }, preloadedState: {
      auth: {
        user: {
          uid: 'u-active',
          email: 'active@example.com',
          role: 'user'
        } as any,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        needsRoleSelection: false,
        authChecked: true,
      }
    } });
    // import the mocked modules so we get the hoisted vi.mock versions
    const rt = await vi.importMock('react-toastify');
    const pu = await vi.importMock('../../../utils/presenceUtils');
    const fd = await vi.importMock('firebase/firestore');
    const fb = await vi.importMock('../../../lib/firebase/config');

    mockedToastError = rt.toast.error;
    mockedSetUserOffline = pu.setUserOffline;
    mockGetDoc = fd.getDoc;
    mockedSignOut = fb.auth.signOut;

    mockGetDoc.mockReset?.();
    mockedToastError.mockReset?.();
    mockedSetUserOffline.mockReset?.();
    mockedSignOut.mockReset?.();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AUTH-BAN-001: khi isActive=false thì setUserOffline + dispatch logout + signOut + toast', async () => {
    // getDoc returns isActive = false
    mockGetDoc.mockResolvedValue({ data: () => ({ isActive: false }) });

    render(
      <Provider store={store}>
        <AutoLogoutOnBan />
      </Provider>
    );

    await waitFor(() => {
      expect(mockedSetUserOffline).toHaveBeenCalledWith('u-active');
      expect(mockedSignOut).toHaveBeenCalled();
      expect(mockedToastError).toHaveBeenCalled();
    });

    // Ensure logout dispatched and store updated
    const post = store.getState().auth;
    expect(post.user).toBeNull();
    expect(post.isAuthenticated).toBe(false);
  });

  it('AUTH-BAN-003: clear interval khi unmount', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation(() => 123 as any);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    // make getDoc succeed so effect schedules interval
    mockGetDoc.mockResolvedValue({ data: () => ({ isActive: true }) });

    const rendered = render(
      <Provider store={store}>
        <AutoLogoutOnBan />
      </Provider>
    );

    await waitFor(() => {
      expect(setIntervalSpy).toHaveBeenCalled();
    });

    rendered.unmount();

    expect(clearIntervalSpy).toHaveBeenCalledWith(123);

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
  
  it('AUTH-BAN-002: khi user active thì không logout', async () => {
    // getDoc returns isActive = true
    mockGetDoc.mockResolvedValue({ data: () => ({ isActive: true }) });

    const toast = { error: mockedToastError };
    const setUserOffline = mockedSetUserOffline;
    const auth = { signOut: mockedSignOut };

    render(
      <Provider store={store}>
        <AutoLogoutOnBan />
      </Provider>
    );

    // Wait for the checkActive to run and assert side-effects NOT called
    await waitFor(() => {
      expect(setUserOffline).not.toHaveBeenCalled();
      expect(auth.signOut).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    // Store should remain authenticated
    const state = store.getState().auth;
    expect(state.user).not.toBeNull();
    expect(state.isAuthenticated).toBe(true);
  });

  
});
