import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { CreateQuizTestCase } from "./types.ts";

type UcRow = Record<string, string>;

function parseNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clean(value: string | undefined): string {
  return (value || "").replace(/^\uFEFF/, "").trim();
}

function parseUcRows(csvContent: string): UcRow[] {
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
    throw new Error(`UC CSV parse error: ${parsed.errors[0].message}`);
  }

  return (parsed.data || []).filter((row) => clean(row.ID).startsWith("CRQ-"));
}

function extractBracketValues(value: string): string[] {
  const results: string[] = [];
  const regex = /<([^>]+)>/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    if (match[1]?.trim()) {
      results.push(match[1].trim());
    }
  }

  return results;
}

function extractAfterColon(value: string): string {
  const idx = value.indexOf(":");
  return idx >= 0 ? value.slice(idx + 1).trim() : value.trim();
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

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function getRowById(rows: UcRow[], id: string): UcRow | undefined {
  return rows.find((row) => clean(row.ID) === id);
}

function buildCreateQuizCasesFromUc(rows: UcRow[]): CreateQuizTestCase[] {
  const titleData = clean(getRowById(rows, "CRQ-CRI-06")?.["Test data"]);
  const descriptionData = clean(getRowById(rows, "CRQ-CRI-11")?.["Test data"]);
  const categoryDataPrimary = clean(
    getRowById(rows, "CRQ-CRI-15")?.["Test data"],
  );
  const categoryDataTransition = clean(
    getRowById(rows, "CRQ-CRI-18")?.["Test data"],
  );
  const difficultyDataPrimary = clean(
    getRowById(rows, "CRQ-CRI-21")?.["Test data"],
  );
  const difficultyDataTransition = clean(
    getRowById(rows, "CRQ-CRI-23")?.["Test data"],
  );
  const durationDataMin = clean(getRowById(rows, "CRQ-CRI-30")?.["Test data"]);
  const durationDataMax = clean(getRowById(rows, "CRQ-CRI-32")?.["Test data"]);

  const questionRow =
    getRowById(rows, "CRQ-QI-GE-24") ||
    rows.find((row) =>
      clean(row["Test data"]).toLowerCase().includes("nội dung câu hỏi"),
    );

  const titleCandidates = unique(
    [...extractBracketValues(titleData), extractAfterColon(titleData)].filter(
      Boolean,
    ),
  );

  const descriptionCandidates = unique(
    [
      ...extractBracketValues(descriptionData),
      extractAfterColon(descriptionData),
    ].filter(Boolean),
  );

  const categoryCandidatesRaw = unique(
    [
      ...extractBracketValues(categoryDataPrimary),
      ...extractBracketValues(categoryDataTransition),
      extractAfterColon(categoryDataPrimary),
      extractAfterColon(categoryDataTransition),
    ].filter(Boolean),
  );

  const difficultyCandidates = unique(
    [
      ...extractBracketValues(difficultyDataPrimary),
      ...extractBracketValues(difficultyDataTransition),
      extractAfterColon(difficultyDataPrimary),
      extractAfterColon(difficultyDataTransition),
    ]
      .filter(Boolean)
      .map(mapDifficulty),
  );

  const durationCandidates = unique(
    [
      parseNumber(extractAfterColon(durationDataMin), 5),
      parseNumber(extractAfterColon(durationDataMax), 120),
    ].filter((n) => Number.isFinite(n) && n >= 5 && n <= 120),
  );

  const questionRaw = clean(questionRow?.["Test data"]);
  const questionCandidates = unique(
    [
      ...extractBracketValues(questionRaw),
      extractAfterColon(questionRaw),
    ].filter(Boolean),
  );

  const title = titleCandidates[0] || "Auto Quiz from UC-01";
  const description = descriptionCandidates[0] || "Mo ta tu dong tu UC-01";
  const categories = categoryCandidatesRaw.slice(0, 2);
  const mappedCategories =
    categories.length > 0 ? categories : ["Lịch sử", "Toán học"];
  const difficulties =
    difficultyCandidates.length > 0 ? difficultyCandidates : ["easy", "hard"];
  const durations =
    durationCandidates.length > 0 ? durationCandidates : [5, 15];
  const question =
    questionCandidates[0] || "Cau hoi duoc sinh tu dong tu UC-01";

  const cases: CreateQuizTestCase[] = [];
  const quizTypes: Array<"standard" | "with-materials"> = [
    "standard",
    "with-materials",
  ];
  let counter = 1;

  for (const quizType of quizTypes) {
    for (const category of mappedCategories) {
      for (const difficulty of difficulties) {
        const duration = durations[(counter - 1) % durations.length];
        cases.push({
          caseId: `UC01_AUTO_${counter.toString().padStart(2, "0")}`,
          quizType,
          titlePrefix: `${title} ${quizType === "with-materials" ? "Materials" : "Standard"}`,
          description,
          category,
          difficulty,
          duration,
          question: `${question} #${counter}`,
          answerA: "Lua chon A",
          answerB: "Lua chon B",
          answerC: "Lua chon C",
          answerD: "Lua chon D",
          correctAnswerIndex: 0,
          expected: "success",
        });

        if (cases.length >= 8) {
          return cases;
        }

        counter += 1;
      }
    }
  }

  return cases;
}

function parseCreateQuizCsv(csvContent: string): CreateQuizTestCase[] {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
  }

  return (parsed.data || []).map((row) => ({
    caseId: row.caseId,
    quizType: (row.quizType as "standard" | "with-materials") || "standard",
    titlePrefix: row.titlePrefix,
    description: row.description,
    category: row.category,
    difficulty: (row.difficulty as "easy" | "medium" | "hard") || "easy",
    duration: parseNumber(row.duration, 15),
    question: row.question,
    answerA: row.answerA,
    answerB: row.answerB,
    answerC: row.answerC,
    answerD: row.answerD,
    correctAnswerIndex: parseNumber(row.correctAnswerIndex, 0),
    expected: (row.expected as "success" | "failure") || "success",
  }));
}

export function loadCreateQuizData(csvPath: string): CreateQuizTestCase[] {
  const absolutePath = path.resolve(process.cwd(), csvPath);
  const csvContent = fs.readFileSync(absolutePath, "utf8");

  // If source is UC-style CSV (with ID/Muc dich columns), auto-map into create-quiz test cases.
  if (csvContent.includes("ID,Mục đích") || csvPath.includes("UC-01")) {
    return buildCreateQuizCasesFromUc(parseUcRows(csvContent));
  }

  return parseCreateQuizCsv(csvContent);
}
