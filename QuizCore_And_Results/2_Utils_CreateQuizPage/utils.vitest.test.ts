/**
 * ============================================================
 * FILE: utils.test.ts
 * MODULE: Quiz Core — CreateQuizPage Utility Functions
 * DESCRIPTION: Kiểm thử các hàm hỗ trợ việc tạo lập Quiz (gen ID, tự động chuẩn hoá đáp án điền từ).
 * TESTER: Tester 2
 * TC IDs: TC-CQP-01 -> TC-CQP-06
 * ============================================================
 * LƯU Ý VỀ DB (CheckDB / Rollback):
 * - Đây là các hàm Pure Functions (Hàm Xử Lý Local)
 * - Module này chỉ xử lý text và mảng string trực tiếp bằng JS logic, 
 * - KHÔNG tác động tới DB cho tới khi người dùng Submit Form bên ngoài cục diện Component chung.
 * - KHÔNG cần Setup Mock Database hay Rollback cho File này.
 * ============================================================
 */

import { expect, describe, it } from 'vitest';
import { generateId, checkShortAnswer, generateAcceptedAnswers } from './utils';
// Sử dụng any để mock Type đơn giản thay vì phải import nguyên gốc, tránh dependencies lỗi
import { Question } from './types'; 

// ============================================================
// describe: Nhóm hàm sinh tự động (Auto-Generating Function)
// ============================================================
describe('Nhóm hàm sinh dữ liệu tự động (generateId, generateAcceptedAnswers)', () => {

  it('generateId_testChuan1_sinh_chuoi_random_do_dai_9_ky_tu', () => {
    // TC: TC-CQP-01 | testChuan1
    // Mục tiêu: Tạo ID ngẫu nhiên không trùng lặp dùng để định danh cho câu hỏi mới biên soạn.
    // Expected: Hàm trả về chuẩn kiểu 'string' và bắt buộc có độ dài đúng 9 ký tự.

    // 2. Thực thi hàm cần test sinh mã UID mới
    const id = generateId();

    // 3. Kiểm tra kết quả
    expect(typeof id).toBe('string');
    expect(id.length).toBe(9);
  });

  it('generateAcceptedAnswers_testChuan1_sinh_nhieu_truong_hop_chu_hoa_thuong_khong_dau', () => {
    // TC: TC-CQP-05 | testChuan1
    // Mục tiêu: Từ đáp án đúng gốc người dùng nhập, tự động sinh ra các phiên bản tương đương 
    //           để hệ thống châm chước (có dấu, không dấu diacritics, chữ hoa, chữ thường).
    // Expected: Input "Hà Nội" -> Mảng trả về chứa ít nhất 4 phiên bản biến thể hợp lệ.

    // 1. Khai báo input
    const baseAnswer = 'Hà Nội';

    // 2. Thực thi hàm cần test
    const resultArr = generateAcceptedAnswers(baseAnswer);

    // 3. Kiểm tra kết quả logic
    expect(resultArr).toContain('Hà Nội');
    expect(resultArr).toContain('hà nội');
    expect(resultArr).toContain('HÀ NỘI');
    expect(resultArr).toContain('Ha Noi'); // Biến thể đã loại bỏ dấu tiếng Việt
  });
  
  it('generateAcceptedAnswers_testNgoaiLe1_chuoi_rongs_tra_ve_mang_rong', () => {
    // TC: TC-CQP-06 | testNgoaiLe1
    // Mục tiêu: Phòng tránh lỗi khi người dùng cố tình chỉ nhập dấu cách khoảng trắng không có ý nghĩa.
    // Expected: Trả về một mảng rỗng [] thay vì sinh lãng phí nhiều phiên bản string whitespace.

    // 1. Khai báo input là chuỗi whitespace trống
    const emptySpaces = '   ';

    // 2. Thực thi hàm cần test
    const resultArr = generateAcceptedAnswers(emptySpaces);

    // 3. Kiểm tra kết quả logic
    expect(resultArr).toEqual([]);
    expect(resultArr.length).toBe(0);
  });
});

// ============================================================
// describe: checkShortAnswer (Phân hệ Create Quiz - Trải nghiệm Test Preview)
// ============================================================
describe('Hàm xác thực tính đúng sai của đáp án câu hỏi tự luận - checkShortAnswer', () => {

  it('checkShortAnswer_testNgoaiLe1_loai_cau_hoi_khong_doi_xung_lap_tuc_bao_sai', () => {
    // TC: TC-CQP-02 | testNgoaiLe1
    // Mục tiêu: Hàm này CHỈ áp dụng châm chước cho 'short_answer'. Check lỏng lẻo sẽ dính bug.
    // Expected: Trả về false lập tức khi gặp type = 'multiple_choice' cho dù đáp án chữ giống nhau.

    // 1. Khai báo input - Dùng as unknown as Question để mock schema cho ngắn gọn
    const questionMock = { 
        type: 'multiple_choice', 
        correctAnswer: 'test_answer' 
    } as unknown as Question;
    const userAnswer = 'test_answer';

    // 2. Thực thi hàm
    const isCorrect = checkShortAnswer(userAnswer, questionMock);

    // 3. Kiểm tra kết quả
    expect(isCorrect).toBe(false);
  });

  it('checkShortAnswer_testChuan1_dap_an_dung_khong_phan_biet_hoa_thuong', () => {
    // TC: TC-CQP-03 | testChuan1
    // Mục tiêu: Giúp người dùng trải nghiệm preview có cảm giác tốt, bỏ qua lỗi in hoa kí tự.
    // Expected: Output true khi người nhập điền là text in thường nhưng đáp án gốc quy định có text in hoa.

    // 1. Khai báo input testcase chính xác
    const questionMock = { 
        type: 'short_answer', 
        correctAnswer: 'Hello World' 
    } as unknown as Question;
    const userAnswer = 'hello world';

    // 2. Thực thi hàm đánh giá
    const isCorrect = checkShortAnswer(userAnswer, questionMock);

    // 3. Kiểm tra kết quả
    expect(isCorrect).toBe(true);
  });

  it('checkShortAnswer_testChuan2_chuyen_doi_voi_mang_dap_an_duoc_chap_nhan', () => {
    // TC: TC-CQP-04 | testChuan2
    // Mục tiêu: Test so khớp đáp án mượt mà với từ điển acceptedAnswers trong trường hợp không khớp correctAnswer ban đầu.
    // Expected: userAnswer = 'vn' khớp thành công với mảng chứa 'VN'.

    // 1. Khai báo input đầy đủ mảng
    const questionMock = { 
        type: 'short_answer', 
        correctAnswer: 'Vietnam', 
        acceptedAnswers: ['Viet nam', 'VN', 'Viet Nam'] 
    } as unknown as Question;
    const userAnswer = 'vn';

    // 2. Thực thi hàm kiểm chứng
    const isCorrect = checkShortAnswer(userAnswer, questionMock);

    // 3. Kiểm tra kết quả tính điểm có đạt chuẩn không
    expect(isCorrect).toBe(true);
  });
});
