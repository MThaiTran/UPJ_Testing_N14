import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';
import readline from 'readline';

const SELECTORS = {
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'form button.w-full.bg-blue-600',
  modalConfirmButtonXPath: "//div[contains(@class, 'flex justify-end')]//button[contains(@class, 'bg-red-600')]"
};

async function loadTestCases() {
  const fileStream = fs.createReadStream('tests/automation/data_admin.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let first = true;
  const cases = [];
  for await (const line of rl) {
    if (first) { first = false; continue; }
    if (!line.trim()) continue;
    const [testCaseId, email, password, action, targetUser, expectedText] = line.split(',');
    cases.push({ testCaseId, email, password, action, targetUser, expectedText });
  }
  return cases;
}

async function executeTestCase(driver, tc) {
  console.log(`\n▶ Running admin test [${tc.testCaseId}] action=${tc.action}`);
  try {
    // === BƯỚC 1: ĐĂNG NHẬP ===
    await driver.get('https://datn-quizapp.web.app/login');
    await driver.wait(until.elementLocated(By.css(SELECTORS.emailInput)), 5000);
    
    if (tc.email) await driver.findElement(By.css(SELECTORS.emailInput)).sendKeys(tc.email);
    if (tc.password) await driver.findElement(By.css(SELECTORS.passwordInput)).sendKeys(tc.password);
    await driver.sleep(1000); 
    
    await driver.findElement(By.css(SELECTORS.submitButton)).click();
    await driver.wait(async () => {
      const url = await driver.getCurrentUrl();
      return !url.includes('/login');
    }, 10000, 'Lỗi đăng nhập');
    await driver.sleep(2000);

    // === BƯỚC 2: BAY THẲNG VÀO TRANG USERS ===
    await driver.get('https://datn-quizapp.web.app/admin/users');
    await driver.sleep(3000); 

    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes('/admin/users')) {
       return { isPassed: false, actualOutput: `Lỗi phân quyền: ${currentUrl}` };
    }

    // === BƯỚC 3: THỰC THI ACTION ===
    
    // CASE 1: SMOKE TEST
    if (tc.action === 'smoke') {
      const table = await driver.findElements(By.css('table'));
      let rows = 0;
      if (table.length > 0) {
        await driver.wait(until.elementLocated(By.css('table tbody tr')), 5000).catch(()=> {});
        rows = (await driver.findElements(By.css('table tbody tr'))).length;
      }
      await driver.sleep(2000);
      return { isPassed: true, actualOutput: `Bảng dữ liệu load OK. Số hàng: ${rows}` };
    }

    // CASE 2, 3, 4: GOM NHÓM TÌM USER DÀNH CHO ROLE / BAN / DELETE
    if (['role', 'ban', 'delete'].includes(tc.action)) {
      if (!tc.targetUser) return { isPassed: false, actualOutput: 'Thiếu email targetUser trong CSV' };

      const userRowXPath = `//tr[.//text()[contains(., '${tc.targetUser}')]]`;
      const rows = await driver.wait(until.elementsLocated(By.xpath(userRowXPath)), 5000).catch(() => []); 

      if (rows.length === 0) {
        return { isPassed: false, actualOutput: `Không tìm thấy user: ${tc.targetUser}` };
      }
      
      const targetRow = rows[0];

      try {
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", targetRow);
        await driver.sleep(1500); 

        if (tc.action === 'role') {
          // THAY ĐỔI: Sử dụng cách Click 2 chạm truyền thống thay vì sendKeys
          const selectElement = await targetRow.findElement(By.css('select'));
          
          // Chạm 1: Bấm mở danh sách
          await selectElement.click(); 
          await driver.sleep(1000); 
          
          // Chạm 2: Tìm và bấm chính xác vào thẻ <option> có giá trị mong muốn (ví dụ: "creator")
          const optionElement = await selectElement.findElement(By.css(`option[value="${tc.expectedText}"]`));
          await optionElement.click();
          
          await driver.sleep(1500); // Đợi React bắn sự kiện onChange và mở Modal

        } else if (tc.action === 'ban') {
          const banBtn = await targetRow.findElement(By.xpath('.//td[last()]//button[1]'));
          await driver.executeScript("arguments[0].click();", banBtn);
          await driver.sleep(1000);

        } else if (tc.action === 'delete') {
          const deleteBtn = await targetRow.findElement(By.xpath('.//td[last()]//button[contains(@class, "bg-red-100")]'));
          await driver.executeScript("arguments[0].click();", deleteBtn);
          await driver.sleep(1000);
        }
        
        // Đoạn này xử lý Modal Confirm chung
        const confirmBtn = await driver.wait(until.elementLocated(By.xpath(SELECTORS.modalConfirmButtonXPath)), 3000);
        await driver.executeScript("arguments[0].click();", confirmBtn);
        
        await driver.sleep(3000); 
        return { isPassed: true, actualOutput: `Thực hiện ${tc.action.toUpperCase()} thành công user [${tc.targetUser}]` };

      } catch (e) {
        return { isPassed: false, actualOutput: `Lỗi khi xử lý thao tác/Modal: ${e.message}` };
      }
    }

    return { isPassed: false, actualOutput: `Action '${tc.action}' không tồn tại` };
  } catch (err) {
    return { isPassed: false, actualOutput: `Lỗi hệ thống: ${err.message}` };
  } finally {
    await driver.manage().deleteAllCookies();
    await driver.executeScript('window.localStorage.clear();');
    await driver.executeScript('window.sessionStorage.clear();');
  }
}

async function run() {
  const cases = await loadTestCases();
  const driver = await new Builder().forBrowser('chrome').build();
  await driver.manage().window().maximize(); 

  try {
    for (const tc of cases) {
      const res = await executeTestCase(driver, tc);
      if (res.isPassed) console.log(`✅ [${tc.testCaseId}] PASS - ${res.actualOutput}`);
      else console.log(`❌ [${tc.testCaseId}] FAIL - ${res.actualOutput}`);
    }
  } finally {
    await driver.sleep(3000);
    await driver.quit();
    console.log('\n🏁 Admin tests finished');
  }
}

run();