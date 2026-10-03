// Details for a test.fail() test that documents a known app bug (see CLAUDE.md):
// - 'issue': the bug report,
// - 'expected-error': text that must appear in the failure message.
// reporters/known-bug-guard.ts fails the run when such a test fails for any other reason
// (outage, bot protection, broken locator), so a known-bug test cannot "pass" by accident.
export function knownBug(bugReport: string, ...expectedError: [string, ...string[]]) {
  return {
    annotation: [
      { type: 'issue', description: bugReport },
      ...expectedError.map((text) => ({ type: 'expected-error', description: text })),
    ],
  };
}
