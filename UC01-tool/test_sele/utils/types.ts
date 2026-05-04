export interface CreateQuizTestCase {
  caseId: string;
  quizType: "standard" | "with-materials";
  titlePrefix: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  duration: number;
  question: string;
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  correctAnswerIndex: number;
  expected: "success" | "failure";
}
