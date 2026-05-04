/**
 * ============================================================
 * FILE: store.vitest.test.ts
 * MODULE: UC-05 — Quản lý người dùng và tài khoản
 * DESCRIPTION: Kiểm thử việc quản lý State Redux của phiên đăng nhập (Hệ thống Client RAM)
 * TESTER: Thịnh
 * TC IDs: TC-A-STR-01 -> TC-A-STR-07
 * ============================================================
 * 
 * ============================================================
 */

import { expect, describe, it } from 'vitest';
import reducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  authCheckComplete,
  setRole,
  setLoading,
} from './store';
import { AuthState, AuthUser } from './types';

describe('UC-05: Redux Auth Store Tests', () => {

  // Lấy trạng thái mặc định của store auth lúc vừa khởi động (State Sạch)
  const initialState = reducer(undefined, { type: 'unknown' }) as AuthState;

  it('TC-A-STR-01: loginStart_khi_bat_dau_dang_nhap_phai_bat_co_loading_va_xoa_error', () => {
    // GIẢI THÍCH KỸ THUẬT (Dirty State Reset Testing):
    // Tại sao không dùng initialState (State sạch) để test? 
    // Vì nếu User đăng nhập sai pass ở lần 1, hệ thống sẽ văng lỗi "Sai mật khẩu" lưu vào Redux.
    // Khi User bấm Đăng nhập lại lần 2, hàm loginStart() bắt buộc phải XÓA chữ "Sai mật khẩu" đi, 
    // đồng thời bật icon Loading. Việc ép một 'badState' vào để test chứng minh code có khả năng dọn rác.
    
    // 1. Giả lập state dơ (đang bị báo lỗi từ trước)
    const badState = { ...initialState, error: 'Sai mật khẩu', isLoading: false };
    
    // 2. Chạy hàm bắt đầu tiến trình login
    const nextState = reducer(badState, loginStart());

    // 3. Expected: Phải bật vòng Loading, và quan trọng nhất: clear thông báo lỗi cũ
    expect(nextState.isLoading).toBe(true);
    expect(nextState.error).toBe(null);
  });

  it('TC-A-STR-02: loginSuccess_luu_thong_tin_user_va_xac_nhan_chua_co_role', () => {
    // GIẢI THÍCH KÝ THUẬT:
    // User mới đăng ký bằng Google thường chưa có Role (Chưa chọn là Học sinh hay Giáo viên).
    // Test này kiểm chứng việc Redux nhận diện được User "trắng" và bật cờ ép buộc chọn Role (needsRoleSelection = true).
    
    // 1. Tạo 1 User ảo (Mock Data) trả về từ Firebase nhưng chưa có Role
    const mockUser: AuthUser = { uid: 'u1', email: 'test@g.com', emailVerified: true };
    
    // 2. Kích hoạt Reducer
    const nextState = reducer(initialState, loginSuccess(mockUser));

    // 3. Expected: isAuthenticated = true, user có thông tin, needsRoleSelection = true do thiếu role
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user).toEqual(mockUser);
    expect(nextState.needsRoleSelection).toBe(true); // Bắt buộc chuyển hướng sang trang chọn Role
    expect(nextState.isLoading).toBe(false); // Tắt hiệu ứng loading
  });

  it('TC-A-STR-03: loginSuccess_bo_qua_buoc_chon_role_neu_user_da_co_role', () => {
    // 1. Tạo User đã có sẵn chức vụ (Ví dụ Admin hoặc Creator đã lưu từ trước)
    const mockAdmin: AuthUser = { uid: 'u2', email: 'admin@g.com', emailVerified: true, role: 'admin' };
    
    const nextState = reducer(initialState, loginSuccess(mockAdmin));

    // Expected: Cờ needsRoleSelection phải là False để User được vào thẳng trang chủ, không bị kẹt ở màn hình Chọn Role
    expect(nextState.needsRoleSelection).toBe(false);
  });

  it('TC-A-STR-04: loginFailure_huy_cac_thong_so_va_bao_loi_chinh_xac', () => {
    // MỤC ĐÍCH: Kiểm tra khả năng xử lý ngoại lệ (Exception Handling) của State.
    // Khi Backend ném lỗi (vd: Tài khoản bị khóa), State phải xóa ngay thông tin User nhạy cảm, tắt Loading và lưu chuỗi Error.
    const nextState = reducer(initialState, loginFailure('Tài khoản đã bị cấm'));

    // Expected: reset toàn bộ user, lưu string báo lỗi để hiển thị lên Toast/Alert UI
    expect(nextState.isLoading).toBe(false);
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBe(null);
    expect(nextState.error).toBe('Tài khoản đã bị cấm');
  });

  it('TC-A-STR-05: logout_don_dep_toan_bo_the_phien_login', () => {
    // KỸ THUẬT: Gắn một State đang ở trạng thái "Đã đăng nhập" (loggedInState), 
    // sau đó bắn action logout() để xem RAM có dọn dẹp sạch sẽ Session cũ không.
    const loggedInState = { 
        ...initialState, 
        user: { uid: 'u1', email: '', emailVerified: true }, 
        isAuthenticated: true 
    };

    const nextState = reducer(loggedInState, logout());

    expect(nextState.user).toBe(null);
    expect(nextState.isAuthenticated).toBe(false);
  });

  it('TC-A-STR-06: setRole_gan_chuc_vu_cho_user_moi_tao', () => {
    // MỤC ĐÍCH: Test Flow luồng đăng ký. Sau khi User chọn Role ở màn hình SelectRole, 
    // State phải cập nhật Role vào profile và tắt cờ bắt buộc chọn Role.
    const loggedInState = { 
        ...initialState, 
        user: { uid: 'u1', email: '', emailVerified: true }, 
        needsRoleSelection: true 
    };

    const nextState = reducer(loggedInState, setRole('creator'));

    // Expected: Role mới ('creator') phải được lồng vào bên trong object user, và cờ needsRoleSelection bị dập tắt
    expect(nextState.user?.role).toBe('creator');
    expect(nextState.needsRoleSelection).toBe(false);
  });

  it('TC-A-STR-07: authCheckComplete_va_setLoading_chuyen_doi_co_hieu_ung', () => {
    // MỤC ĐÍCH: Test các hàm tiện ích UI (Loading Spinner hiển thị toàn mành hình lúc F5)
    const state1 = reducer(initialState, setLoading(true));
    expect(state1.isLoading).toBe(true);

    const state2 = reducer(state1, authCheckComplete());
    expect(state2.isLoading).toBe(false);
    expect(state2.authChecked).toBe(true); // Cờ xác nhận đã quét qua Firebase 1 lần
  });

  it('TC-A-STR-08: setRole_khi_user_null_khong_lam_crash_app', () => {
    // MỤC ĐÍCH: Cover 100% Branch. Gọi setRole khi chưa đăng nhập (user = null) để phủ nhánh False của if(state.user).
    const state = reducer(initialState, setRole('creator'));
    expect(state.user).toBeNull(); // Không có user thì không gán role được, state phải giữ nguyên
  });

});
