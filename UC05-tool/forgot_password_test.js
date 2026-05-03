import { Builder, By } from 'selenium-webdriver';
import fs from 'fs';
import readline from 'readline';

const SELECTORS = {
  emailInput: 'input[type="email"]',
  submitButton: 'form button[type="submit"]',
  backButton: 'button[type="button"]',
};

async function loadTestCases() {
  const fileStream = fs.createReadStream('tests/automation/data_forgot_password.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isFirstLine = true;
  const testCases = [];

  for await (const line of rl) {
    if (isFirstLine) {
      isFirstLine = false;
      continue;
    }
    const [testCaseId, email, expectedBehavior, expectedText] = line.split(',');
    testCases.push({ testCaseId, email, expectedBehavior, expectedText });
  }

  return testCases;
}

async function openForgotPasswordForm(driver) {
  await driver.get('https://datn-quizapp.web.app/login');
  await driver.sleep(1500);

  const forgotButtons = await driver.findElements(By.xpath("//button[contains(., 'Quên mật khẩu') or contains(., 'Forgot password?')]"));
  if (!forgotButtons.length) {
    throw new Error('Không tìm thấy nút Quên mật khẩu');
  }
  await forgotButtons[0].click();
  await driver.sleep(1000);
}

async function performForgotPassword(driver, email) {
  if (email) {
    await driver.findElement(By.css(SELECTORS.emailInput)).sendKeys(email);
  }
  await driver.findElement(By.css(SELECTORS.submitButton)).click();
}

async function verifyValidation(driver, tc) {
  if (tc.expectedText === 'validationMessage') {
    await driver.wait(async () => {
      try {
        const input = await driver.findElement(By.css(SELECTORS.emailInput));
        const validationMessage = await input.getAttribute('validationMessage');
        return !!validationMessage;
      } catch {
        return false;
      }
    }, 10000);

    const input = await driver.findElement(By.css(SELECTORS.emailInput));
    const validationMessage = await input.getAttribute('validationMessage');
    return { isPassed: true, actualOutput: `HTML5 Validation: "${validationMessage}"` };
  }

  const expected = tc.expectedText;
  await driver.wait(async () => {
    try {
      const bodyText = await driver.findElement(By.css('body')).getText();
      return bodyText.includes(expected);
    } catch {
      return false;
    }
  }, 10000);

  return { isPassed: true, actualOutput: `Hiển thị thông báo: "${expected}"` };
}

async function cleanup(driver) {
  await driver.manage().deleteAllCookies();
  await driver.executeScript('window.localStorage.clear();');
  await driver.executeScript('window.sessionStorage.clear();');
}

async function executeTestCase(driver, tc) {
  console.log(`\n⏳ Đang chạy kịch bản quên mật khẩu: [${tc.testCaseId}]`);

  let isPassed = false;
  let actualOutput = '';

  try {
    await openForgotPasswordForm(driver);
    await performForgotPassword(driver, tc.email);
    const result = await verifyValidation(driver, tc);
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
  console.log('🚀 Bắt đầu tiến trình Automation Test cho Quên mật khẩu (UC05)...');

  const testCases = await loadTestCases();
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    for (const tc of testCases) {
      await executeTestCase(driver, tc);
    }
  } finally {
    await driver.quit();
    console.log('\n🏁 Đã hoàn thành bộ test Quên mật khẩu.');
  }
}

runTest();