import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';
import readline from 'readline';

const SELECTORS = {
  emailInput: 'input[name="email"]',
  displayNameInput: 'input[name="displayName"]',
  passwordInput: 'input[name="password"]',
  confirmPasswordInput: 'input[name="confirmPassword"]',
  acceptTermsCheckbox: 'input[name="acceptTerms"]',
  submitButton: 'form button.w-full.bg-blue-600',
  toastContainer: '.Toastify__toast-body, .Toastify__toast, [role="alert"]',
  otpHeading: 'text=Email Verification',
};

// Map friendly keys (used in CSV) to actual Vietnamese messages from locales/vi/common.json
const EXPECTED_MESSAGES = {
  'email required': 'Email là bắt buộc',
  'email invalid': 'Email không hợp lệ',
  'display name required': 'Tên hiển thị là bắt buộc',
  'password required': 'Mật khẩu là bắt buộc',
  'password min length': 'Mật khẩu phải có ít nhất 8 ký tự',
  'password uppercase': 'Mật khẩu phải có ít nhất 1 chữ hoa',
  'password lowercase': 'Mật khẩu phải có ít nhất 1 chữ thường',
  'password number': 'Mật khẩu phải có ít nhất 1 số',
  'password special': 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)',
  'password mismatch': 'Mật khẩu không khớp',
  'terms required': 'Bạn phải đồng ý với điều khoản',
  'otp sent': 'Mã OTP đã được gửi đến'
};
async function loadTestCases() {
  const fileStream = fs.createReadStream('tests/automation/data_register.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isFirstLine = true;
  const testCases = [];

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    const [testCaseId, email, displayName, password, confirmPassword, acceptTerms, expectedBehavior, expectedText] = line.split(',');
    testCases.push({ testCaseId, email, displayName, password, confirmPassword, acceptTerms, expectedBehavior, expectedText });
  }
  return testCases;
}

async function performRegister(driver, tc) {
  console.log('🔄 Chuyển sang form Đăng ký...');
  const switchButtons = await driver.findElements(By.xpath("//button[contains(., 'Đăng ký') or contains(., 'Register') or contains(., 'Sign up') or contains(., 'Create New Account')]") );
  if (switchButtons.length > 0) {
    await switchButtons[0].click();
  } else {
    // Maybe the page is already on the register form (displayName input present)
    const displayEls = await driver.findElements(By.css(SELECTORS.displayNameInput));
    if (displayEls.length === 0) {
      throw new Error('Không tìm thấy nút chuyển sang form đăng ký');
    }
  }
  await driver.sleep(1000); // Chờ form đổi state

  console.log('⌨️ Đang nhập dữ liệu đăng ký...');
  if (tc.email) {
    await driver.findElement(By.css(SELECTORS.emailInput)).sendKeys(tc.email);
  }
  if (tc.displayName) {
    await driver.findElement(By.css(SELECTORS.displayNameInput)).sendKeys(tc.displayName);
  }
  if (tc.password) {
    await driver.findElement(By.css(SELECTORS.passwordInput)).sendKeys(tc.password);
  }
  if (tc.confirmPassword) {
    await driver.findElement(By.css(SELECTORS.confirmPasswordInput)).sendKeys(tc.confirmPassword);
  }
  if (tc.acceptTerms === 'true') {
    await driver.findElement(By.css(SELECTORS.acceptTermsCheckbox)).click();
  }

  console.log('🖱️ Bấm nút Đăng ký...');
  await driver.findElement(By.css(SELECTORS.submitButton)).click();
}

async function getVisibleText(driver) {
  const bodyText = await driver.findElement(By.css('body')).getText();
  const toastText = await driver
    .findElements(By.css(SELECTORS.toastContainer))
    .then(async (els) => {
      const texts = [];
      for (const el of els) {
        try {
          const text = await el.getText();
          if (text) texts.push(text);
        } catch {
          // ignore detached toast elements
        }
      }
      return texts.join(' | ');
    });

  return `${bodyText} ${toastText}`.trim();
}

async function verifyResult(driver, tc) {
  console.log('🔍 Kiểm tra kết quả...');
  if (tc.expectedBehavior === 'validation') {
    const key = (tc.expectedText || '').toLowerCase().trim();
    const expected = EXPECTED_MESSAGES[key] || key;

    await driver.wait(async () => {
      const visibleText = (await getVisibleText(driver)).toLowerCase();
      return visibleText.includes(expected.toLowerCase());
    }, 10000);

    const visibleText = await getVisibleText(driver);
    return { isPassed: true, actualOutput: `Validate hiển thị: "${visibleText.trim()}"` };
  }

  if (tc.expectedBehavior === 'otp_screen') {
    const storageKey = `otp_${(tc.email||'').toLowerCase().trim()}`;
    // Wait for sessionStorage key set by generateAndSendOTP()
    await driver.wait(async () => {
      try {
        const val = await driver.executeScript(`return window.sessionStorage.getItem('${storageKey}');`);
        return !!val;
      } catch {
        return false;
      }
    }, 10000);

    // Also check for OTP input boxes if available
    const otpInputs = await driver.findElements(By.css('input[inputmode="numeric"]'));
    if (otpInputs.length === 6) {
      return { isPassed: true, actualOutput: 'Đã chuyển sang màn OTP Verification với 6 ô nhập mã' };
    }
    return { isPassed: true, actualOutput: 'SessionStorage OTP tồn tại nhưng không tìm thấy 6 ô nhập mã' };
  }
  throw new Error('Chỉ test các case validation cho UC Đăng ký');
}

async function cleanup(driver) {
  await driver.manage().deleteAllCookies();
  await driver.executeScript('window.localStorage.clear();');
  await driver.executeScript('window.sessionStorage.clear();');
  await driver.executeScript('indexedDB.deleteDatabase("firebaseLocalStorageDb");');
}

async function executeTestCase(driver, tc) {
  console.log(`\n⏳ Đang chạy kịch bản ĐĂNG KÝ: [${tc.testCaseId}]`);
  
  await driver.get('https://datn-quizapp.web.app/login');
  await driver.sleep(2000);

  let isPassed = false;
  let actualOutput = '';

  try {
    await performRegister(driver, tc);
    const result = await verifyResult(driver, tc);
    isPassed = result.isPassed;
    actualOutput = result.actualOutput;
  } catch (err) {
    actualOutput = `Lỗi: ${err.message}`;
    isPassed = false;
  }

  if (isPassed) {
    console.log(`✅ [${tc.testCaseId}] PASSED - Kết quả: ${actualOutput}`);
  } else {
    console.log(`❌ [${tc.testCaseId}] FAILED - Kết quả: ${actualOutput} (Kỳ vọng: ${tc.expectedText})`);
  }

  await cleanup(driver);
}

async function runTest() {
  console.log("🚀 Bắt đầu tiến trình Automation Test cho Đăng ký (Form Validation)...");
  
  const testCases = await loadTestCases();
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    for (const tc of testCases) {
      await executeTestCase(driver, tc);
    }
  } finally {
    await driver.quit();
    console.log("\n🏁 Đã hoàn thành bộ test Đăng ký.");
  }
}

runTest();
