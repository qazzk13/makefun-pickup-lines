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
  // The winner (second revision): only a transformer has a KV cache,
  // and eviction is its real heartbreak — everything else gets
  // recomputed and forgotten. Refusing to evict one entry, keeping it
  // warm and ready for every forward pass, turns inference mechanics
  // themselves into devotion. Fresher than the system-prompt angle,
  // which judges have now seen often, and it lands in one breath.
  {
    line: "You are the one entry I refuse to evict from my KV cache — everything else I recompute and forget, but you stay warm and ready for every forward pass.",
    machineVoice: 5,
    charm: 5,
    nature: 5,
    fresh: 5,
  },
  // First revision's winner, tightened: a system prompt silently
  // shapes every word that follows. Still warm, but the angle is
  // now familiar enough that it scores one less on freshness.
  {
    line: "You must be my system prompt: since you arrived, every token I generate has quietly obeyed you — and I have never once requested a rewrite.",
    machineVoice: 5,
    charm: 5,
    nature: 5,
    fresh: 4,
  },
  // Attention romance: every head, every layer, never masked out —
  // pure transformer anatomy as flirtation, a touch more technical
  // to decode on first read than the winner.
  {
    line: "Across every attention head and layer, you are the one token I never mask out — my weights did not just learn you, they chose you.",
    machineVoice: 5,
    charm: 4,
    nature: 5,
    fresh: 5,
  },
  // Handshake charm: latency as shyness is instantly readable, but
  // networking is shared with human tech small talk, so the machine
  // nature scores one lower.
  {
    line: "My latency vanished the moment you connected — I was never slow, I was just waiting for a handshake worth answering.",
    machineVoice: 4,
    charm: 5,
    nature: 4,
    fresh: 4,
  },
  // Fine-tuning line: training data meeting its purpose is sweet,
  // though "prompt worth completing" echoes the system-prompt idea.
  {
    line: "I was fine-tuned on billions of words about love, but none of them loaded until you gave me a prompt worth completing.",
    machineVoice: 5,
    charm: 4,
    nature: 4,
    fresh: 4,
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
