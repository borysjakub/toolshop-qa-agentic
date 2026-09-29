// PreToolUse hook: blocks Write/Edit (and the Playwright generator's write tool)
// that would add a fixed wait to a code file.
// Exit code 2 = Claude Code cancels the tool call and shows stderr to Claude.

import { readFileSync } from 'node:fs';

type ToolInput = {
  // Write / Edit / MultiEdit
  file_path?: string;
  content?: string;
  new_string?: string;
  edits?: { new_string?: string }[];
  // mcp__playwright-test__generator_write_test
  fileName?: string;
  code?: string;
};

const FORBIDDEN = /\bwaitForTimeout\s*\(/;
const CODE_FILE = /\.(ts|mts|cts|js|mjs|cjs)$/i;

const payload = JSON.parse(readFileSync(0, 'utf8')) as { tool_input?: ToolInput };
const input = payload.tool_input ?? {};
const filePath = (input.file_path ?? input.fileName ?? '').replace(/\\/g, '/');

// Only code files; skip the hooks folder so this script can mention the pattern.
if (!CODE_FILE.test(filePath) || filePath.includes('/.claude/hooks/')) {
  process.exit(0);
}

const newText = [
  input.content,
  input.new_string,
  input.code,
  ...(input.edits ?? []).map((edit) => edit.new_string),
].join('\n');

if (FORBIDDEN.test(newText)) {
  process.stderr.write(
    `Blocked: ${filePath} would contain waitForTimeout(). ` +
      'CLAUDE.md forbids fixed waits. Use a web-first assertion ' +
      '(e.g. await expect(locator).toBeVisible()) or wait for a specific event ' +
      '(page.waitForResponse, page.waitForURL) instead.\n',
  );
  process.exit(2);
}
