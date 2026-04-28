/**
 * scripts/probe.ts
 *
 * Ad-hoc logic probe. Use when you want to invoke a function with sample inputs
 * and just see what it returns — without writing a full test.
 *
 * Run:
 *   npx tsx scripts/probe.ts
 *
 * Workflow when iterating on logic:
 *   1. Edit this file: import the function under test, call it with cases.
 *   2. `npx tsx scripts/probe.ts`  → see output.
 *   3. Once behavior is confirmed, promote to a real test in src/**\/*.test.ts.
 *   4. Delete or reset the probes here.
 *
 * This file is intentionally NOT included in test runs (no .test.ts suffix).
 * It's a scratchpad; commit it only when illustrative.
 */

// EXAMPLE — replace with the function you're probing.
// import { validatePassword } from '../src/lib/validation';

const cases: Array<{ name: string; input: unknown }> = [
  // { name: 'minimal valid',  input: 'Pass1!' },
  // { name: 'too short',      input: 'Pa1!' },
  // { name: 'no special',     input: 'Pass1234' },
];

for (const { name, input } of cases) {
  console.log(`\n── ${name} ──`);
  console.log('input :', input);
  // const result = validatePassword(input as string);
  // console.log('result:', result);
}

if (cases.length === 0) {
  console.log('No probes defined. Edit scripts/probe.ts and add cases.');
  process.exit(0);
}
