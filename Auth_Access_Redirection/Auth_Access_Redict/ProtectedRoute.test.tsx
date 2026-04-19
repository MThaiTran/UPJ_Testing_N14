// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('AUTH-PR-001: when loading, renders Loading', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: null,
          isLoading: true,
          error: null,
          isAuthenticated: false,
          needsRoleSelection: false,
          authChecked: false,
        },
      },
    });

    render(
      <Provider store={store}>
        <ProtectedRoute>
          <div data-testid="private">private</div>
        </ProtectedRoute>
      </Provider>
    );

    // The Loading component in ProtectedRoute shows the provided message
    expect(screen.queryByTestId('private')).toBeNull();
    expect(screen.getByText('Đang xác thực...')).toBeTruthy();
  });

  it('AUTH-PR-002: when no user, redirects to /login', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: null,
          isLoading: false,
          error: null,
          isAuthenticated: false,
          needsRoleSelection: false,
          authChecked: true,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/private"]}>
          <Routes>
            <Route path="/login" element={<div>login page</div>} />
            <Route path="/private" element={
              <ProtectedRoute>
                <div data-testid="private">private</div>
              </ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Should render login page and not the private child
    expect(screen.getByText('login page')).toBeTruthy();
    expect(screen.queryByTestId('private')).toBeNull();
  });

  it('AUTH-PR-003: role mismatch thì render unauthorized', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: {
            uid: 'u6',
            email: 'u6@example.com',
            displayName: 'User Six',
            photoURL: null,
            emailVerified: false,
            role: 'user'
          } as any,
          isLoading: false,
          error: null,
          isAuthenticated: true,
          needsRoleSelection: false,
          authChecked: true,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/private"]}>
          <Routes>
            <Route path="/private" element={
              <ProtectedRoute requiredRole="creator">
                <div data-testid="private">private</div>
              </ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Should show unauthorized UI (h3 heading) and NOT render private child
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeTruthy();
    expect(screen.queryByTestId('private')).toBeNull();
  });

  it('AUTH-PR-004: role hợp lệ thì render children', () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: {
            uid: 'u7',
            email: 'u7@example.com',
            displayName: 'User Seven',
            photoURL: null,
            emailVerified: true,
            role: 'creator'
          } as any,
          isLoading: false,
          error: null,
          isAuthenticated: true,
          needsRoleSelection: false,
          authChecked: true,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/private"]}>
          <Routes>
            <Route path="/private" element={
              <ProtectedRoute requiredRole="creator">
                <div data-testid="private">private</div>
              </ProtectedRoute>
            } />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    // Should render the private child when user has required role
    expect(screen.getByTestId('private')).toBeTruthy();
  });
});
