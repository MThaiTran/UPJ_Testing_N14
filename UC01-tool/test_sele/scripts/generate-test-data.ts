import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

type UcRow = Record<string, string>;

interface CreateQuizCase {
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

const SOURCE_FILE = "./test_sele/data/14_system_test - UC-01.csv";
const TARGET_CREATE_QUIZ_CSV = "./test_sele/data/create-quiz-data.csv";
const TARGET_NORMALIZED_JSON =
  "./test_sele/data/generated/uc-01-normalized.json";
const TARGET_PASS_JSON = "./test_sele/data/generated/uc-01-pass.json";
const TARGET_FAIL_JSON = "./test_sele/data/generated/uc-01-fail.json";
const TARGET_NA_JSON = "./test_sele/data/generated/uc-01-na.json";

function clean(value: string | undefined): string {
  return (value || "").replace(/^\uFEFF/, "").trim();
}

function unwrapAngleBrackets(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

function extractAfterColon(text: string, fallback: string): string {
  const idx = text.indexOf(":");
  if (idx === -1) {
    return fallback;
  }
  return unwrapAngleBrackets(text.slice(idx + 1).trim()) || fallback;
}

function parseDuration(value: string, fallback = 15): number {
  const match = value.match(/\d+/);
  if (!match) {
    return fallback;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapDifficulty(input: string): "easy" | "medium" | "hard" {
  const lower = input.toLowerCase();
  if (lower.includes("khó") || lower.includes("hard")) {
    return "hard";
  }
  if (lower.includes("trung") || lower.includes("medium")) {
    return "medium";
  }
  return "easy";
}

function parseUc01Rows(csvContent: string): UcRow[] {
  const lines = csvContent.split(/\r?\n/);
  const headerLineIndex = lines.findIndex((line) =>
    clean(line).startsWith("ID,"),
  );
  const tableContent =
    headerLineIndex >= 0 ? lines.slice(headerLineIndex).join("\n") : csvContent;

  const parsed = Papa.parse<UcRow>(tableContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => clean(header),
    transform: (value) => clean(value),
  });

  if (parsed.errors.length > 0) {
    throw new Error(`Failed to parse UC-01 CSV: ${parsed.errors[0].message}`);
  }

  return (parsed.data || []).filter((row) => clean(row.ID).startsWith("CRQ-"));
}

function selectRow(rows: UcRow[], id: string): UcRow | undefined {
  return rows.find((row) => clean(row.ID) === id);
}

function buildCreateQuizCases(rows: UcRow[]): CreateQuizCase[] {
  const titleRow = selectRow(rows, "CRQ-CRI-06");
  const descriptionRow = selectRow(rows, "CRQ-CRI-11");
  const categoryRow = selectRow(rows, "CRQ-CRI-15");
  const difficultyRow = selectRow(rows, "CRQ-CRI-21");
  const durationRow = selectRow(rows, "CRQ-CRI-30");
  const questionRow = selectRow(rows, "CRQ-QI-GE-24");

  const titlePrefix = extractAfterColon(
    clean(titleRow?.["Test data"]),
    "Auto Quiz from UC-01",
  );
  const description = extractAfterColon(
    clean(descriptionRow?.["Test data"]),
    "Mo ta tu dong tu UC-01",
  );
  const category = extractAfterColon(
    clean(categoryRow?.["Test data"]),
    "Lịch sử",
  );
  const difficulty = mapDifficulty(clean(difficultyRow?.["Test data"]));
  const duration = parseDuration(clean(durationRow?.["Test data"]), 15);
  const question = extractAfterColon(
    clean(questionRow?.["Test data"]),
    "Day la cau hoi duoc tao tu dong tu UC-01",
  );

  return [
    {
      caseId: "UC01_AUTO_STANDARD_PASS",
      quizType: "standard",
      titlePrefix,
      description,
      category,
      difficulty,
      duration,
      question,
      answerA: "Lua chon A",
      answerB: "Lua chon B",
      answerC: "Lua chon C",
      answerD: "Lua chon D",
      correctAnswerIndex: 0,
      expected: "success",
    },
    {
      caseId: "UC01_AUTO_WITH_MATERIALS_PASS",
      quizType: "with-materials",
      titlePrefix: `${titlePrefix} Materials`,
      description,
      category,
      difficulty,
      duration,
      question: `${question} (materials)`,
      answerA: "Lua chon A",
      answerB: "Lua chon B",
      answerC: "Lua chon C",
      answerD: "Lua chon D",
      correctAnswerIndex: 0,
      expected: "success",
    },
  ];
}

function writeCreateQuizCsv(cases: CreateQuizCase[]): void {
  const csv = Papa.unparse(cases, {
    header: true,
    columns: [
      "caseId",
      "quizType",
      "titlePrefix",
      "description",
      "category",
      "difficulty",
      "duration",
      "question",
      "answerA",
      "answerB",
      "answerC",
      "answerD",
      "correctAnswerIndex",
      "expected",
    ],
  });

  fs.writeFileSync(
    path.resolve(process.cwd(), TARGET_CREATE_QUIZ_CSV),
    `${csv}\n`,
    "utf8",
  );
}

function writeNormalizedJson(rows: UcRow[]): void {
  const payload = {
    source: SOURCE_FILE,
    totalRows: rows.length,
    generatedAt: new Date().toISOString(),
    rows: rows.map((row) => ({
      id: clean(row.ID),
      objective: clean(row["Mục đích"]),
      technique: clean(row["Kỹ thuật sử dụng"]),
      testType: clean(row["Loại test"]),
      steps: clean(row["Các bước thực hiện"]),
      testData: clean(row["Test data"]),
      expectedResult: clean(row["Kết quả mong muốn"]),
      actualResult: clean(row["Kết quả thực tế"]),
      rating: clean(row["Đánh giá"]),
      bugCount: clean(row["Số lỗi"]),
    })),
  };

  fs.writeFileSync(
    path.resolve(process.cwd(), TARGET_NORMALIZED_JSON),
    JSON.stringify(payload, null, 2),
    "utf8",
  );
}

function writeGroupedByRating(rows: UcRow[]): void {
  const toPayload = (rating: string) => ({
    source: SOURCE_FILE,
    rating,
    totalRows: rows.filter(
      (row) => clean(row["Đánh giá"]).toLowerCase() === rating.toLowerCase(),
    ).length,
    generatedAt: new Date().toISOString(),
    rows: rows
      .filter(
        (row) => clean(row["Đánh giá"]).toLowerCase() === rating.toLowerCase(),
      )
      .map((row) => ({
        id: clean(row.ID),
        objective: clean(row["Mục đích"]),
        testData: clean(row["Test data"]),
        expectedResult: clean(row["Kết quả mong muốn"]),
        actualResult: clean(row["Kết quả thực tế"]),
        bugCount: clean(row["Số lỗi"]),
      })),
  });

  fs.writeFileSync(
    path.resolve(process.cwd(), TARGET_PASS_JSON),
    JSON.stringify(toPayload("Pass"), null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.resolve(process.cwd(), TARGET_FAIL_JSON),
    JSON.stringify(toPayload("Fail"), null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.resolve(process.cwd(), TARGET_NA_JSON),
    JSON.stringify(toPayload("N/A"), null, 2),
    "utf8",
  );
}

function main(): void {
  const sourcePath = path.resolve(process.cwd(), SOURCE_FILE);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file does not exist: ${sourcePath}`);
  }

  const csvContent = fs.readFileSync(sourcePath, "utf8");
  const rows = parseUc01Rows(csvContent);
  const cases = buildCreateQuizCases(rows);

  writeCreateQuizCsv(cases);
  writeNormalizedJson(rows);
  writeGroupedByRating(rows);

  console.log(`Generated ${cases.length} create-quiz test cases from UC-01.`);
  console.log(`Normalized ${rows.length} UC-01 rows to JSON.`);
  console.log("Generated grouped UC datasets: pass/fail/na.");
}

main();
