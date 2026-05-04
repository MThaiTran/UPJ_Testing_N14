import { describe, it, expect } from "vitest";
import {
  validateStep,
  type QuizFormData,
} from "../../../src/utils/createQuizValidation";

// ============================================
// Mock Data
// ============================================

const mockQuizBase: QuizFormData = {
  quizType: "standard",
  title: "Test Quiz",
  description: "Test Description",
  category: "general",
  difficulty: "easy",
  duration: 15,
  havePassword: "no-password",
  password: "",
  questions: [
    {
      id: "q1",
      text: "What is 2+2?",
      type: "multiple",
      answers: [
        { id: "a1", text: "4", isCorrect: true },
        { id: "a2", text: "5", isCorrect: false },
        { id: "a3", text: "3", isCorrect: false },
      ],
      points: 1,
    },
  ],
  resources: [],
};

// ============================================
// Unit Tests
// ============================================

describe("validateStep - Step 0 (Type Selection)", () => {
  it("nên trả về false khi chưa chọn loại quiz", () => {
    // TC ID: CRQ-VST-01
    const quiz = { ...mockQuizBase, quizType: "" as any };
    const result = validateStep(0, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi đã chọn loại standard", () => {
    // TC ID: CRQ-VST-02
    const quiz = { ...mockQuizBase, quizType: "standard" };
    const result = validateStep(0, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi đã chọn loại with-materials", () => {
    // TC ID: CRQ-VST-03
    const quiz = { ...mockQuizBase, quizType: "with-materials" };
    const result = validateStep(0, quiz);
    expect(result).toBe(true);
  });

  it.fails("nên trả về true cho loại quiz không có sẵn", () => {
    // TC ID: CRQ-VST-PLS
    // Fail test
    const quiz = { ...mockQuizBase, quizType: "what?" };
    const result = validateStep(0, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về unknown cho loại quiz rỗng/ null/ undefined", () => {
    // TC ID: CRQ-VST-PLS
    const quiz = { ...mockQuizBase, quizType: null };
    const result = validateStep(0, quiz);
    expect(result).toBe(false);
  });
});

describe("validateStep - Step 1 (Info Validation)", () => {
  it("nên trả về false khi tiêu đề trống", () => {
    // TC ID: CRQ-VST-04
    const quiz = { ...mockQuizBase, title: "" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi tiêu đề là null", () => {
    // TC ID: CRQ-VST-04
    const quiz = { ...mockQuizBase, title: null };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi tiêu đề là undefined", () => {
    // TC ID: CRQ-VST-04
    const quiz = { ...mockQuizBase, title: undefined };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi tiêu đề toàn khoảng trắng", () => {
    // Fail TC
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, title: "      " };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi mô tả trống", () => {
    // TC ID: CRQ-VST-05
    const quiz = { ...mockQuizBase, description: "" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi mô tả toàn khoảng trắng", () => {
    // Fail TC
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, description: "      " };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi category trống", () => {
    // TC ID: CRQ-VST-06
    const quiz = { ...mockQuizBase, category: "" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi category toàn khoảng trắng", () => {
    // Fail TC
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, category: "      " };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi category không hợp lệ", () => {
    // Fail TC
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, category: "Random cat" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi difficulty trống", () => {
    // TC ID: CRQ-VST-07
    const quiz = { ...mockQuizBase, difficulty: "" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi difficulty toàn khoảng trắng", () => {
    // Fail TC
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, difficulty: "      " };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi difficulty không hợp lệ", () => {
    // Fail TC
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, difficulty: "Invalid Difficulty" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi duration là chuỗi ký tự", () => {
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, duration: "text" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi duration là số âm", () => {
    // TC ID: CRQ-VST-PLUS
    const quiz = { ...mockQuizBase, duration: -1 };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi duration dưới 5 phút", () => {
    // TC ID: CRQ-VST-08
    const quiz = { ...mockQuizBase, duration: 4 };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi duration trên 120 phút", () => {
    // TC ID: CRQ-VST-09
    const quiz = { ...mockQuizBase, duration: 121 };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi duration là 5 phút (minimum)", () => {
    // TC ID: CRQ-VST-10
    const quiz = { ...mockQuizBase, duration: 5 };
    const result = validateStep(1, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi duration là 120 phút (maximum)", () => {
    // TC ID: CRQ-VST-11
    const quiz = { ...mockQuizBase, duration: 120 };
    const result = validateStep(1, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về false khi bật mật khẩu nhưng chưa nhập", () => {
    // TC ID: CRQ-VST-12
    const quiz = { ...mockQuizBase, havePassword: "password", password: "" };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi mật khẩu có toàn khoảng trắng", () => {
    // Fail TC
    // TC ID: CRQ-VST-13
    const quiz = {
      ...mockQuizBase,
      havePassword: "password",
      password: "      ",
    };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi mật khẩu dưới 6 ký tự", () => {
    // TC ID: CRQ-VST-13
    const quiz = {
      ...mockQuizBase,
      havePassword: "password",
      password: "12345",
    };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi mật khẩu đúng 6 ký tự", () => {
    // TC ID: CRQ-VST-14
    const quiz = {
      ...mockQuizBase,
      havePassword: "password",
      password: "123456",
    };
    const result = validateStep(1, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi mật khẩu trên 6 ký tự", () => {
    // TC ID: CRQ-VST-15
    const quiz = {
      ...mockQuizBase,
      havePassword: "password",
      password: "1234567890",
    };
    const result = validateStep(1, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi không bật mật khẩu", () => {
    // TC ID: CRQ-VST-16
    const quiz = { ...mockQuizBase, havePassword: "no-password", password: "" };
    const result = validateStep(1, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi tất cả thông tin đầy đủ và hợp lệ", () => {
    // TC ID: CRQ-VST-17
    const quiz = mockQuizBase;
    const result = validateStep(1, quiz);
    expect(result).toBe(true);
  });
});

describe("validateStep - Step 2 (Resources for with-materials)", () => {
  it("nên trả về false khi không có resources", () => {
    // TC ID: CRQ-VST-18
    const quiz = {
      ...mockQuizBase,
      quizType: "with-materials" as const,
      resources: [],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi có ít nhất 1 resource", () => {
    // TC ID: CRQ-VST-19
    const quiz = {
      ...mockQuizBase,
      quizType: "with-materials" as const,
      resources: [{ id: "r1", type: "video", title: "Tutorial" }],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi có nhiều resources", () => {
    // TC ID: CRQ-VST-20
    const quiz = {
      ...mockQuizBase,
      quizType: "with-materials" as const,
      resources: [
        { id: "r1", type: "video", title: "Tutorial" },
        { id: "r2", type: "document", title: "Guide" },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });
});

describe("validateStep - Step 2/3 (Questions Validation)", () => {
  it("nên trả về false khi không có câu hỏi", () => {
    // TC ID: CRQ-VST-21
    const quiz = { ...mockQuizBase, questions: [] };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi câu hỏi là null", () => {
    // Fail TC
    // TC ID: CRQ-VST-21
    const quiz = { ...mockQuizBase, questions: null };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi câu hỏi không có text", () => {
    // TC ID: CRQ-VST-22
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi points không hợp lệ: null", () => {
    // TC ID: CRQ-VST-23
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: null,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi points dưới 1", () => {
    // TC ID: CRQ-VST-23
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 0.5,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi points = 0", () => {
    // TC ID: CRQ-VST-23
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 0,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi points trên 100", () => {
    // TC ID: CRQ-VST-24
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 101,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi points là 1 (minimum)", () => {
    // TC ID: CRQ-VST-25
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi points là 100 (maximum)", () => {
    // TC ID: CRQ-VST-26
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 100,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về false khi multiple choice không có câu trả lời đúng", () => {
    // TC ID: CRQ-VST-27
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: false },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi multiple choice có đáp án không có text", () => {
    // TC ID: CRQ-VST-28
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "", isCorrect: false },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi multiple choice hợp lệ", () => {
    // TC ID: CRQ-VST-29
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is 2+2?",
          type: "multiple",
          answers: [
            { id: "a1", text: "4", isCorrect: true },
            { id: "a2", text: "5", isCorrect: false },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về false khi short_answer không có correctAnswer", () => {
    // TC ID: CRQ-VST-30
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is your name?",
          type: "short_answer",
          answers: [],
          points: 1,
          correctAnswer: "",
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi short_answer có correctAnswer", () => {
    // TC ID: CRQ-VST-31
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "What is your name?",
          type: "short_answer",
          answers: [],
          points: 1,
          correctAnswer: "John",
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về false khi ordering question có dưới 2 items", () => {
    // TC ID: CRQ-VST-32
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Order these items",
          type: "ordering",
          answers: [],
          points: 1,
          orderingItems: [{ id: "o1", text: "First", correctOrder: 1 }],
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi ordering question là null", () => {
    // TC ID: CRQ-VST-32
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Order these items",
          type: "ordering",
          answers: [],
          points: 1,
          orderingItems: null,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi ordering question có 2 items", () => {
    // TC ID: CRQ-VST-33
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Order these items",
          type: "ordering",
          answers: [],
          points: 1,
          orderingItems: [
            { id: "o1", text: "First", correctOrder: 1 },
            { id: "o2", text: "Second", correctOrder: 2 },
          ],
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về false khi matchingPairs là null", () => {
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          ...mockQuizBase.questions[0],
          type: "matching" as const,
          matchingPairs: null as any,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi matching question có dưới 2 pairs", () => {
    // TC ID: CRQ-VST-34
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Match items",
          type: "matching",
          answers: [],
          points: 1,
          matchingPairs: [{ id: "p1", left: "A", right: "1" }],
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi matching question có 2 pairs", () => {
    // TC ID: CRQ-VST-35
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Match items",
          type: "matching",
          answers: [],
          points: 1,
          matchingPairs: [
            { id: "p1", left: "A", right: "1" },
            { id: "p2", left: "B", right: "2" },
          ],
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về false khi fill_blanks không có textWithBlanks", () => {
    // TC ID: CRQ-VST-36
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Fill the blanks",
          type: "fill_blanks",
          answers: [],
          points: 1,
          textWithBlanks: "",
          blanks: [
            {
              id: "b1",
              position: 0,
              correctAnswer: "answer",
              acceptedAnswers: [],
              caseSensitive: false,
            },
          ],
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi fill_blanks không có blanks", () => {
    // TC ID: CRQ-VST-37
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Fill the blanks",
          type: "fill_blanks",
          answers: [],
          points: 1,
          textWithBlanks: "The ___ is blue",
          blanks: [],
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi fill_blanks có blanks = null", () => {
    // TC ID: CRQ-VST-37
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Fill the blanks",
          type: "fill_blanks",
          answers: [],
          points: 1,
          textWithBlanks: "The ___ is blue",
          blanks: null,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi fill_blanks hợp lệ", () => {
    // TC ID: CRQ-VST-38
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Fill the blanks",
          type: "fill_blanks",
          answers: [],
          points: 1,
          textWithBlanks: "The ___ is blue",
          blanks: [
            {
              id: "b1",
              position: 4,
              correctAnswer: "sky",
              acceptedAnswers: [],
              caseSensitive: false,
            },
          ],
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về false khi multimedia không có đáp án đúng", () => {
    // TC ID: CRQ-VST-39
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Choose the correct image",
          type: "multimedia",
          answers: [
            {
              id: "a1",
              text: "Image 1",
              isCorrect: false,
              imageUrl: "img1.jpg",
            },
            {
              id: "a2",
              text: "Image 2",
              isCorrect: false,
              imageUrl: "img2.jpg",
            },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi multimedia có đáp án trống hoàn toàn (không text/ảnh/âm thanh/video)", () => {
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          ...mockQuizBase.questions[0],
          type: "multimedia" as const,
          answers: [{ id: "a1", text: "", isCorrect: true }], // Thiếu mọi loại media
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về true khi multimedia có correct answer với text", () => {
    // TC ID: CRQ-VST-40
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Choose the correct image",
          type: "multimedia",
          answers: [
            {
              id: "a1",
              text: "Image 1",
              isCorrect: true,
              imageUrl: "img1.jpg",
            },
            {
              id: "a2",
              text: "Image 2",
              isCorrect: false,
              imageUrl: "img2.jpg",
            },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi multimedia có answer với audio URL thay vì text", () => {
    // TC ID: CRQ-VST-41
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Choose the correct audio",
          type: "multimedia",
          answers: [
            { id: "a1", text: "", isCorrect: true, audioUrl: "audio1.mp3" },
            { id: "a2", text: "", isCorrect: false, audioUrl: "audio2.mp3" },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi multimedia có answer với img URL thay vì text", () => {
    // TC ID: CRQ-VST-41
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Choose the correct image",
          type: "multimedia",
          answers: [
            { id: "a1", text: "", isCorrect: true, imageUrl: "img1.jpg" },
            { id: "a2", text: "", isCorrect: false, imageUrl: "img2.jpg" },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi multimedia có answer với video URL thay vì text", () => {
    // TC ID: CRQ-VST-41
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Choose the correct video",
          type: "multimedia",
          answers: [
            { id: "a1", text: "", isCorrect: true, videoUrl: "video1.mp4" },
            { id: "a2", text: "", isCorrect: false, videoUrl: "video2.mp4" },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi multimedia có answer với video URL thay vì text", () => {
    // TC ID: CRQ-VST-41
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Choose the correct video",
          type: "multimedia",
          answers: [
            { id: "a1", text: "", isCorrect: true, videoUrl: "video1.mp4" },
            { id: "a2", text: "", isCorrect: false, videoUrl: "video2.mp4" },
          ],
          points: 1,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi cho câu hỏi đúng sai hợp lệ", () => {
    // TC ID: CRQ-VST-42
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Question 1?",
          type: "boolean",
          answers: [
            { id: "a1", text: "Answer 1", isCorrect: true },
            { id: "a2", text: "Answer 2", isCorrect: false },
          ],
          points: 5,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi cho câu hỏi checkbox hợp lệ", () => {
    // TC ID: CRQ-VST-42
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Question 1?",
          type: "checkbox",
          answers: [
            { id: "a1", text: "Answer 1", isCorrect: true },
            { id: "a2", text: "Answer 2", isCorrect: true },
            { id: "a3", text: "Answer 3", isCorrect: false },
          ],
          points: 5,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi cho câu hỏi ảnh hợp lệ", () => {
    // TC ID: CRQ-VST-42
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Question 1?",
          type: "image",
          answers: [
            { id: "a1", text: "Answer 1", isCorrect: true },
            { id: "a2", text: "Answer 2", isCorrect: false },
          ],
          points: 5,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi cho câu hỏi audio hợp lệ", () => {
    // TC ID: CRQ-VST-42
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Question 1?",
          type: "audio",
          answers: [
            { id: "a1", text: "Answer 1", isCorrect: true },
            { id: "a2", text: "Answer 2", isCorrect: false },
          ],
          points: 5,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true khi cho câu hỏi video hợp lệ", () => {
    // TC ID: CRQ-VST-42
    const quiz = {
      ...mockQuizBase,
      questions: [
        {
          id: "q1",
          text: "Question 1?",
          type: "video",
          answers: [
            { id: "a1", text: "Answer 1", isCorrect: true },
            { id: "a2", text: "Answer 2", isCorrect: false },
          ],
          points: 5,
        },
      ],
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true (hợp lệ) khi gặp loại câu hỏi không xác định", () => {
    const quiz = {
      ...mockQuizBase,
      questions: [
        { ...mockQuizBase.questions[0], type: "unknown_type" as any },
      ],
    };
    const result = validateStep(2, quiz);
    // Vì default return false (không invalid), nên !invalidQuestion là true
    expect(result).toBe(true);
  });
});

describe("validateStep - Step 3/4 (Review)", () => {
  it("nên trả về true cho review step trong standard quiz", () => {
    // TC ID: CRQ-VST-43
    const quiz = mockQuizBase;
    const result = validateStep(3, quiz);
    expect(result).toBe(true);
  });

  it("nên trả về true cho review step trong with-materials quiz", () => {
    // TC ID: CRQ-VST-44
    const quiz = {
      ...mockQuizBase,
      quizType: "with-materials" as const,
      resources: [{ id: "r1", type: "video" }],
    };
    const result = validateStep(4, quiz);
    expect(result).toBe(true);
  });
});

describe("validateStep - Edge Cases", () => {
  it("nên trả về false khi stepIndex không tồn tại", () => {
    // TC ID: CRQ-VST-45
    const quiz = mockQuizBase;
    const result = validateStep(99, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi quizType undefined", () => {
    // TC ID: CRQ-VST-46
    const quiz = { ...mockQuizBase, quizType: undefined as any };
    const result = validateStep(1, quiz);
    expect(result).toBe(false);
  });

  it.fails("nên trả về false khi questions array là undefined", () => {
    // Fail TC
    // TC ID: CRQ-VST-49
    const quiz = { ...mockQuizBase, questions: undefined as any };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });

  it("nên trả về false khi resources array là undefined", () => {
    // TC ID: CRQ-VST-50
    const quiz = {
      ...mockQuizBase,
      quizType: "with-materials" as const,
      resources: undefined as any,
    };
    const result = validateStep(2, quiz);
    expect(result).toBe(false);
  });
});

describe("validateStep - phủ nhánh with-materials", () => {
  // Tạo một mock quiz loại standard nhanh
  const materialQuiz = { ...mockQuizBase, quizType: "with-materials" as const };

  it("phủ dòng 25 (Standard - Step 0)", () => {
    expect(validateStep(1, materialQuiz)).toBe(true);
  });

  it("phủ dòng 27 (Standard - Step 2)", () => {
    expect(validateStep(2, materialQuiz)).toBe(false);
  });

  it("phủ dòng 28 (Standard - Step 3)", () => {
    expect(validateStep(3, materialQuiz)).toBe(true);
  });

  it("phủ dòng 28 (Standard - Step 4)", () => {
    expect(validateStep(4, materialQuiz)).toBe(true);
  });

  it("phủ dòng 28: Nhánh thoát khỏi else (Index lạ)", () => {
    const result = validateStep(99, materialQuiz);
    expect(result).toBe(false);
  });
});
