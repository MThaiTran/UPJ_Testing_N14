/**
 * ============================================================
 * FILE: store.vitest.test.ts
 * MODULE: Quiz Core — Redux Store Management
 * DESCRIPTION: Kiểm thử việc quản lý State của quá trình làm Quiz (Set data, Timer, User Answers).
 * TESTER: Tester 2
 * TC IDs: TC-STR-01 -> TC-STR-05
 * ============================================================
 * LƯU Ý VỀ DB (CheckDB / Rollback):
 * - Đây là hệ thống quản lý RAM nội bộ (Redux Store) phía Client.
 * - KHÔNG tương tác với Database hay Backend. 
 * - QUY ƯỚC NHÓM SQA: KHÔNG cần thực hiện CheckDB hay Rollback.
 * ============================================================
 */

import { expect, describe, it } from 'vitest';
import reducer, {
  setQuizzes,
  setCurrentQuiz,
  setUserAnswer,
  decrementTime,
  resetQuizState
} from './store';
import { Quiz } from './types';

// ============================================================
// describe: Test Suite: Redux Quiz Store
// ============================================================
describe('Redux Quiz Store Tests', () => {

  // Lấy state mặc định để so sánh
  const initialState = reducer(undefined, { type: 'unknown' });

  it('setQuizzes_testChuan1_cap_nhat_danh_sach_quiz', () => {
    // TC-STR-01 | testChuan1
    // Mục tiêu: Ghi nhận mảng quiz mới tải từ máy chủ vào bộ nhớ đệm Redux.
    
    // 1. Khai báo Input
    const mockQuizzes = [{ id: 'q1', title: 'Toán học' }] as Quiz[];
    
    // 2. Chạy hàm (dispatch action)
    const nextState = reducer(initialState, setQuizzes(mockQuizzes));

    // 3. Kiểm tra kết quả
    expect(nextState.quizzes).toEqual(mockQuizzes);
    expect(nextState.quizzes.length).toBe(1);
  });

  it('setCurrentQuiz_testChuan1_an_dinh_bai_thi_va_khoi_tao_thong_so_time', () => {
    // TC-STR-02 | testChuan1
    // Mục tiêu: Khi học viên bấm vào 1 bài Quiz, Redux phải lấy thông tin bài thi đặt làm Hiện tại,
    //           đồng thời khởi tạo bộ đếm giờ khớp với tổng thời lượng quy định.
    
    // 1. Khai báo Input
    const mockQuiz = { id: 'q1', duration: 10 } as Quiz; // 10 phút = 600 giây
    
    // 2. Chạy hàm
    const nextState = reducer(initialState, setCurrentQuiz(mockQuiz));

    // 3. Kiểm tra logic State
    expect(nextState.currentQuiz).toEqual(mockQuiz);
    expect(nextState.totalTime).toBe(600);
    expect(nextState.timeLeft).toBe(600);
    expect(nextState.isTimeWarning).toBe(false); // Vừa mới vào làm bài thì không bị cảnh báo thời gian
    expect(nextState.userAnswers).toEqual({});   // Xoá trắng đáp án cũ
  });

  it('setUserAnswer_testChuan1_Luu_dap_an_vao_tu_dien', () => {
    // TC-STR-03 | testChuan1
    // Mục tiêu: Lưu vết đáp án của người dùng theo ID câu hỏi.
    
    // 1. Khai báo Input
    const payload = { questionId: 'cau_so_1', answerId: 'dap_an_a' };
    
    // 2. Chạy reducer action
    const nextState = reducer(initialState, setUserAnswer(payload));

    // 3. Kiểm chứng Object Dictionary
    expect(nextState.userAnswers['cau_so_1']).toBe('dap_an_a');
  });

  it('decrementTime_testChuan1_giam_giay_va_kich_hoat_canh_bao_khi_duoi_10_phan_tram', () => {
    // TC-STR-04 | testChuan1
    // Mục tiêu: Giảm chính xác 1 giây mỗi lần gọi. Và nếu số giây còn lại chạm mức 10% tổng giờ, văng cờ cảnh báo.
    
    // 1. Thiết lập State ban đầu giả lập cho việc đang thi dở dang
    const runningState = {
        ...initialState,
        totalTime: 100, // Tổng thi 100 giây
        timeLeft: 11,   // Còn 11 giây (11%), chưa cảnh báo
        isTimeWarning: false
    };
    
    // 2. Lần thứ nhất: Giảm 1 giây (còn 10 giây). 10 <= 100*10% -> Bật cảnh báo Warning True
    const nextState = reducer(runningState, decrementTime());
    expect(nextState.timeLeft).toBe(10);
    expect(nextState.isTimeWarning).toBe(true);

    // 3. Gọi thêm lần nữa để khẳng định không bị âm (9 giây)
    const nextState2 = reducer(nextState, decrementTime());
    expect(nextState2.timeLeft).toBe(9);
    expect(nextState2.isTimeWarning).toBe(true);
  });

  it('resetQuizState_testChuan1_don_dep_bo_nho_sau_khi_thi_xong', () => {
    // TC-STR-05 | testChuan1
    // Mục tiêu: Sau khi Submit nộp bài, phải dọn dẹp biến tạm trên RAM tránh leak bộ nhớ.
    
    // 1. Gia lập State đang rất đầy dữ liệu rác
    const dirtyState = {
        ...initialState,
        currentQuiz: { id: 'x' } as Quiz,
        userAnswers: { 'q1': 'a' },
        timeLeft: 50,
        isTimeWarning: true
    };
    
    // 2. Kích hoạt Reset
    const cleanState = reducer(dirtyState, resetQuizState());

    // 3. Kiểm tra biến đã bị dọn dẹp hoàn toàn
    expect(cleanState.currentQuiz).toBe(null);
    expect(cleanState.userAnswers).toEqual({});
    expect(cleanState.timeLeft).toBe(0);
    expect(cleanState.isTimeWarning).toBe(false);
  });
});
