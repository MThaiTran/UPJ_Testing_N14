# Automation Test Suite - Create Quiz

This suite implements the Selenium/WebDriver-based flow for quiz creation using WebdriverIO + TypeScript + Firebase Admin verification.

## Prerequisites

1. Install project dependencies in SrcCode root.
2. Add Firebase Admin key file at SrcCode/serviceAccountKey.json.
3. Create environment file from test_sele/.env.example to test_sele/.env.
4. Provide a creator/admin account in TEST_CREATOR_EMAIL and TEST_CREATOR_PASSWORD.

## Automatic Data Ingestion

The suite can auto-generate runnable test data from the UC source file:

- Source file: test_sele/data/14_system_test - UC-01.csv
- Generated create quiz CSV: test_sele/data/create-quiz-data.csv
- Generated normalized JSON for other suites: test_sele/data/generated/uc-01-normalized.json
- Generated rating datasets: test_sele/data/generated/uc-01-pass.json, test_sele/data/generated/uc-01-fail.json, test_sele/data/generated/uc-01-na.json

Create quiz selenium spec now reads directly from the UC source file and auto-maps fields at runtime:

- test_sele/specs/create-quiz.e2e.ts -> loadCreateQuizData('./test_sele/data/14_system_test - UC-01.csv')

Run manually:

```bash
npm run test:data:generate
```

`npm run wdio` and `npm run wdio:quiz` already run data generation automatically before tests.

## Run

Run all automation tests:

```bash
npm run wdio
```

Run only create quiz spec:

```bash
npm run wdio:quiz
```

Generate and open Allure report:

```bash
npm run report
```

## Included Features

- Data-driven input from CSV: test_sele/data/create-quiz-data.csv
- Auto-derived data from UC-01 source CSV before every run
- POM structure for login and create-quiz pages
- Firestore verification on collection quizzes
- Automatic rollback by deleting created quiz documents after each test
- Failure screenshots + Allure integration
