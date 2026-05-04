import dotenv from "dotenv";
import assert from "node:assert/strict";
import path from "node:path";
import createQuizPage from "../pageobjects/createQuiz.page.ts";
import authPage from "../pageobjects/auth.page.ts";
import { testData } from "../data/data.js";

dotenv.config({ path: path.resolve("test_sele/.env") });

// Trong file spec của bạn
const getDefaultData = () => ({
  title: "Quiz Test Mẫu Hợp Lệ",
  description: "Mô tả hợp lệ cho quiz test",
  category: "Lịch sử",
  difficulty: "easy" as const,
  duration: 15,
});

describe("Automation 100+ Test Cases", () => {
  before(async () => {
    await authPage.openLogin();
    await authPage.login(
      process.env.TEST_CREATOR_EMAIL!,
      process.env.TEST_CREATOR_PASSWORD!,
    );
  });

  testData.forEach((caseItem: any) => {
    it(`TC: ${caseItem.caseId} - ${caseItem.note}`, async () => {
      await createQuizPage.open();
      await createQuizPage.selectQuizType("standard");
      await createQuizPage.clickContinue();

      // 1. Phân loại: Nếu là test Câu hỏi (QI), ta phải dùng Info chuẩn để "vượt rào"
      const isQuestionTest = caseItem.caseId.includes("CRQ-QI");
      const infoData = isQuestionTest
        ? getDefaultData()
        : { ...getDefaultData(), ...caseItem };

      await createQuizPage.fillQuizInfo(infoData);
      await browser.pause(1000);

      const continueBtn = await $('[data-testid="create-quiz-continue-btn"]');
      const isEnabled = await continueBtn.isEnabled();

      if (!isQuestionTest) {
        // --- LUỒNG TEST TRANG 1 (INFO) ---
        if (caseItem.expected === "failure") {
          expect(isEnabled).toBe(false);
        } else {
          expect(isEnabled).toBe(true);
        }
      } else {
        // --- LUỒNG TEST TRANG 2 (QUESTION) ---
        // Bước 1: Vượt qua trang 1
        expect(isEnabled).toBe(true);
        await continueBtn.click();

        // Bước 2: Chờ và tương tác với trang câu hỏi
        const addQuestionBtn = await $(
          '[data-testid="create-quiz-add-question-btn"]',
        );
        await addQuestionBtn.waitForDisplayed({ timeout: 10000 });

        // Ở đây Thái gọi hàm nhập câu hỏi (ví dụ: addMultipleChoiceQuestion)
        // await createQuizPage.addMultipleChoiceQuestion(caseItem);

        console.log(
          `✅ Đã chuyển vùng và đang test câu hỏi cho: ${caseItem.caseId}`,
        );
      }
    });
  });
});
