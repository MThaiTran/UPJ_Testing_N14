const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const csvPath = path.resolve('test_sele/data/14_system_test - Copy of UC-01.csv');
const content = fs.readFileSync(csvPath, 'utf8');

const lines = content.split('\n');
const headerIdx = lines.findIndex(l => l.startsWith('ID,'));
const csv = lines.slice(headerIdx).join('\n');

const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
const validRows = parsed.data.filter(r => r.ID && r.ID.startsWith('CRQ-'));

let output = `import dotenv from "dotenv";
import assert from "node:assert/strict";
import path from "node:path";
import authPage from "../pageobjects/auth.page.ts";
import createQuizPage from "../pageobjects/createQuiz.page.ts";

dotenv.config({ path: path.resolve(process.cwd(), "test_sele/.env") });

describe("Kiểm thử tạo Quiz đa luồng - Tự động Gen từ CSV", () => {
  const creatorEmail = process.env.TEST_CREATOR_EMAIL || "";
  const creatorPassword = process.env.TEST_CREATOR_PASSWORD || "";

  before(async () => {
    assert.ok(creatorEmail, "TEST_CREATOR_EMAIL is required in test_sele/.env");
    assert.ok(
      creatorPassword,
      "TEST_CREATOR_PASSWORD is required in test_sele/.env",
    );
    
    // Đăng nhập một lần trước tất cả các test
    await authPage.openLogin();
    await authPage.login(creatorEmail, creatorPassword);
  });

  // TRƯỚC MỖI TEST CASE: Đảm bảo đang ở trang tạo quiz
  beforeEach(async () => {
    await createQuizPage.open(); // Nhảy thẳng vào /creator/new
  });

`;

validRows.forEach((row, index) => {
  const id = row.ID.trim();
  const purpose = (row['Mục đích'] || '').replace(/'/g, "\\'").trim();
  const testData = (row['Test data'] || '').replace(/\n/g, ' ').trim();
  const expected = (row['Kết quả mong muốn'] || '').replace(/\n/g, ' ').trim();
  const tcName = `TC_${String(index + 1).padStart(2, '0')}`;

  let implementation = `    // Test data: ${testData}
    // Expected: ${expected}
    
    // TODO: Viết logic tự động hóa cho case này
    // await createQuizPage.selectQuizType("standard");
    // await createQuizPage.clickContinue();
    // ...
    console.log('✅ Chạy skeleton cho ${tcName}: ${id}');
`;

  // Provide some basic implementation for known cases if possible
  if (id === 'CRQ-CRI-06') {
      implementation = `    // Chọn loại Quiz
    await createQuizPage.selectQuizType("standard");
    await createQuizPage.clickContinue();

    // Điền thông tin Quiz hợp lệ
    await createQuizPage.fillQuizInfo({
      title: "Quiz test 001",
      description: "Mô tả hợp lệ cho quiz",
      category: "Lịch sử",
      difficulty: "easy",
      duration: 15,
    });
    await createQuizPage.clickContinue();
    
    // Kiểm tra UI không báo lỗi, tiếp tục thành công
    const addQuestionBtn = await $('[data-testid="create-quiz-add-question-btn"]');
    const isDisplayed = await addQuestionBtn.isDisplayed();
    assert.equal(isDisplayed, true, "Phải chuyển sang được bước thêm câu hỏi");
    
    console.log('✅ Đã chạy xong ${tcName}: ${id}');
`;
  } else if (id === 'CRQ-CRI-02') {
      implementation = `    // Chọn loại Quiz
    await createQuizPage.selectQuizType("standard");
    await createQuizPage.clickContinue();

    // Điền thông tin Quiz với tiêu đề rỗng
    await createQuizPage.fillQuizInfo({
      title: "", // Cố tình bỏ trống tiêu đề
      description: "Mô tả cho quiz thiếu tiêu đề",
      category: "Toán học",
      difficulty: "medium",
      duration: 10,
    });

    // Kiểm tra xem nút Continue có bị vô hiệu hóa hay không (chặn submit)
    const continueBtn = await $('[data-testid="create-quiz-continue-btn"]');
    const isEnabled = await continueBtn.isEnabled();
    
    // Nút Continue nên bị disable khi bỏ trống trường bắt buộc
    assert.equal(isEnabled, false, "Nút Tiếp tục phải bị vô hiệu hóa khi tiêu đề trống");
    
    console.log('✅ Đã kiểm tra chặn tạo quiz khi bỏ trống tiêu đề thành công (${tcName}: ${id}).');
`;
  }

  output += `  it('${tcName}: ${id} - ${purpose}', async () => {
${implementation}
  });\n\n`;
});

output += `});\n`;

fs.writeFileSync(path.resolve('test_sele/specs/create-quiz.e2e.ts'), output, 'utf8');
console.log('Generated create-quiz.e2e.ts with ' + validRows.length + ' test cases.');
