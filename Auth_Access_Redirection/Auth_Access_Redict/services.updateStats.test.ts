import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDoc, mockGetDoc, mockSetDoc } = vi.hoisted(() => ({
  mockDoc: vi.fn((db: any, collection: string, id: string) => ({ path: `${collection}/${id}` })),
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
}));

vi.mock('../../lib/firebase/config', () => ({
  auth: { currentUser: { uid: 'uid-user-001', displayName: 'Student One' } },
  db: { __mock: 'db' },
}));

import { updateUserStats } from './services';

describe('Auth Services - updateUserStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('AUTH-SVC-009: updateUserStats cập nhật users.stats đúng công thức', async () => {
    const userId = 'uid-user-001';
    const quizData = {
      score: 85,
      totalQuestions: 10,
      correctAnswers: 8,
      timeSpent: 300,
      difficulty: 'easy',
    };

    const currentData = {
      displayName: 'Student One',
      stats: {
        totalQuizzes: 2,
        totalQuestions: 50,
        totalCorrectAnswers: 40,
        totalTimeSpent: 1200,
        averageScore: 80,
        bestScore: 90,
        difficultyStats: { easy: { attempts: 2, bestScore: 80 } },
      },
    };

    const oldStatsDoc = {
      totalScore: 200,
      totalAttempts: 5,
    };

    // getDoc called first for users doc, then for user_stats doc
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => currentData });
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => oldStatsDoc });

    await updateUserStats(userId, quizData as any);

    // Expected computed values
    const expectedTotalQuizzes = 3; // 2 + 1
    const expectedTotalQuestions = 60; // 50 + 10
    const expectedTotalCorrect = 48; // 40 + 8
    const expectedTotalTime = 1500; // 1200 + 300
    const expectedAverage = Math.round(((80 * 2) + 85) / 3); // 82
    const expectedBest = Math.max(90, 85); // 90

    // First setDoc call updates users doc
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: `users/${userId}` },
      expect.objectContaining({
        ...currentData,
        stats: expect.objectContaining({
          totalQuizzes: expectedTotalQuizzes,
          totalQuestions: expectedTotalQuestions,
          totalCorrectAnswers: expectedTotalCorrect,
          totalTimeSpent: expectedTotalTime,
          averageScore: expectedAverage,
          bestScore: expectedBest,
          difficultyStats: expect.objectContaining({
            easy: expect.objectContaining({ attempts: 3, bestScore: 85 }),
          }),
        }),
        updatedAt: expect.any(Date),
      }),
      { merge: true }
    );

    // Second setDoc call updates user_stats doc
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: `user_stats/${userId}` },
      expect.objectContaining({
        userId,
        displayName: 'Student One',
        totalScore: oldStatsDoc.totalScore + quizData.score,
        totalAttempts: oldStatsDoc.totalAttempts + 1,
        updatedAt: expect.any(Date),
      }),
      { merge: true }
    );
  });

  it('AUTH-SVC-010: updateUserStats cập nhật user_stats tổng điểm/lần làm khi chưa tồn tại', async () => {
    const userId = 'uid-user-002';
    const quizData = {
      score: 50,
      totalQuestions: 5,
      correctAnswers: 4,
      timeSpent: 120,
      difficulty: 'medium',
    };

    const currentData = {
      displayName: 'Student Two',
      stats: {
        totalQuizzes: 0,
        totalQuestions: 0,
        totalCorrectAnswers: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        bestScore: 0,
        difficultyStats: {},
      },
    };

    // users doc exists with empty stats, user_stats does not exist
    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => currentData });
    mockGetDoc.mockResolvedValueOnce({ exists: () => false });

    await updateUserStats(userId, quizData as any);

    // user_stats should be created with initial totals equal to quizData.score and 1 attempt
    expect(mockSetDoc).toHaveBeenCalledWith(
      { path: `user_stats/${userId}` },
      expect.objectContaining({
        userId,
        displayName: 'Student Two',
        totalScore: quizData.score,
        totalAttempts: 1,
        updatedAt: expect.any(Date),
      }),
      { merge: true }
    );
  });
});
