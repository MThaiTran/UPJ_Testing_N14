// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { QuizRecommendationCard } from '../SrcCode/src/components/rag/QuizRecommendationCard';

afterEach(() => cleanup());

const quiz = {
  quizId: 'quiz-123',
  title: 'Ôn tập toán học',
  description: '<p>Quiz về <b>toán</b> cơ bản</p>',
  difficulty: 'medium',
  hasPassword: true,
  questionCount: 10,
  viewCount: 250,
  totalAttempts: 42,
  averageScore: 86,
  averageRating: 4.6,
  category: 'Toán học',
  imageUrl: '',
};

const easyQuiz = { ...quiz, quizId: 'quiz-easy', difficulty: 'easy', title: 'Easy quiz' };
const hardQuiz = { ...quiz, quizId: 'quiz-hard', difficulty: 'hard', title: 'Hard quiz' };
const unknownQuiz = { ...quiz, quizId: 'quiz-unknown', difficulty: 'mystery', title: 'Mystery quiz' };
const noPasswordQuiz = { ...quiz, quizId: 'quiz-nopass', hasPassword: false, title: 'No password quiz' };
const zeroCountQuiz = { ...quiz, quizId: 'quiz-zero', questionCount: 0, title: 'Zero question quiz' };
const noStatsQuiz = {
  ...quiz,
  quizId: 'quiz-nostats',
  viewCount: undefined,
  totalAttempts: undefined,
  averageScore: undefined,
  averageRating: undefined,
  title: 'No stats quiz',
};
const compactQuiz = { ...quiz, quizId: 'quiz-compact', title: 'Compact quiz' };
const imageQuiz = { ...quiz, quizId: 'quiz-image', imageUrl: 'https://example.com/image.png', title: 'Image quiz' };

describe('QuizRecommendationCard - UC-04', () => {
  const renderCard = (item: any, index = 0, compact = false, onNavigate?: () => void) =>
    render(
      <MemoryRouter>
        <QuizRecommendationCard quiz={item} index={index} compact={compact} onNavigate={onNavigate} />
      </MemoryRouter>
    );

  it('RAG-UC04-001: hiển thị đủ thông tin quiz gợi ý', () => {
    renderCard(quiz as any);

    expect(screen.getByText('Ôn tập toán học')).toBeInTheDocument();
    expect(screen.getByText('🤔 Trung bình')).toBeInTheDocument();
    expect(screen.getByText('Có mật khẩu')).toBeInTheDocument();
    expect(screen.getByText('10 câu')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
  });

  it('RAG-UC04-002: description HTML được clean đúng', () => {
    renderCard(quiz as any);

    expect(screen.getByText('Quiz về toán cơ bản')).toBeInTheDocument();
    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument();
  });

  it('RAG-UC04-003: difficulty medium hiển thị nhãn Trung bình', () => {
    renderCard(quiz as any);

    expect(screen.getByText('🤔 Trung bình')).toBeInTheDocument();
  });

  it('RAG-UC04-004: difficulty easy hiển thị nhãn Dễ', () => {
    renderCard(easyQuiz as any);

    expect(screen.getByText('😊 Dễ')).toBeInTheDocument();
  });

  it('RAG-UC04-005: difficulty hard hiển thị nhãn Khó', () => {
    renderCard(hardQuiz as any);

    expect(screen.getByText('🔥 Khó')).toBeInTheDocument();
  });

  it('RAG-UC04-006: difficulty lạ hiển thị nhãn Quiz mặc định', () => {
    renderCard(unknownQuiz as any);

    expect(screen.getByText('📝 Quiz')).toBeInTheDocument();
  });

  it('RAG-UC04-007: compact mode hiển thị ký tự đầu của difficulty', () => {
    renderCard(quiz as any, 0, true);

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.queryByText('🤔 Trung bình')).not.toBeInTheDocument();
  });

  it('RAG-UC04-008: badge mật khẩu chỉ hiện khi quiz có mật khẩu', () => {
    renderCard(quiz as any);

    expect(screen.getByText('Có mật khẩu')).toBeInTheDocument();
  });

  it('RAG-UC04-009: quiz không có mật khẩu thì không hiện badge', () => {
    renderCard(noPasswordQuiz as any);

    expect(screen.queryByText('Có mật khẩu')).not.toBeInTheDocument();
  });

  it('RAG-UC04-010: question count > 0 hiển thị đúng số câu', () => {
    renderCard(quiz as any);

    expect(screen.getByText('10 câu')).toBeInTheDocument();
  });

  it('RAG-UC04-011: questionCount = 0 thì không hiển thị số câu', () => {
    renderCard(zeroCountQuiz as any);

    expect(screen.queryByText(/câu/)).not.toBeInTheDocument();
  });

  it('RAG-UC04-012: viewCount / totalAttempts / score / rating hiển thị đúng', () => {
    renderCard(quiz as any);

    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
  });

  it('RAG-UC04-013: stats undefined hiển thị 0 hoặc dấu gạch', () => {
    renderCard(noStatsQuiz as any);

    const viewCount = screen.getByTitle('Lượt xem');
    const totalAttempts = screen.getByTitle('rag.totalAttempts');
    const averageScore = screen.getByTitle('rag.averageScore');
    const averageRating = screen.getByTitle('rag.averageRating');

    expect(viewCount).toHaveTextContent('0');
    expect(totalAttempts).toHaveTextContent('0');
    expect(averageScore).toHaveTextContent('-');
    expect(averageRating).toHaveTextContent('-');
  });

  it('RAG-UC04-014: compact mode ẩn description và stats grid', () => {
    renderCard(compactQuiz as any, 0, true);

    expect(screen.queryByText('Quiz về toán cơ bản')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Lượt xem')).not.toBeInTheDocument();
  });

  it('RAG-UC04-015: category và start quiz text hiển thị ở bottom badge', () => {
    renderCard(quiz as any);

    expect(screen.getByText('📂 Toán học')).toBeInTheDocument();
    expect(screen.getByText('chatbot.quizRecommendation.startQuiz')).toBeInTheDocument();
  });

  it('RAG-UC04-016: có ảnh thì render img với alt text', () => {
    renderCard(imageQuiz as any);

    expect(screen.getByAltText('Image quiz')).toBeInTheDocument();
  });

  it('RAG-UC04-017: click card thì điều hướng sang trang preview', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<QuizRecommendationCard quiz={quiz as any} index={0} />} />
          <Route path="/quiz/:quizId/preview" element={<div>quiz preview page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(container.firstElementChild as Element);

    expect(screen.getByText('quiz preview page')).toBeInTheDocument();
  });

  it('RAG-UC04-018: onNavigate callback được gọi khi click card', () => {
    const onNavigate = vi.fn();

    const { container } = render(
      <MemoryRouter>
        <QuizRecommendationCard quiz={quiz as any} index={0} onNavigate={onNavigate} />
      </MemoryRouter>
    );

    fireEvent.click(container.firstElementChild as Element);

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});