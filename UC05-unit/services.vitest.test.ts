/**
 * ============================================================
 * FILE: services.vitest.test.ts
 * MODULE: UC-05 — Quản lý người dùng và tài khoản (API & Firebase)
 * DESCRIPTION: Kiểm thử hoạt động của tầng Services. Đây là tệp giao tiếp trực tiếp
 *              giữa hệ thống Frontend và Backend Google Firebase (Auth + Firestore).
 * TESTER: Thịnh
 * TC IDs: TC-A-SRV-01 -> TC-A-SRV-22
 * ============================================================
 * 
 * ============================================================
 */

import { expect, describe, it, vi, afterEach, beforeEach } from 'vitest';
import {
  signIn,
  register,
  signOutUser,
  resetPassword,
  changePassword,
  updateUserProfile,
  getCurrentUserData,
  isAuthenticated,
  updateUserStats,
  getCurrentUser
} from './services';

// --- BƯỚC THIẾT LẬP MOCK (GIẢ LẬP) THƯ VIỆN BÊN THỨ 3 ---
// Mục đích: Ép các hàm import từ 'firebase/auth' biến thành các Hàm Chống (Stub) trống rỗng.
// Khi đó code bên trong services.ts gọi tới signUp() hay signIn() thực chất là đang gọi các Dummy Functions này.
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updatePassword: vi.fn(),
  sendEmailVerification: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((db, collection, id) => `${collection}/${id}`),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}));

// Giả lập trạng thái của User đang đăng nhập ở phiên làm việc hiện tại trên RAM
let mockCurrentUser: any = null;
vi.mock('../../lib/firebase/config', () => ({
  get auth() { return { currentUser: mockCurrentUser } },
  db: {}
}));

describe('UC-05: Auth & User Management Services Tests', () => {

  // Chạy TRƯỚC mỗi block Test: Cấp một phiên làm việc cơ bản để không bị văng lỗi bảo mật nội bộ
  beforeEach(() => {
    mockCurrentUser = { uid: 'u123', email: 'test@g.com' };
  });

  // Chạy SAU mỗi block Test (Rollback Data): 
  // Rất quan trọng, có chức năng xoá sạch số lần đếm (call count) của các hàm Firebase giả lập, 
  // đảm bảo Test Case số 2 không bị ảnh hưởng bởi dữ liệu thừa của Test Case số 1.
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // NHÓM 1: LUỒNG ĐĂNG NHẬP (SIGN IN)
  // ==========================================
  describe('signIn (Đăng nhập)', () => {
    
    it('TC-A-SRV-01: signIn_chuan_tai_khoan_thuong_tra_ve_role_thuong', async () => {
      // MỤC ĐÍCH: Kiểm tra việc đăng nhập tài khoản Học sinh/Giáo viên bình thường có truy xuất được role từ CSDL không.
      // KỊCH BẢN GIẢ LẬP:
      // - Auth trả về Token người dùng ('u1').
      // - Database Firestore trả về một Record có gắn cục data "role: user".
      (signInWithEmailAndPassword as any).mockResolvedValueOnce({
        user: { uid: 'u1', email: 't@g.com' }
      });
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: 'user' })
      });

      // KÍCH HOẠT:
      const res = await signIn({ email: 't@g.com', password: '123' });

      // ĐIỀU KIỆN THÀNH CÔNG (PASSED): Object trả về từ hàm phải đóng gói chính xác UID và Role.
      expect(res.uid).toBe('u1');
      expect(res.role).toBe('user');
    });

    it('TC-A-SRV-02: signIn_chuan_admin_phai_ep_sang_role_admin', async () => {
      // MỤC ĐÍCH: Code project đang gài sẵn luồng Hardcode cho "admin123@gmail.com". Phải kiểm chứng code có bypass luồng thường không.
      (signInWithEmailAndPassword as any).mockResolvedValueOnce({
        user: { uid: 'admin_id', email: 'admin123@gmail.com' }
      });
      
      const res = await signIn({ email: 'admin123@gmail.com', password: '123' });
      
      // ĐIỀU KIỆN PASSED: Hàm không cần hỏi Database, tự động trả về role "admin" dựa trên Email.
      expect(res.role).toBe('admin');
    });

    it('TC-A-SRV-03: signIn_loi_quen_mat_khau_auth-wrong-password', async () => {
      // MỤC ĐÍCH: Server Google Firebase bắn ra Exception rác bằng thẻ tiếng Anh (auth-wrong-password). 
      // Kiểm tra xem hàm catch() của project có hứng đúng và chạy hàm switch() phiên dịch tiếng Việt cho người dùng không.
      // GIẢ LẬP EXCEPTION CAUSE:
      (signInWithEmailAndPassword as any).mockRejectedValueOnce({ code: 'auth/wrong-password' });
      
      // ĐIỀU KIỆN PASSED: Rejects.toThrow phải chụp được chuỗi Tiếng Việt đã dịch.
      await expect(signIn({ email: 't@g.com', password: 'sai' })).rejects.toThrow('Mật khẩu không chính xác');
    });

    it('TC-A-SRV-04: signIn_loi_quen_mat_khau_auth-user-not-found', async () => {
      // MỤC ĐÍCH: Tester cố tình chọc nhánh rẽ nhánh Error thứ 2 (Nhập bậy email).
      (signInWithEmailAndPassword as any).mockRejectedValueOnce({ code: 'auth/user-not-found' });
      await expect(signIn({ email: 'x', password: 'x' })).rejects.toThrow('Không tìm thấy tài khoản với email này');
    });
  });

  // ==========================================
  // NHÓM 2: LUỒNG ĐĂNG KÝ (REGISTER)
  // ==========================================
  describe('register (Đăng ký thành viên)', () => {

    it('TC-A-SRV-05: register_chuan_khoi_tao_user_va_tao_ho_so', async () => {
      // MỤC ĐÍCH: Quy trình tạo User là một "Giao dịch đồng bộ nhiều buớc". Cần xác nhận đủ buớc mới Pass.
      const mockCreds = { email: 'new@g.com', password: '123', displayName: 'Thinh' };
      (createUserWithEmailAndPassword as any).mockResolvedValueOnce({
        user: { uid: 'u99', email: mockCreds.email, emailVerified: false } 
      });

      const res = await register(mockCreds);

      // ĐIỀU KIỆN PASSED:
      // 1. Phải ghi tên displayName lên hệ thống Hồ sơ Google (updateProfile).
      expect(updateProfile).toHaveBeenCalledWith(expect.anything(), { displayName: 'Thinh' });
      // 2. Phải đánh lệnh bắn Email check vòng lặp (Verify OTP).
      expect(sendEmailVerification).toHaveBeenCalled(); 
      // 3. UserObject cuối cùng mang chính xác ID từ Auth.
      expect(res.uid).toBe('u99');
    });

    it('TC-A-SRV-06: register_loi_boc_bat_loi_email_co_san', async () => {
      // MỤC ĐÍCH: Mô phỏng lỗi bị Hacker spam đăng ký nhầm tài khoản đã tồn tại.
      (createUserWithEmailAndPassword as any).mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
      await expect(register({ email: 'x', password: 'x', displayName: 'x' })).rejects.toThrow('Email này đã được sử dụng');
    });

    it('TC-A-SRV-07: register_loi_mat_khau_auth-weak-password', async () => {
      // MỤC ĐÍCH: Kiểm tra Filter sức mạnh Password của Firebase dịch ra từ `auth/weak-password`.
      (createUserWithEmailAndPassword as any).mockRejectedValueOnce({ code: 'auth/weak-password' });
      await expect(register({ email: 'x', password: '12', displayName: 'x' })).rejects.toThrow('Mật khẩu quá yếu');
    });

    it('TC-A-SRV-08: register_loi_mat_khau_auth-invalid-email', async () => {
      // MỤC ĐÍCH: Tránh người dùng gõ chuỗi bậy bạ vào trường Email.
      (createUserWithEmailAndPassword as any).mockRejectedValueOnce({ code: 'auth/invalid-email' });
      await expect(register({ email: 'x@', password: 'x', displayName: 'x' })).rejects.toThrow('Email không hợp lệ');
    });
  });

  // ==========================================
  // NHÓM 3: TIỆN ÍCH TÀI KHOẢN (THAY ĐỔI TRẠNG THÁI & HỒ SƠ)
  // ==========================================
  describe('Tiện ích tài khoản', () => {

    it('TC-A-SRV-09: signOutUser_chuan', async () => {
      // MỤC ĐÍCH: Người dùng tự nguyện nhấn đăng xuất hệ thống.
      await signOutUser();
      // ĐIỀU KIỆN PASSED: Hàm signOut của Firebase SDK phải được đánh thức.
      expect(signOut).toHaveBeenCalled();
    });

    it('TC-A-SRV-10: signOutUser_loi_auth-network-request-failed', async () => {
      // MỤC ĐÍCH: Kiểm tra khả năng chịu lỗi (Fault tolerance) của App khi đăng xuất thì bị đứt cáp quang biển.
      (signOut as any).mockRejectedValueOnce({ code: 'auth/network-request-failed' });
      await expect(signOutUser()).rejects.toThrow('Lỗi kết nối mạng');
    });

    it('TC-A-SRV-11: resetPassword_chuan', async () => {
      // MỤC ĐÍCH: Test gửi luồng mã OTP quên mật khẩu.
      await resetPassword('reset@g.com');
      expect(sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('TC-A-SRV-12: resetPassword_loi_spam_auth-too-many-requests', async () => {
      // MỤC ĐÍCH: Hệ thống phải có chống DDOS / Chống Spam mail. Thư viện quăng mã "too-many-requests".
      (sendPasswordResetEmail as any).mockRejectedValueOnce({ code: 'auth/too-many-requests' });
      await expect(resetPassword('x')).rejects.toThrow('Quá nhiều yêu cầu. Vui lòng thử lại sau');
    });

    it('TC-A-SRV-13: changePassword_chuan', async () => {
      // MỤC ĐÍCH: Sửa mật khẩu khi ĐÃ có phiên đăng nhập an toàn.
      await changePassword('matkhaumoi'); // Biến mockCurrentUser lấy từ beforeEach
      expect(updatePassword).toHaveBeenCalled();
    });

    it('TC-A-SRV-14: changePassword_loi_chua_dang_nhap', async () => {
      // MỤC ĐÍCH: Ngăn chặn hacker sửa mật khẩu qua cửa hậu (backdoor) bằng cách chặn đứng nếu Token rỗng.
      mockCurrentUser = null; 
      await expect(changePassword('matkhaumoi')).rejects.toThrow('Người dùng chưa đăng nhập');
    });

    it('TC-A-SRV-15: updateUserProfile_chuan', async () => {
      // MỤC ĐÍCH: Luồng cập nhật Profile đòi hỏi ghi dữ liệu ở cả 2 cơ sở quản trị dữ liệu biệt lập.
      mockCurrentUser = { uid: 'u123' };
      await updateUserProfile({ displayName: 'Thinh VIP' });
      // ĐIỀU KIỆN PASSED: Cập nhật CSDL Auth (Nơi lưu thẻ User cơ bản)
      expect(updateProfile).toHaveBeenCalled();
      // ĐIỀU KIỆN PASSED: Cập nhật CSDL Firestore (Nơi lưu dữ liệu điểm danh, điểm số mở rộng của project)
      expect(setDoc).toHaveBeenCalled();
    });

    it('TC-A-SRV-16: updateUserProfile_loi_chua_dang_nhap', async () => {
      mockCurrentUser = null;
      await expect(updateUserProfile({ displayName: 'Thinh VIP' })).rejects.toThrow('Người dùng chưa đăng nhập');
    });
    
    it('TC-A-SRV-17: updateUserProfile_loi_updateProfile_fail_nem_loi_catch', async () => {
      // MỤC ĐÍCH: Nếu thao tác lỗi mạng giữa quá trình cập nhật Profile, code Catch của project phải quăng ra thông báo lỗi chung.
      mockCurrentUser = { uid: 'u123' };
      (updateProfile as any).mockRejectedValueOnce(new Error('Firebase DB Fail'));
      await expect(updateUserProfile({})).rejects.toThrow('Không thể cập nhật profile');
    });
  });

  // ==========================================
  // NHÓM 4: FETCH DỮ LIỆU & THỐNG KÊ (STATS & LEADERBOARD)
  // ==========================================
  describe('Dữ liệu Thống kê & Xác thực (Stats, Info)', () => {

    it('TC-A-SRV-18: getCurrentUserData_chuan', async () => {
      // MỤC ĐÍCH: Hàm Getter chạy ngầm lúc load trang để lấy Profile phụ trợ.
      mockCurrentUser = { uid: 'uid_ton_tai' };
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ email: 'a@g.com', streak: 5 })
      });
      const res = await getCurrentUserData();
      // ĐIỀU KIỆN PASSED: Phải rút được Parameter "streak: 5".
      expect((res as any).streak).toBe(5);
    });

    it('TC-A-SRV-19: getCurrentUserData_loi_khong_ton_tai', async () => {
      // MỤC ĐÍCH: Xử lý ngoại lệ Data Integrity (Tài khoản User tồn tại nhưng do Admin Xoá tay mảng JSON trên DB) -> Ném null an toàn, chống cháy giao diện.
      mockCurrentUser = { uid: 'uid_ton_tai' };
      (getDoc as any).mockResolvedValueOnce({ exists: () => false });
      expect(await getCurrentUserData()).toBeNull();
    });
    
    it('TC-A-SRV-20: getCurrentUserData_loi_chua_dang_nhap', async () => {
      // MỤC ĐÍCH: Security check chặn Guest lấy Data.
      mockCurrentUser = null;
      expect(await getCurrentUserData()).toBeNull();
    });

    it('TC-A-SRV-21: isAuthenticated_kiem_tra', () => {
      // MỤC ĐÍCH: Hàm Helper ép kiểu dữ liệu ép Object Auth sang Bool. Giúp React router guard rào khoá trang an toàn.
      mockCurrentUser = { uid: 'yes' };
      expect(isAuthenticated()).toBe(true);
    });

    it('TC-A-SRV-22: updateUserStats_chuan', async () => {
      // MỤC ĐÍCH CỰC KỲ QUAN TRỌNG: 
      // Kiểm thử Hàm update điểm số của người dùng lên Bảng Xếp Hạng. Đây là lõi Logic Phức 
      // tạp nhất tầng Service bọc bên ngoài.
      // KỊCH BẢN:
      // - Người dùng kết thúc vòng làm Quiz. Gửi kết quả {100 điểm} lên cho hàm tính toán.
      mockCurrentUser = { uid: 'user1' };
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ stats: { totalQuizzes: 1, averageScore: 50 }, totalScore: 50 })
      });

      await updateUserStats('user-id', {
        score: 100, totalQuestions: 10, correctAnswers: 10, timeSpent: 300, difficulty: 'easy'
      });

      // ĐIỀU KIỆN PASSED CHÍNH: 
      // Thuật toán của hàm bắt buộc phải lưu 2 CSDL con song song:
      // 1 nhánh là Doc 'users' profile cá nhân. Nhánh 2 là Doc 'user_stats' bảng Xếp Hạng Cộng Đồng.
      // => Expect setDoc phải kích hoạt ĐÚNG 2 LẦN.
      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    it('TC-A-SRV-23: getCurrentUser_tra_ve_user_hien_tai', () => {
      mockCurrentUser = { uid: 'test_uid' };
      const user = getCurrentUser();
      expect(user).toEqual({ uid: 'test_uid' });
    });

    it('TC-A-SRV-24: changePassword_nem_loi_chuan_hoa_getAuthErrorMessage', async () => {
      mockCurrentUser = { uid: 'test' };
      (updatePassword as any).mockRejectedValueOnce({ code: 'auth/user-disabled' });
      await expect(changePassword('newpass')).rejects.toThrow('Tài khoản đã bị vô hiệu hóa');
      
      (updatePassword as any).mockRejectedValueOnce({ code: 'unknown_error' });
      await expect(changePassword('newpass')).rejects.toThrow('Đã xảy ra lỗi không xác định');
    });

    it('TC-A-SRV-25: getCurrentUserData_loi_catch_tra_ve_null', async () => {
      mockCurrentUser = { uid: 'test' };
      (getDoc as any).mockRejectedValueOnce(new Error('Firebase DB Error'));
      const res = await getCurrentUserData();
      expect(res).toBeNull();
    });

    it('TC-A-SRV-26: updateUserStats_tao_moi_doc_neu_chua_ton_tai', async () => {
      mockCurrentUser = { uid: 'user1' };
      (getDoc as any).mockResolvedValue({
        exists: () => false,
        data: () => ({})
      });
      await updateUserStats('user-id', {
        score: 100, totalQuestions: 10, correctAnswers: 10, timeSpent: 300, difficulty: 'easy'
      });
      expect(setDoc).toHaveBeenCalled();
    });

    it('TC-A-SRV-27: updateUserStats_nem_loi_catch', async () => {
      mockCurrentUser = { uid: 'user1' };
      (getDoc as any).mockRejectedValueOnce(new Error('DB Failed'));
      await expect(updateUserStats('user-id', {
        score: 100, totalQuestions: 10, correctAnswers: 10, timeSpent: 300, difficulty: 'easy'
      })).rejects.toThrow('DB Failed');
    });

    it('TC-A-SRV-28: updateUserStats_fallback_branches_mang_gia_tri_0', async () => {
      // MỤC ĐÍCH: Cover 100% Branch cho các toán tử dự phòng (|| 0) khi DB thiếu field stats
      mockCurrentUser = { uid: 'user1' };
      
      // Lần gọi getDoc 1: userDoc tồn tại nhưng data rỗng (không có thuộc tính stats)
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}) 
      });
      // Lần gọi getDoc 2: statsDoc tồn tại nhưng cũng thiếu field
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({})
      });

      await updateUserStats('user-id', {
        score: 100, totalQuestions: 10, correctAnswers: 10, timeSpent: 300, difficulty: 'easy'
      });
      
      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    it('TC-A-SRV-29: updateUserStats_userDoc_khong_ton_tai_nhung_statsDoc_ton_tai', async () => {
      // MỤC ĐÍCH: Cover nhánh False của userDoc.exists() để lấy chuỗi rỗng '' làm displayName
      mockCurrentUser = { uid: 'user1' };
      
      // Lần 1: userDoc KHÔNG tồn tại
      (getDoc as any).mockResolvedValueOnce({
        exists: () => false
      });
      // Lần 2: statsDoc CÓ tồn tại
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ totalScore: 50, totalAttempts: 1 })
      });

      await updateUserStats('user-id', {
        score: 100, totalQuestions: 10, correctAnswers: 10, timeSpent: 300, difficulty: 'easy'
      });
      
      expect(setDoc).toHaveBeenCalledTimes(1); // Chỉ setDoc cho statsDoc vì userDoc không tồn tại
    });

    it('TC-A-SRV-30: updateUserStats_averageScore_fallback_0', async () => {
      // Cover nhánh: totalQuizzes > 0 nhưng bị rỗng averageScore (Line 305)
      mockCurrentUser = { uid: 'user1' };
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ stats: { totalQuizzes: 1 } }) // Cố tình bỏ averageScore
      });
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({})
      });
      await updateUserStats('user-id', {
        score: 100, totalQuestions: 10, correctAnswers: 10, timeSpent: 300, difficulty: 'easy'
      });
      expect(setDoc).toHaveBeenCalled();
    });

    it('TC-A-SRV-31: updateUserStats_user_ton_tai_nhung_stats_chua_ton_tai', async () => {
      // Cover nhánh: statsDoc không tồn tại (lần đầu chơi), nhưng userDoc đã tồn tại (Line 339)
      mockCurrentUser = { uid: 'user1' };
      (getDoc as any).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ displayName: 'Thinh Tester' })
      });
      (getDoc as any).mockResolvedValueOnce({
        exists: () => false // stats chưa có
      });
      await updateUserStats('user-id', {
        score: 100, totalQuestions: 10, correctAnswers: 10, timeSpent: 300, difficulty: 'easy'
      });
      expect(setDoc).toHaveBeenCalled();
    });

  });
});
