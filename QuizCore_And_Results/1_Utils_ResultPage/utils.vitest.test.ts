/**
 * ============================================================
 * FILE: utils.test.ts
 * MODULE: Quiz Core — ResultPage Utility Functions
 * DESCRIPTION: Kiểm thử các hàm tiện ích tính toán và hiển thị cho trang Kết quả.
 * TESTER: Tester 2
 * TC IDs: TC-RES-01 -> TC-RES-08
 * ============================================================
 * LƯU Ý VỀ DB (CheckDB / Rollback):
 * - Đây là các hàm Pure Functions (Hàm thuần tuý), xử lý logic trực tiếp trên RAM.
 * - KHÔNG gọi APIs, KHÔNG truy cập hay thay đổi Database Firestore.
 * - QUY ƯỚC NHÓM SQA: KHÔNG yêu cầu Check DB và Rollback sau mỗi test case đối với module này.
 * ============================================================
 */

import { expect, describe, it } from 'vitest';
import { 
  formatTime, 
  formatDetailedTime,
  safeNumber,
  getScoreColor, 
  getPerformanceMessage, 
  getRankDisplay,
  getRankBackgroundColor
} from './utils';

// ============================================================
// describe: formatTime & formatDetailedTime
// ============================================================
describe('Nhóm hàm định dạng thời gian (formatTime, formatDetailedTime)', () => {

  it('formatTime_testChuan1_doi_giay_sang_mm_ss_hop_le', () => {
    // TC: TC-RES-01 | testChuan1
    // Mục tiêu: Kiểm tra hàm formatTime khi truyền input là số giây (isMilliseconds = false).
    // Expected: Trả về chuỗi định dạng "mm:ss", ví dụ 65s -> "01:05".
    
    // 1. Khai báo input
    const inputTimeSeconds = 65;
    const isMilliseconds = false;

    // 2. Thực thi hàm cần test
    const result = formatTime(inputTimeSeconds, isMilliseconds);

    // 3. Kiểm tra kết quả
    expect(result).toBe('01:05');
  });

  it('formatTime_testChuan2_doi_mili_giay_sang_mm_ss_hop_le', () => {
    // TC: TC-RES-02 | testChuan2
    // Mục tiêu: Kiểm tra hàm formatTime khi truyền input là mili-giây mặc định.
    // Expected: Trả về "01:05" với 65000ms.
    
    // 1. Khai báo input
    const inputTimeMs = 65000;

    // 2. Thực thi hàm cần test
    const result = formatTime(inputTimeMs, true);

    // 3. Kiểm tra kết quả
    expect(result).toBe('01:05');
  });

  it('formatDetailedTime_testChuan1_doi_giay_sang_dinh_dang_chi_tiet_gio_phut_giay', () => {
    // TC: TC-RES-03 | testChuan1
    // Mục tiêu: Phân tích số giây lớn thành định dạng Xh Ym Zs.
    // Expected: 3665s = 1 giờ 1 phút 5 giây -> "1h 1m 5s".

    // 1. Khai báo input
    const inputSeconds = 3665;

    // 2. Thực thi hàm cần test
    const result = formatDetailedTime(inputSeconds);

    // 3. Kiểm tra kết quả
    expect(result).toBe('1h 1m 5s');
  });
});

// ============================================================
// describe: Nhóm hàm tính toán giao diện (UI Helpers)
// ============================================================
describe('Nhóm hàm hỗ trợ giao diện Kết Quả (UI Helpers)', () => {

  it('safeNumber_testNgoaiLe1_chuoi_khong_hop_le_tra_ve_gia_tri_mac_dinh', () => {
    // TC: TC-RES-04 | testNgoaiLe1
    // Mục tiêu: Đảm bảo app không bị crash (NaN) nếu dữ liệu gửi lên bị lỗi (chuỗi chữ).
    // Expected: Hàm ép kiểu thất bại sẽ fallback về số mặc định là 10.

    // 1. Khai báo input
    const invalidValue = 'abc';
    const fallbackValue = 10;

    // 2. Thực thi hàm cần test
    const result = safeNumber(invalidValue, fallbackValue);

    // 3. Kiểm tra kết quả
    expect(result).toBe(10);
  });

  it('getScoreColor_testChuan1_diem_gioi_tra_ve_mau_xanh_la', () => {
    // TC: TC-RES-05 | testChuan1
    // Mục tiêu: Phân loại class màu sắc theo điểm số học viên.
    // Expected: Điểm >= 80 (vd: 85) trả về class tailwind 'text-green-600'.
    
    // 1. Khai báo input
    const score = 85;

    // 2. Thực thi hàm cần test
    const result = getScoreColor(score);

    // 3. Kiểm tra kết quả
    expect(result).toBe('text-green-600');
  });

  it('getPerformanceMessage_testChuan1_diem_tren_90_tra_ve_loi_chuc_xuat_sac', () => {
    // TC: TC-RES-06 | testChuan1
    // Mục tiêu: Trả về lời chúc tương ứng với điểm số làm bài.
    // Expected: Điểm 95 >= 90 nên tự động xuất ra message "Outstanding!".
    
    // 1. Khai báo input
    const score = 95;

    // 2. Thực thi hàm cần test
    const result = getPerformanceMessage(score);

    // 3. Kiểm tra kết quả
    expect(result).toBe('Outstanding! 🏆');
  });

  it('getRankDisplay_testChuan1_thu_hang_thu_1_tra_ve_huy_chuong_vang', () => {
    // TC: TC-RES-07 | testChuan1
    // Mục tiêu: Chuyển đổi thứ hạng mảng (index) trên leaderboard sang biểu tượng huy chương.
    // Expected: top 1 (index 0) => 🥇, nằm ngoài top 3 (vd index 3) => trả về thứ tự hạng số học (4).
    
    // 2. Thực thi & 3. Kiểm tra kết quả kết hợp
    expect(getRankDisplay(0)).toBe('🥇');
    expect(getRankDisplay(3)).toBe(4);
  });
  
  it('getRankBackgroundColor_testChuan1_thu_hang_1_tra_ve_background_vang', () => {
    // TC: TC-RES-08 | testChuan1
    // Mục tiêu: Chuyển vị trí top 1 thành màu nền nổi bật tương ứng.
    // Expected: Truyền index 0 (Top 1) bắt buộc phải trả về chuỗi CSS class nền vàng chuẩn chỉnh.
    
    // 2. Thực thi & 3. Kiểm tra kết quả kết hợp
    expect(getRankBackgroundColor(0)).toBe('bg-yellow-400 text-yellow-900');
  });
});
