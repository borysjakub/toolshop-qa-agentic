// PreToolUse hook: blocks reading the source code of the app version under test
// (sprint5-with-bugs) and the list of intentional bugs. We test blind, like at work;
// the bug-free reference version (sprint5/) may be read as a specification.
// Exit code 2 = Claude Code cancels the tool call and shows stderr to Claude.

import { readFileSync } from 'node:fs';

const payload = JSON.parse(readFileSync(0, 'utf8')) as { tool_input?: Record<string, unknown> };
const input = payload.tool_input ?? {};

// Every string argument (file_path, path, pattern, glob, command, ...).
const text = Object.values(input)
  .filter((value): value is string => typeof value === 'string')
  .join('\n')
  .replace(/\\/g, '/');

// A path into the folder (with a slash after the name), not the SPRINT value or image names.
const FORBIDDEN = /sprint5-with-bugs\/|listOfBugs/i;

if (FORBIDDEN.test(text)) {
  process.stderr.write(
    'Blocked: the source code of sprint5-with-bugs and listOfBugs.md are off limits. ' +
      'Test the app by its behaviour (UI, API, database). Use the bug-free reference ' +
      'version in sprint5/ as the specification (see .claude/skills/jira-ticket/SKILL.md).\n',
  );
  process.exit(2);
}
