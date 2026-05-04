interface QuizInfoInput {
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  duration: number;
}

interface QuestionInput {
  question: string;
  answers: [string, string, string, string];
}

class CreateQuizPage {
  public async open() {
    await browser.url("/creator/new");

    // Đợi 2 giây để xem có bị redirect về /my không
    await browser.pause(2000);
    const currentUrl = await browser.getUrl();

    if (currentUrl.includes("/creator/my")) {
      console.log("⚠️ Phát hiện bị đá về /my, đang quay lại /new...");
      await browser.url("/creator/new");
    }

    const standardTypeCard = await $('[data-testid="quiz-type-standard"]');
    await standardTypeCard.waitForDisplayed({ timeout: 15000 });
  }

  public async selectQuizType(
    type: "standard" | "with-materials",
  ): Promise<void> {
    const typeCard = await $(`[data-testid="quiz-type-${type}"]`);
    await typeCard.waitForDisplayed({ timeout: 15000 });
    await typeCard.click();
  }

  public async clickContinue(): Promise<void> {
    const continueBtn = await $('[data-testid="create-quiz-continue-btn"]');
    await continueBtn.waitForEnabled({ timeout: 15000 });
    await continueBtn.click();
  }

  public async fillQuizInfo(input: any): Promise<void> {
    const titleInput = await $('[data-testid="create-quiz-title-input"]');
    const descriptionEditor = await $(
      '[data-testid="create-quiz-description-editor"] .ql-editor',
    );
    const categorySelect = await $(
      '[data-testid="create-quiz-category-select"]',
    );
    const durationInput = await $('[data-testid="create-quiz-duration-input"]');

    // 1. Nhập Tiêu đề
    await titleInput.waitForDisplayed({ timeout: 10000 });
    await titleInput.click();
    await browser.keys(["Control", "a", "Backspace"]);
    await titleInput.addValue(String(input.title || ""));

    // 2. Nhập Mô tả (Dùng JavaScript để tránh treo editor)
    await descriptionEditor.waitForDisplayed({ timeout: 10000 });
    await browser.execute(
      (el, val) => {
        el.innerHTML = val;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      },
      descriptionEditor,
      String(input.description || "Mô tả chuẩn"),
    );

    // 3. 🔥 Xử lý Danh mục: Chờ cho đến khi có dữ liệu thực tế
    await categorySelect.waitForExist({ timeout: 10000 });

    // Đợi đến khi dropdown có nhiều hơn 1 option (loại bỏ trường hợp chỉ có placeholder)
    await browser.waitUntil(
      async () => {
        const options = await categorySelect.$$("option");
        return options.length > 1;
      },
      {
        timeout: 10000,
        timeoutMsg: "❌ Lỗi: Danh mục không load kịp từ server!",
      },
    );

    // Chọn danh mục theo văn bản hiển thị hoặc index
    try {
      // Ưu tiên chọn theo tên danh mục trong test data
      if (input.category) {
        await categorySelect.selectByVisibleText(input.category);
      } else {
        await categorySelect.selectByIndex(1);
      }
    } catch (e) {
      console.warn("⚠️ Không tìm thấy text chính xác, đang chọn theo Index 1");
      await categorySelect.selectByIndex(1);
    }

    // 4. Nhập Thời lượng (Xóa sạch hoàn toàn trước khi nhập)
    await durationInput.scrollIntoView();
    await durationInput.click();
    await browser.keys(["Control", "a", "Backspace"]);
    await durationInput.addValue(String(input.duration || "15"));

    // 5. Chốt hạ: Bấm Tab để React nhận diện toàn bộ form
    await browser.keys(["Tab"]);
    await browser.pause(1000);
  }

  public async addMultipleChoiceQuestion(input: QuestionInput): Promise<void> {
    const addQuestionBtn = await $(
      '[data-testid="create-quiz-add-question-btn"]',
    );
    await addQuestionBtn.waitForClickable({ timeout: 15000 });
    await addQuestionBtn.click();

    const questionInput = await $('input[data-testid$="-text"]');
    await questionInput.waitForDisplayed({ timeout: 15000 });
    await questionInput.setValue(input.question);

    const answerInputs = await $$('input[data-testid*="-answer-"]');
    if (answerInputs.length < 4) {
      throw new Error(
        "Expected at least 4 answer inputs for multiple choice question",
      );
    }

    for (let i = 0; i < 4; i += 1) {
      await answerInputs[i].setValue(input.answers[i]);
    }
  }

  public async publish(): Promise<void> {
    const publishButton = await $('[data-testid="create-quiz-publish-btn"]');
    await publishButton.waitForClickable({ timeout: 20000 });
    await publishButton.click();
  }
}

export default new CreateQuizPage();
