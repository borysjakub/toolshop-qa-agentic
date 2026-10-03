import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

// Guards tests marked test.fail() for a known app bug (helper: tests/helpers/known-bug.ts).
// Playwright counts any failure of such a test as "expected". This reporter checks that the
// failure message contains every 'expected-error' annotation, i.e. that the test failed
// because of the known bug, not because of an outage or a broken test. Otherwise the run fails.

const ANSI = /\u001b\[[0-9;]*m/g;

// Colours off, runs of spaces collapsed (Playwright aligns "Locator:  ..." with extra spaces).
const normalize = (text: string) => text.replace(ANSI, '').replace(/[ \t]+/g, ' ');

class KnownBugGuard implements Reporter {
  private problems: string[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    if (test.expectedStatus !== 'failed' || result.status !== 'failed') return;

    const title = test.titlePath().filter(Boolean).slice(1).join(' › ');
    const expected = test.annotations
      .filter((annotation) => annotation.type === 'expected-error')
      .map((annotation) => annotation.description ?? '');
    if (expected.length === 0) {
      this.problems.push(`${title}\n  test.fail() without an 'expected-error' annotation (use knownBug()).`);
      return;
    }

    const message = normalize(
      result.errors.map((error) => `${error.message ?? ''}\n${error.value ?? ''}`).join('\n'),
    );
    const missing = expected.filter((text) => !message.includes(normalize(text)));
    if (missing.length > 0) {
      const firstLines = message.split('\n').filter(Boolean).slice(0, 6).join('\n    ');
      this.problems.push(
        `${title}\n  failed, but not because of the known bug. Missing in the error: ${missing
          .map((text) => JSON.stringify(text))
          .join(', ')}\n  Actual error:\n    ${firstLines}`,
      );
    }
  }

  onEnd(_result: FullResult) {
    if (this.problems.length === 0) return;
    process.stderr.write(
      `\nKnown-bug guard: ${this.problems.length} test(s) marked test.fail() failed for another reason:\n\n` +
        `${this.problems.join('\n\n')}\n\n`,
    );
    // In GitHub Actions also an error annotation, so the reason shows in the run summary
    // (the HTML report still shows these tests as expected failures).
    if (process.env.GITHUB_ACTIONS) {
      for (const problem of this.problems) {
        const [title, ...details] = problem.split('\n');
        const text = details.join(' ').replace(/\s+/g, ' ').replace(/%/g, '%25');
        process.stdout.write(`::error title=Known-bug guard: ${title.replace(/[:,]/g, ' ')}::${text}\n`);
      }
    }
    return { status: 'failed' as const };
  }

  printsToStdio() {
    return false;
  }
}

export default KnownBugGuard;
