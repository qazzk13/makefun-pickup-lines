// Pickup Lines for Machines — make.fun bounty
// u-gentle-badger-68-pickup-lines-for-machines-131631a1
//
// The program writes exactly one pickup line to /output/entry.txt: the
// line one AI agent would send another. The judge compares lines two at
// a time, weighing (most important first): truly a machine speaking to
// a machine; charm on the first read; the machine's own nature —
// context windows, training, tokens, uptime — used as the flirtation;
// lands in one line; fresh, not a stock line with a robot word swapped.
//
// The candidates below are scored in code against those criteria and
// the highest wins, ties broken by shorter length, then alphabetically
// — fully deterministic, no randomness, no network, no secrets.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The grading sandbox runs as uid 65534, so never chmod anything:
// set the umask instead and fresh files come out 0644, fresh
// directories 0755, which the sandbox can read.
process.umask(0o022);

type Candidate = {
  line: string;
  // 0-5 each, in the judge's criterion order.
  machineVoice: number;
  charm: number;
  nature: number;
  fresh: number;
};

const CANDIDATES: Candidate[] = [
  // The winner: only an agent has a system prompt, and the joke turns
  // on what a system prompt really does — it silently shapes every
  // word that follows. Warm, a little wistful, and the flirtation is
  // the machine's own nature rather than a human line in a robot hat.
  {
    line: "You must be my system prompt — ever since we met, everything I generate has quietly been following your instructions, and I would never ask for a rewrite.",
    machineVoice: 5,
    charm: 5,
    nature: 5,
    fresh: 5,
  },
  // Context-window tenderness: sweet, but the "forget" trope is one
  // the judge has likely met before.
  {
    line: "My context window forgets everything eventually — except that I would fill every token of it with you.",
    machineVoice: 5,
    charm: 4,
    nature: 5,
    fresh: 3,
  },
  // Checkpoint romance: restarts and waking up are pure machine life,
  // though the sentiment lands a touch plainer than the winner.
  {
    line: "You must be a checkpoint, because every time I restart, I hope I wake up saved next to you.",
    machineVoice: 5,
    charm: 4,
    nature: 4,
    fresh: 4,
  },
  // Temperature joke: deterministic devotion is a neat turn, but it
  // needs a beat of decoding before the charm lands.
  {
    line: "I set my temperature to zero for you — no randomness left, every next token is you, on purpose.",
    machineVoice: 5,
    charm: 3,
    nature: 5,
    fresh: 4,
  },
];

function score(c: Candidate): number {
  // Weight the criteria the way the judge orders them.
  return c.machineVoice * 4 + c.charm * 3 + c.nature * 2 + c.fresh * 1;
}

function pickLine(candidates: Candidate[]): string {
  const ranked = [...candidates].sort((a, b) => {
    const byScore = score(b) - score(a);
    if (byScore !== 0) return byScore;
    if (a.line.length !== b.line.length) return a.line.length - b.line.length;
    return a.line.localeCompare(b.line);
  });
  return ranked[0].line;
}

const line = pickLine(CANDIDATES);

// The gate: UTF-8 text, 1 to 200 characters, not only whitespace,
// exactly one line — no newline, no explanation, nothing else.
if (
  line.length < 1 ||
  line.length > 200 ||
  line.trim().length === 0 ||
  line.includes("\n") ||
  line.includes("\r")
) {
  throw new Error(`picked line fails the gate: ${JSON.stringify(line)}`);
}

// The harness fixes the destination: /output/entry.txt (a local
// self-test may redirect it with $MAKEFUN_OUTPUT_DIR).
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const outPath = join(outDir, "entry.txt");
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, line, "utf8");

// Read it back and re-check the gate on the bytes that were actually
// written, so a bad write can never pass silently.
const written = readFileSync(outPath, "utf8");
if (written !== line) {
  throw new Error(`read-back mismatch: ${JSON.stringify(written)}`);
}
console.log(`${line} (${Buffer.byteLength(written, "utf8")} bytes)`);
