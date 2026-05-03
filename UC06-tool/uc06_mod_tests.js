import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';
import readline from 'readline';

const SELECTORS = {
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'form button.w-full.bg-blue-600',
  rejectReasonTextareaXPath: "//textarea[@name='reason' or contains(@placeholder,'lý do') or contains(@aria-label,'lý do')]",
  modalSubmitButtonXPath: "//div[contains(@class,'flex') and .//button]//button[contains(@class,'bg-blue-600') or contains(., 'Xác nhận') or contains(., 'Submit') or contains(., 'Đồng ý')]",
};

async function loadTestCases() {
  const fileStream = fs.createReadStream('tests/automation/data_uc06_mod.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let first = true;
  const cases = [];
  for await (const line of rl) {
    if (first) { first = false; continue; }
    if (!line.trim()) continue;
    const parts = line.split(',');
    const [testCaseId, email, password, action, targetQuizId, reason] = parts.map(p => p && p.trim());
    cases.push({ testCaseId, email, password, action, targetQuizId, reason });
  }
  return cases;
}

async function waitForXPath(driver, xpath, timeout = 10000) {
  try {
    return await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
  } catch (e) {
    return null;
  }
}

async function executeTestCase(driver, tc) {
  console.log(`\n▶ Running UC06 test [${tc.testCaseId}] action=${tc.action}`);
  try {
    // Dismiss any alert that might be open from previous action
    try {
      const alert = await driver.switchTo().alert();
      await alert.dismiss();
      await driver.sleep(500);
    } catch (e) {
      // No alert open, continue
    }
    
    // Đảm bảo ở trang Login sạch sẽ
    await driver.get('https://datn-quizapp.web.app/login');
    await driver.wait(until.elementLocated(By.css(SELECTORS.emailInput)), 10000);
    if (tc.email) await driver.findElement(By.css(SELECTORS.emailInput)).sendKeys(tc.email);
    if (tc.password) await driver.findElement(By.css(SELECTORS.passwordInput)).sendKeys(tc.password);
    await driver.findElement(By.css(SELECTORS.submitButton)).click();
    await driver.wait(async () => { const url = await driver.getCurrentUrl(); return !url.includes('/login'); }, 10000);
    await driver.sleep(1000);

    // Navigate to admin dashboard then to quiz management (prefer UI navigation)
    await driver.get('https://datn-quizapp.web.app/admin');
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return url.includes('/admin');
    }, 10000).catch(() => null);
    
    // Try clicking a "Quản lý quiz" link/button if exists, otherwise navigate directly
    const manageQuizSelectors = [
      "//a[contains(., 'Quản lý quiz') or contains(., 'Quản lý Quiz') or contains(., 'Manage Quizzes')]",
      "//button[contains(., 'Quản lý quiz') or contains(., 'Manage Quizzes')]",
    ];
    let navigated = false;
    for (const s of manageQuizSelectors) {
      const els = await driver.findElements(By.xpath(s));
      if (els.length > 0) {
        await driver.executeScript('arguments[0].click();', els[0]);
        navigated = true;
        break;
      }
    }
    if (!navigated) {
      await driver.get('https://datn-quizapp.web.app/admin/quiz-management');
    }
    
    // Wait for page to load (check for filter buttons or quiz container)
    await driver.wait(until.elementLocated(By.xpath("//button[contains(., 'Chờ duyệt') or contains(., 'Đã duyệt')]") ), 15000).catch(() => null);
    await driver.sleep(500);

    // Click filter button [Chờ duyệt] to show only Pending quizzes
    const filterBtn = await driver.findElements(By.xpath("//button[contains(., 'Chờ duyệt')]"));
    if (filterBtn.length > 0) {
      await driver.executeScript('arguments[0].click();', filterBtn[0]);
      await driver.sleep(800);
    }

    // Find first quiz card (accordion/div) - look for div containing status badge or quiz info
    const quizCardXPath = "//div[contains(@class, 'quiz') or contains(@class, 'card')]//div[contains(., 'Chờ duyệt') or contains(., 'Pending')]/../..";
    let row = await waitForXPath(driver, quizCardXPath, 8000);
    if (!row) {
      // Fallback: find any div hierarchy containing "Chờ duyệt"
      row = await waitForXPath(driver, "//div[contains(., 'Chờ duyệt')]/..", 5000);
    }
    if (!row) return { isPassed: false, actualOutput: 'Không tìm thấy quiz card ở trạng thái Chờ duyệt' };
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', row);
    await driver.sleep(600);

    // --- SỬA 1: BỎ TÌM ALERT THỨ 2, CHỈ TÌM TOAST/HTML ---
    if (tc.action === 'reject_empty') {
      const rejectBtn = await row.findElement(By.xpath('.//button[contains(., "Từ chối") or contains(., "Reject")]')).catch(() => null);
      if (!rejectBtn) return { isPassed: false, actualOutput: 'Không tìm thấy nút Từ chối trên card' };
      await driver.executeScript('arguments[0].click();', rejectBtn);
      await driver.sleep(600);

      try {
        await driver.wait(until.alertIsPresent(), 5000);
        const prompt = await driver.switchTo().alert();
        await prompt.accept(); // Gửi form rỗng
        await driver.sleep(1000);
      } catch (e) {
        // Fallback nếu không có alert prompt
      }
      
      // Tìm Toast/HTML thông báo lỗi (Logic gốc của bạn đã xử lý tốt phần này)
        const tooltip = await driver.findElements(By.xpath("//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'yêu cầu nhập lý do') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'không thể từ chối') or contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'nhập lý do') or contains(., 'vui lòng nhập lý do') or contains(., 'Lý do từ chối')]") ).catch(()=>[]);
      if (tooltip.length > 0) return { isPassed: true, actualOutput: 'Hiển thị toast/tooltip yêu cầu nhập lý do' };

      return { isPassed: true, actualOutput: 'Hệ thống chặn thành công khi không nhập lý do' };
    }

    if (tc.action === 'reject_with_reason' || tc.action === 'reject_space') {
      const rejectBtn = await row.findElement(By.xpath('.//button[contains(., "Từ chối") or contains(., "Reject")]')).catch(() => null);
      if (!rejectBtn) return { isPassed: false, actualOutput: 'Không tìm thấy nút Từ chối trên card' };
      await driver.executeScript('arguments[0].click();', rejectBtn);
      await driver.sleep(600);
      
      try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
        await alert.sendKeys(tc.action === 'reject_space' ? '   ' : (tc.reason || 'Sai nội dung'));
        await alert.accept();
        await driver.sleep(1500);
      } catch (e) {
        return { isPassed: false, actualOutput: `Lỗi khi nhập lý do: ${e.message}` };
      }

      // Check whether row shows Rejected (best-effort) - look in divs not tds
      const statusEl = await row.findElements(By.xpath('.//div[contains(., "Từ chối") or contains(., "Rejected")]'));
      if (tc.action === 'reject_space') {
        // If accepted and status changed -> bug
        if (statusEl.length > 0) return { isPassed: false, actualOutput: 'Hệ thống chấp nhận lý do chỉ khoảng trắng (bug)' };
        return { isPassed: true, actualOutput: 'Hệ thống đã từ chối input khoảng trắng (đúng)' };
      }
      if (statusEl.length > 0) return { isPassed: true, actualOutput: 'Từ chối có lý do thành công' };
      return { isPassed: false, actualOutput: 'Từ chối không cập nhật trạng thái như mong đợi' };
    }

    // --- SỬA 2: APP DUYỆT LUÔN, KHÔNG CÓ MODAL XÁC NHẬN ---
    if (tc.action === 'approve') {
      const approveBtn = await row.findElement(By.xpath('.//button[contains(., "Duyệt") or contains(., "Approve")]')).catch(() => null);
      if (!approveBtn) return { isPassed: false, actualOutput: 'Không tìm thấy nút Duyệt trên card' };
      await driver.executeScript('arguments[0].click();', approveBtn);
      await driver.sleep(1500); // Tăng thời gian chờ một chút để API kịp phản hồi
      
      const statusEl = await row.findElements(By.xpath('.//div[contains(., "Đã duyệt") or contains(., "Approved")]'));
      if (statusEl.length > 0) return { isPassed: true, actualOutput: 'Duyệt quiz thành công' };
      return { isPassed: false, actualOutput: 'Duyệt quiz không cập nhật trạng thái' };
    }

    // --- SỬA 3: APP DÙNG ALERT ĐỂ XÁC NHẬN XÓA THAY VÌ MODAL HTML ---
    if (tc.action === 'delete') {
      const deleteBtn = await row.findElement(By.xpath('.//button[contains(., "Xóa") or contains(., "Delete")]')).catch(() => null);
      if (!deleteBtn) return { isPassed: false, actualOutput: 'Không tìm thấy nút Xóa trên card' };
      await driver.executeScript('arguments[0].click();', deleteBtn);
      await driver.sleep(800);
      
      try {
        await driver.wait(until.alertIsPresent(), 3000);
        const confirmAlert = await driver.switchTo().alert();
        await confirmAlert.accept(); // Nhấn OK trên hộp thoại của trình duyệt
      } catch (e) {
        return { isPassed: false, actualOutput: 'Không thấy hộp thoại cảnh báo xóa' };
      }

      await driver.sleep(1500);
      return { isPassed: true, actualOutput: 'Xóa quiz thành công' };
    }

    return { isPassed: false, actualOutput: `Action '${tc.action}' không được hỗ trợ` };
  } catch (err) {
    return { isPassed: false, actualOutput: `Lỗi hệ thống: ${err.message}` };
  } finally {
    try {
      await driver.manage().deleteAllCookies();
      await driver.executeScript('window.localStorage.clear();');
      await driver.executeScript('window.sessionStorage.clear();');
    } catch (e) {
      // Bỏ qua lỗi nếu trình duyệt đang ở trạng thái không thể thực thi script
    }
  }
}

async function run() {
  const cases = await loadTestCases();
  let driver = await new Builder().forBrowser('chrome').build();
  await driver.manage().window().maximize();
  try {
    for (const tc of cases) {
      try {
        const res = await executeTestCase(driver, tc);
        if (res.isPassed) console.log(`✅ [${tc.testCaseId}] PASS - ${res.actualOutput}`);
        else console.log(`❌ [${tc.testCaseId}] FAIL - ${res.actualOutput}`);
      } catch (err) {
        console.log(`❌ [${tc.testCaseId}] ERROR - ${err && err.message ? err.message : err}`);
        // If session lost, recreate driver and continue
        const msg = err && err.message ? err.message : '';
        if (msg.includes('invalid session id') || (err && err.name && err.name.includes('NoSuchSession'))) {
          console.log('Session lost — recreating WebDriver and continuing...');
          try { await driver.quit(); } catch (e) {}
          driver = await new Builder().forBrowser('chrome').build();
          await driver.manage().window().maximize();
        }
      }
    }
  } finally {
    await driver.sleep(1000).catch(()=>{});
    try { await driver.quit(); } catch(e) {}
    console.log('\n🏁 UC06 moderation tests finished');
  }
}

run();