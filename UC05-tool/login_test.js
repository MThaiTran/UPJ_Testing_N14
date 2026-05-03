import { Builder, By, until } from 'selenium-webdriver';
import fs from 'fs';
import readline from 'readline';

const SELECTORS = {
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'form button.w-full.bg-blue-600',
};

async function loadTestCases() {
  const fileStream = fs.createReadStream('tests/automation/data_test.csv');
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
    const [testCaseId, email, password, expectedBehavior, expectedText] = line.split(',');
    testCases.push({ testCaseId, email, password, expectedBehavior, expectedText });
  }
  return testCases;
}

async function performLogin(driver, email, password) {
  console.log('⌨️ Entering credentials...');
  if (email) {
    const emailInput = await driver.findElement(By.css(SELECTORS.emailInput));
    await emailInput.sendKeys(email);
  }

  if (password) {
    const passInput = await driver.findElement(By.css(SELECTORS.passwordInput));
    await passInput.sendKeys(password);
  }

  console.log('🖱️ Clicking login button...');
  const submitBtn = await driver.findElement(By.css(SELECTORS.submitButton));
  await submitBtn.click();
}

async function verifyLoginSuccess(driver) {
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return !currentUrl.includes('/login');
  }, 10000);
  const actualOutput = await driver.getCurrentUrl();
  return { isPassed: true, actualOutput };
}

async function verifyErrorMessage(driver, expectedText) {
  await driver.wait(async () => {
    try {
      const bodyElement = await driver.findElement(By.css('body'));
      const text = await bodyElement.getText();
      return text.includes(expectedText);
    } catch (err) {
      if (err.name === 'StaleElementReferenceError') return false;
      throw err;
    }
  }, 10000);
  return { isPassed: true, actualOutput: `Hiển thị thông báo: "${expectedText}"` };
}

async function verifyValidation(driver, tc) {
  await driver.sleep(7000);
  const bodyText = await driver.findElement(By.css('body')).getText();
  if (bodyText.includes(tc.expectedText)) {
    return { isPassed: true, actualOutput: `Báo lỗi rỗng: "${tc.expectedText}"` };
  } else {
    // Fallback: Check HTML5 validation message (required)
    const inputSelector = !tc.email ? SELECTORS.emailInput : SELECTORS.passwordInput;
    const inputEl = await driver.findElement(By.css(inputSelector));
    const valMsg = await inputEl.getAttribute("validationMessage");
    if (valMsg) {
      return { isPassed: true, actualOutput: `HTML5 Validation: "${valMsg}"` };
    }
  }
  return { isPassed: false, actualOutput: "Không tìm thấy thông báo lỗi validation" };
}

async function verifyResult(driver, tc) {
  console.log('🔍 Verifying result...');
  switch (tc.expectedBehavior) {
    case 'success':
      return await verifyLoginSuccess(driver);

    case 'error':
      return await verifyErrorMessage(driver, tc.expectedText);

    case 'validation':
      return await verifyValidation(driver, tc);

    default:
      throw new Error('Unknown expectedBehavior');
  }
}

async function cleanup(driver) {
  await driver.manage().deleteAllCookies();
  await driver.executeScript('window.localStorage.clear();');
  await driver.executeScript('window.sessionStorage.clear();');
}

async function executeTestCase(driver, tc) {
  console.log(`\n⏳ Đang chạy kịch bản: [${tc.testCaseId}]`);

  console.log('🌐 Opening login page...');
  await driver.get('https://datn-quizapp.web.app/login');
  await driver.sleep(2000);

  let isPassed = false;
  let actualOutput = '';

  try {
    await performLogin(driver, tc.email, tc.password);
    const result = await verifyResult(driver, tc);
    isPassed = result.isPassed;
    actualOutput = result.actualOutput;
  } catch (err) {
    actualOutput = `Lỗi ngoại lệ hoặc Timeout: ${err.message}`;
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
  console.log("🚀 Bắt đầu tiến trình Automation Test cho UC-05 (Login)...");

  const testCases = await loadTestCases();
  let driver = await new Builder().forBrowser('chrome').build();

  try {
    for (const tc of testCases) {
      await executeTestCase(driver, tc);
    }
  } finally {
    await driver.quit();
    console.log("\n🏁 Đã hoàn thành toàn bộ kịch bản Automation Test.");
  }
}

runTest();
