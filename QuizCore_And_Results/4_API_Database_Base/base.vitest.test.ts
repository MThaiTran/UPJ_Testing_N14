/**
 * ============================================================
 * FILE: base.vitest.test.ts
 * MODULE: Quiz Core — API Base Functions
 * DESCRIPTION: Kiểm thử các luồng giao tiếp CSDL (Tạo Quiz, Submit Kết quả).
 * TESTER: Tester 2
 * TC IDs: TC-API-01 -> TC-API-06
 * ============================================================
 * LƯU Ý VỀ DB (CheckDB / Rollback):
 * - CheckDB: Các test script tiến hành MOCK thư viện Firestore. Sẽ 'expect' hàm addDoc/updateDoc được kích hoạt với tham số đúng, đảm bảo luồng chạy sẽ làm thay đổi CSDL thật.
 * - Rollback: Sử dụng `vi.clearAllMocks()` ở hook `afterEach` sau mỗi Test Case để reset tất cả lịch sử thay đổi DB giả lập về 0, đảm bảo Test Case theo sau có DB hoàn toàn sạch.
 * ============================================================
 */

import { expect, describe, it, vi, afterEach } from 'vitest';
import { createQuiz, submitQuizResult } from './base';

// 1. Mock Database Firestore và thư viện ngoài
import { addDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}));

vi.mock('../../../lib/firebase/config', () => ({
  db: {}
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../services/quizStatsService', () => ({
  quizStatsService: {
    trackCompletion: vi.fn()
  }
}));

// ============================================================
// describe: Test Suite: API Base Functions
// ============================================================
describe('API Base Functions Tests', () => {

  afterEach(() => {
    // Luôn luôn Rollback DB mô phỏng lại như ban đầu sau khi chạy xong 1 luồng Test
    vi.clearAllMocks();
  });

  describe('createQuiz (Lưu Quiz Mới lên DB)', () => {

    it('createQuiz_testChuan1_tao_quiz_thanh_cong_ghi_db', async () => {
      // TC-API-01 | testChuan1
      // Mục tiêu: Check luồng lưu quiz mới vào Firestore thành công.
      // Expected: Trả về ID do Firebase cấp ('doc-123').
      
      const mockQuizData = { title: 'Test Quiz', description: 'Desc' } as any;
      
      // Setup Mock Firebase Document Reference
      (addDoc as any).mockResolvedValueOnce({ id: 'doc-123' });

      const result = await createQuiz(mockQuizData);

      // CheckDB: Xác minh đã truyền lệnh lưu vào DB thành công
      expect(addDoc).toHaveBeenCalled(); 
      expect(result).toBe('doc-123');
    });

    it('createQuiz_testNgoaiLe1_tao_quiz_that_bai_bao_loi', async () => {
      // TC-API-02 | testNgoaiLe1
      // Mục tiêu: Bắt lỗi văng từ Catch khi Firebase bị mất kết nối hoặc hết quota.
      // Expected: Ứng dụng không crash, ném ra một Error tuỳ chỉnh.
      
      const mockQuizData = { title: 'Test Quiz' } as any;
      (addDoc as any).mockRejectedValueOnce(new Error('Firebase is down'));

      // Kiểm thử exception handling
      await expect(createQuiz(mockQuizData)).rejects.toThrow('Không thể tạo quiz');
    });
  });

  describe('submitQuizResult (Lưu vào DB bài làm hoàn thành)', () => {

    it('submitQuizResult_testNgoaiLe1_thanh_tra_thieu_truong_bat_buoc', async () => {
      // TC-API-03 | testNgoaiLe1
      // Mục tiêu: Không cho phép submit lên DB nếu input thiếu data bắt buộc. Tránh rác DB.
      // Expected: Bị từ chối + không đụng DB.

      const invalidResult = { userId: 'u1', quizId: 'q1' } as any; // Cố tình thiếu score, total,...
      
      await expect(submitQuizResult(invalidResult)).rejects.toThrow(/Thiếu trường bắt buộc/);
      // CheckDB: Đảm bảo DB hoàn toàn chưa nhận truy vấn lệnh nào (Transaction Aborted)
      expect(addDoc).not.toHaveBeenCalled(); 
    });

    it('submitQuizResult_testNgoaiLe2_diem_vuot_qua_100_chan_gian_lan', async () => {
      // TC-API-04 | testNgoaiLe2
      // Mục tiêu: Filter validation điểm số hack server.
      
      const invalidResult = { 
        userId: 'u1', quizId: 'q1', score: 150, correctAnswers: 5, totalQuestions: 5, answers: [], completedAt: new Date() 
      } as any; 
      
      await expect(submitQuizResult(invalidResult)).rejects.toThrow('Điểm số phải trong khoảng 0-100');
    });

    it('submitQuizResult_testNgoaiLe3_cau_dung_vo_ly_so_voi_tong_cau', async () => {
      // TC-API-05 | testNgoaiLe3
      // Mục tiêu: Lỗi logic dữ liệu truyền vào sai lệch.
      
      const invalidResult = { 
        userId: 'u1', quizId: 'q1', score: 80, correctAnswers: 10, totalQuestions: 5, answers: [], completedAt: new Date() 
      } as any; 
      
      await expect(submitQuizResult(invalidResult)).rejects.toThrow('Số câu đúng không thể lớn hơn tổng số câu');
    });

    it('submitQuizResult_testChuan1_luu_ket_qua_hop_le_chuan_db', async () => {
      // TC-API-06 | testChuan1
      // Mục tiêu: Lưu điểm thành công lên collection quizResults sau khi cho qua tất cả màn kiểm tra.
      
      const validResult = { 
        userId: 'u1', quizId: 'q1', score: 100, correctAnswers: 5, totalQuestions: 5, answers: [], completedAt: new Date() 
      } as any; 
      
      (addDoc as any).mockResolvedValueOnce({ id: 'res-456' });

      const result = await submitQuizResult(validResult);

      // CheckDB: Có truy cập và ghi thay đổi trên Firestore giả lập
      expect(addDoc).toHaveBeenCalled(); 
      expect(result).toBe('res-456');
    });
  });
});
