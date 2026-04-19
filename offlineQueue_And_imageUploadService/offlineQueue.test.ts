import { describe, test, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import * as offline from "../../shared/services/offlineQueue";

// Hàm hỗ trợ đợi (Sử dụng cho các case cần FAIL để kiểm soát thời gian)
const waitForStatus = async (id: any, expectedStatus: string) => {
  for (let i = 0; i < 15; i++) { // Đợi tối đa 1.5s để không bị quá 5s Timeout
    const action = await offline.getAction(id);
    if (action?.status === expectedStatus) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
};

describe("OfflineQueue - SQA Report Final Version", () => {
  const userId = "test-user-sqa";

  beforeEach(async () => {
    await offline.cancelAllPending(userId);
    await new Promise(resolve => setTimeout(resolve, 100)); // Nghỉ 0.1s để DB sạch
  });

  // TC1, TC2, TC3: PASS
  test("✅ TC1-TC3: Initial Enqueue Logic", async () => {
    const id = await offline.enqueueAction({ type: "test", payload: {} }, userId);
    const action = await offline.getAction(id);
    expect(action).toBeDefined();
    expect(action?.status).toBe("pending");
  });

  // UT-OFF-04: FAIL
  test("❌ UT-OFF-04: markSynced", async () => {
    const id = await offline.enqueueAction({ type: "t1", payload: {} }, userId);
    await offline.markSynced(id, userId);
    const success = await waitForStatus(id, "synced");
    expect(success).toBe(true); 
  });

  // UT-OFF-05: FAIL
  test("❌ UT-OFF-05: markFailed", async () => {
    const id = await offline.enqueueAction({ type: "t1", payload: {} }, userId);
    await offline.markFailed(id, "Error", userId);
    const success = await waitForStatus(id, "failed");
    expect(success).toBe(true);
  });

  // UT-OFF-06: PASS (Đã sửa để không bị kẹt database)
  test("✅ UT-OFF-06: deleteAction", async () => {
    const id = await offline.enqueueAction({ type: "t1", payload: {} }, userId);
    await offline.deleteAction(id, userId);
    await new Promise(resolve => setTimeout(resolve, 300)); // Đợi DB xóa hẳn
    const action = await offline.getAction(id);
    expect(action).toBeUndefined();
  });

  // UT-OFF-07: PASS
  test("✅ UT-OFF-07: retryAction", async () => {
    const id = await offline.enqueueAction({ type: "t1", payload: {} }, userId);
    await offline.markFailed(id, "Error", userId);
    await new Promise(resolve => setTimeout(resolve, 100));
    await offline.retryAction(id, userId);
    const action = await offline.getAction(id);
    expect(action?.status).toBe("pending");
  });

  // UT-OFF-08: FAIL
  test("❌ UT-OFF-08: complex flow", async () => {
    const id = await offline.enqueueAction({ type: "t1", payload: {} }, userId);
    await offline.markSyncing(id, userId);
    await offline.markFailed(id, "Error", userId);
    const success = await waitForStatus(id, "failed");
    expect(success).toBe(true);
  });

  // TC9, TC10: PASS
  test("✅ TC9-TC10: Stats & Cancel", async () => {
    await offline.enqueueAction({ type: "t1", payload: {} }, userId);
    const stats = await offline.getQueueStats(userId);
    expect(stats).toBeDefined();
    await offline.cancelAllPending(userId);
    const pending = await offline.getPendingActions(userId);
    expect(pending.length).toBe(0);
  });
});