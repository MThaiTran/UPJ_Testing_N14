/**
 * ============================================================
 * FILE: utils.test.ts
 * MODULE: Quiz Core — QuizPage Utility Functions (Run in realtime tests)
 * DESCRIPTION: Kiểm thử các nghiệp vụ liên quan đến quá trình làm bài thi trực tiếp (Chấm điểm câu tự luận, Kiểm đếm câu hỏi đã làm).
 * TESTER: Tester 2
 * TC IDs: TC-QP-01 -> TC-QP-07
 * ============================================================
 * LƯU Ý VỀ DB (CheckDB / Rollback):
 * - Đây là các hàm mức độ Pure Helper thực thi thuần túy ở Client Side Browser.
 * - Logic điểm danh tiến độ này KHÔNG ghi kết quả xuống Database để tránh nghẽn mạng lúc thi. 
 * - Việc ghi file kết quả DB cuối cùng sẽ do Submit Service đảm trách.
 * - QUY ƯỚC NHÓM SQA: KHÔNG cần thực hiện Mock Database, CheckDB và Rollback đối với file này.
 * ============================================================
 */

import { expect, describe, it } from 'vitest';
import { checkShortAnswer, isAnswerProvided } from './utils';
import { Question, AnswerValue } from '../../types'; 

// ============================================================
// describe: checkShortAnswer (Phân hệ Đang Lúc Làm Bài Thi)
// ============================================================
describe('Hàm đối soát đáp án lúc thực chiến làm bài thi - checkShortAnswer', () => {
    
  it('checkShortAnswer_testChuan1_loai_bo_khoang_trang_du_thua_truoc_khi_tinh_diem', () => {
    // TC: TC-QP-01 | testChuan1
    // Mục tiêu: Khi học trò sơ ý nhấn thừa dấu cách cách trước/sau chữ đáp án, hệ thống vẫn phải xử lý mềm mỏng và tính điểm.
    // Expected: Hàm tự động trim() chuỗi đầu vào -> loại bỏ "   " và khớp với gốc -> trả về true.

    // 1. Khai báo dữ liệu gốc
    const questionMock = { 
        type: 'short_answer', 
        correctAnswer: 'apple' 
    } as unknown as Question;
    const userAnswer = '   apple  ';

    // 2. Chạy hàm cần test
    const isCorrect = checkShortAnswer(userAnswer, questionMock);

    // 3. Kiểm chứng
    expect(isCorrect).toBe(true);
  });

  it('checkShortAnswer_testNgoaiLe1_dap_an_hoan_toan_sai_khong_cho_diem', () => {
    // TC: TC-QP-02 | testNgoaiLe1
    // Mục tiêu: Chặn tuyệt đối nếu học viên điền bậy một chuỗi câu trả lời hoàn toàn khác biệt với cấu hình đề.
    // Expected: Output bắt buộc trả về false.

    // 1. Khai báo mock
    const questionMock = { 
        type: 'short_answer', 
        correctAnswer: 'apple' 
    } as unknown as Question;
    const userAnswer = 'orange';

    // 2. Chạy hàm
    const isCorrect = checkShortAnswer(userAnswer, questionMock);

    // 3. Kiểm chứng
    expect(isCorrect).toBe(false);
  });
});

// ============================================================
// describe: isAnswerProvided (Helper cho phần điểm danh tiến độ / Navigation Dot)
// ============================================================
describe('Hàm điểm danh tình trạng câu trả lời từng câu - isAnswerProvided', () => {

  it('isAnswerProvided_testNgoaiLe1_gia_tri_chua_khoi_tao_undefined_tinh_la_chua_lam', () => {
    // TC: TC-QP-03 | testNgoaiLe1
    // Mục tiêu: Đảm bảo nếu state trả về rỗng (người dùng chưa bao giờ click/chạm vào câu hỏi này) thì đếm là chưa làm.
    // Expected: Truyền undefined hay null bắt buộc xử lý trả về false.

    // 1. Khai báo tham số đầu vào
    const unselectedAnswer = undefined as unknown as AnswerValue;

    // 2. Gọi hàm & 3. Kiểm tra gộp
    expect(isAnswerProvided(unselectedAnswer)).toBe(false);
  });

  it('isAnswerProvided_testNgoaiLe2_chuoi_khoang_trang_spam_tinh_la_chua_lam', () => {
    // TC: TC-QP-04 | testNgoaiLe2
    // Mục tiêu: Cản user bấm nhầm spam dấu chấm hoặc phím cách dài vô lý để cheat lừa qua bài.
    // Expected: Truyền chuỗi "   " sẽ bị đánh rớt return false.

    // 1. Khai báo tham số
    const blankAnswer: AnswerValue = '   ';

    // 2. Gọi hàm & 3. Kiểm tra gộp
    expect(isAnswerProvided(blankAnswer)).toBe(false);
  });

  it('isAnswerProvided_testChuan1_chuoi_van_ban_nhap_chu_tinh_la_da_lam', () => {
    // TC: TC-QP-05 | testChuan1
    // Mục tiêu: Đếm công nhận câu điền từ/tự luận đã được giải.
    // Expected: Input chuỗi string độ dài text bình thường sẽ trả về true.

    expect(isAnswerProvided('đây là đáp án')).toBe(true);
  });

  it('isAnswerProvided_testNgoaiLe3_mang_rong_khi_lam_trac_nghiem_tinh_la_chua_lam', () => {
    // TC: TC-QP-06 | testNgoaiLe3
    // Mục tiêu: Với câu Multiple Choices, user click bỏ chọn toàn bộ checkbox làm mảng State ghi đáp án bị rỗng -> Quay về chưa làm.
    // Expected: Array.length === 0 tự độn trả về false.

    const emptySelection: AnswerValue = [];
    
    expect(isAnswerProvided(emptySelection)).toBe(false);
  });

  it('isAnswerProvided_testChuan2_mang_co_tich_tieu_chuan_it_nhat_1_tinh_la_da_lam', () => {
    // TC: TC-QP-07 | testChuan2
    // Mục tiêu: Với đặc tính Multiple Choices, nếu người dùng có tick chọn (>= 1 phần tử) thì tính đã làm xong.
    // Expected: Input Array có phần tử -> true.

    const validSelection: AnswerValue = ['A', 'C'];
    
    expect(isAnswerProvided(validSelection)).toBe(true);
  });
});
