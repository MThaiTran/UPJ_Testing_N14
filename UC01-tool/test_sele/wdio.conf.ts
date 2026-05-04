import type { Options } from "@wdio/types";
import path from "node:path";

const rootDir = process.cwd();

export const config: Options.Testrunner = {
  runner: "local",
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      transpileOnly: true,
      project: path.resolve(rootDir, "test_sele/tsconfig.json"),
    },
  },
  specs: [path.resolve(rootDir, "test_sele/specs/**/*.e2e.ts")],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "chrome",
      "goog:chromeOptions": {
        args: ["--window-size=1440,900"],
      },
    },
  ],
  logLevel: "info",
  bail: 0,
  baseUrl: process.env.APP_BASE_URL || "http://localhost:5173",
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 2,
  services: ["chromedriver"],
  framework: "mocha",
  reporters: [
    "spec",
    [
      "allure",
      {
        outputDir: "allure-results",
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
    [
      "json",
      {
        outputDir: "./test_sele/reports",
        outputFile: "results-summary.json",
      },
    ],
  ],
  mochaOpts: {
    ui: "bdd",
    timeout: 120000,
  },
  before: async () => {
    await browser.maximizeWindow();
  },
  afterTest: async (_test, _context, result) => {
    if (!result.passed) {
      await browser.takeScreenshot();
    }
  },
};
