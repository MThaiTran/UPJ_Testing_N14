// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./ChatbotModal', () => ({
  ChatbotModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div
      data-testid="chatbot-modal"
      data-open={String(isOpen)}
      onClick={onClose}
    >
      chatbot modal
    </div>
  ),
}));

import authReducer from '../SrcCode/src/features/auth/store';
import { ChatbotButton } from '../SrcCode/src/components/rag/ChatbotButton';

afterEach(() => cleanup());

function createStore(user: any) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user,
        isLoading: false,
        error: null,
        isAuthenticated: Boolean(user),
        needsRoleSelection: false,
        authChecked: true,
      },
    },
  });
}

describe('ChatbotButton - UC-03', () => {
  it('RAG-UC03-001: user chưa đăng nhập thì không render nút chatbot', () => {
    const store = createStore(null);

    const { container } = render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('RAG-UC03-002: user đã đăng nhập thì render nút chatbot', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    expect(screen.getByRole('button', { name: 'Open AI Chatbot' })).toBeInTheDocument();
  });

  it('RAG-UC03-003: nút chatbot có aria-label đúng', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    expect(screen.getByRole('button', { name: 'Open AI Chatbot' })).toBeVisible();
  });

  it('RAG-UC03-004: nút chatbot có style fixed đúng vị trí', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    const button = screen.getByRole('button', { name: 'Open AI Chatbot' });
    expect(button).toHaveStyle({ position: 'fixed', bottom: '24px', right: '96px' });
  });

  it('RAG-UC03-005: trạng thái ban đầu hiển thị icon MessageCircle', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    expect(document.querySelector('svg.lucide-message-circle')).toBeInTheDocument();
    expect(document.querySelector('svg.lucide-x')).not.toBeInTheDocument();
  });

  it('RAG-UC03-006: modal được render ở trạng thái đóng ban đầu', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    expect(screen.getByTestId('chatbot-modal')).toHaveAttribute('data-open', 'false');
  });

  it('RAG-UC03-007: hover hiển thị tooltip trợ giúp', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    const button = screen.getByRole('button', { name: 'Open AI Chatbot' });
    fireEvent.mouseEnter(button);

    expect(screen.getByText('chatbot.askAssistant')).toBeInTheDocument();
  });

  it('RAG-UC03-008: mouse leave thì tooltip biến mất', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    const button = screen.getByRole('button', { name: 'Open AI Chatbot' });
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(screen.queryByText('chatbot.askAssistant')).not.toBeInTheDocument();
  });

  it('RAG-UC03-009: hover khi chưa mở thì hiện sparkle effect', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Open AI Chatbot' }));
    expect(document.querySelector('svg.lucide-sparkles')).toBeInTheDocument();
  });

  it('RAG-UC03-010: click nút thì mở modal', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open AI Chatbot' }));
    expect(screen.getByTestId('chatbot-modal')).toHaveAttribute('data-open', 'true');
  });

  it('RAG-UC03-011: click nút khi mở thì đóng modal', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    const button = screen.getByRole('button', { name: 'Open AI Chatbot' });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByTestId('chatbot-modal')).toHaveAttribute('data-open', 'false');
  });

  it('RAG-UC03-012: mở chatbot thì icon đổi sang X', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open AI Chatbot' }));

    expect(document.querySelector('svg.lucide-x')).toBeInTheDocument();
    expect(document.querySelector('svg.lucide-message-circle')).not.toBeInTheDocument();
  });

  it('RAG-UC03-013: tooltip ẩn khi chatbot đang mở', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    const button = screen.getByRole('button', { name: 'Open AI Chatbot' });
    fireEvent.click(button);
    fireEvent.mouseEnter(button);

    expect(screen.queryByText('chatbot.askAssistant')).not.toBeInTheDocument();
  });

  it('RAG-UC03-014: click vào modal mock gọi onClose để đóng chatbot', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open AI Chatbot' }));
    fireEvent.click(screen.getByTestId('chatbot-modal'));

    expect(screen.getByTestId('chatbot-modal')).toHaveAttribute('data-open', 'false');
  });

  it('RAG-UC03-015: hover mở tooltip rồi click vẫn giữ modal mở', () => {
    const store = createStore({ uid: 'u-001', email: 'user@example.com', role: 'user' });

    render(
      <Provider store={store}>
        <ChatbotButton />
      </Provider>
    );

    const button = screen.getByRole('button', { name: 'Open AI Chatbot' });
    fireEvent.mouseEnter(button);
    fireEvent.click(button);

    expect(screen.getByTestId('chatbot-modal')).toHaveAttribute('data-open', 'true');
    expect(screen.queryByText('chatbot.askAssistant')).not.toBeInTheDocument();
  });
});