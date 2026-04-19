import { describe, it, expect } from 'vitest';
import reducer, { loginStart, loginFailure, loginSuccess, setRole, logout } from './store';
import { AuthState } from './types';

describe('Auth Store reducers', () => {
  const initialState: AuthState = {
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
    needsRoleSelection: false,
    authChecked: false,
  };

  it('AUTH-STORE-001: loginStart sets isLoading=true and clears error', () => {
    // Start from a state where there is an existing error and isLoading false
    const stateWithError: AuthState = { ...initialState, isLoading: false, error: 'previous error' };

    const next = reducer(stateWithError, loginStart());

    expect(next.isLoading).toBe(true);
    expect(next.error).toBeNull();
  });

  it('AUTH-STORE-002: loginSuccess sets user, isAuthenticated=true and computes needsRoleSelection', () => {
    // Case: payload has role -> needsRoleSelection = false
    const payloadWithRole = {
      uid: 'u1',
      email: 'u1@example.com',
      displayName: 'User One',
      photoURL: null,
      emailVerified: false,
      role: 'creator'
    } as any;

    const next1 = reducer({ ...initialState }, loginSuccess(payloadWithRole));
    expect(next1.user).toEqual(payloadWithRole);
    expect(next1.isAuthenticated).toBe(true);
    expect(next1.needsRoleSelection).toBe(false);

    // Case: payload without role -> needsRoleSelection = true
    const payloadNoRole = {
      uid: 'u2',
      email: 'u2@example.com',
      displayName: 'User Two',
      photoURL: null,
      emailVerified: false,
    } as any;

    const next2 = reducer({ ...initialState }, loginSuccess(payloadNoRole));
    expect(next2.user).toEqual(payloadNoRole);
    expect(next2.isAuthenticated).toBe(true);
    expect(next2.needsRoleSelection).toBe(true);
  });

  it('TH-STORE-003: loginFailure resets user and sets error', () => {
    // Start from a state where user is present and authenticated
    const stateWithUser: AuthState = {
      ...initialState,
      user: {
        uid: 'u3',
        email: 'u3@example.com',
        displayName: 'User Three',
        photoURL: null,
        emailVerified: false,
      } as any,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    };

    const next = reducer(stateWithUser, loginFailure('Login failed'));

    expect(next.user).toBeNull();
    expect(next.isAuthenticated).toBe(false);
    expect(next.isLoading).toBe(false);
    expect(next.error).toBe('Login failed');
  });

  it('AUTH-STORE-004: setRole updates user.role and sets needsRoleSelection=false', () => {
    // Start from a state where user exists and needsRoleSelection is true
    const stateWithUser: AuthState = {
      ...initialState,
      user: {
        uid: 'u4',
        email: 'u4@example.com',
        displayName: 'User Four',
        photoURL: null,
        emailVerified: false,
      } as any,
      isAuthenticated: true,
      needsRoleSelection: true,
      isLoading: false,
    };

    const next = reducer(stateWithUser, setRole('creator'));

    expect(next.user).not.toBeNull();
    expect(next.user?.role).toBe('creator');
    expect(next.needsRoleSelection).toBe(false);
  });

  it('AUTH-STORE-005: logout resets auth state', () => {
    const stateWithUser: AuthState = {
      ...initialState,
      user: {
        uid: 'u5',
        email: 'u5@example.com',
        displayName: 'User Five',
        photoURL: null,
        emailVerified: true,
      } as any,
      isAuthenticated: true,
      isLoading: true,
      needsRoleSelection: false,
    };

    const next = reducer(stateWithUser, logout());

    expect(next.user).toBeNull();
    expect(next.isAuthenticated).toBe(false);
    expect(next.isLoading).toBe(false);
  });
});
