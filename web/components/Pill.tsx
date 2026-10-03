/** A status word with its tone: the word always shows, the colour only helps. */
const TONES: Record<string, string> = { good: "good", watch: "watch", stop: "stop", none: "none" };
const VERDICT: Record<string, string> = { OK: "good", Watch: "watch", Stop: "stop", "Can't tell": "none" };

export function Pill({ tone, word, testId }: { tone: string; word: string; testId?: string }) {
  return (
    <span className={`pill ${TONES[tone] ?? "none"}`} data-testid={testId}>
      {word}
    </span>
  );
}

export function VerdictPill({ verdict }: { verdict: string | null }) {
  if (!verdict) return null;
  return (
    <span className={`pill ${VERDICT[verdict] ?? "none"}`} data-testid="verdict" data-verdict={verdict}>
      {verdict}
    </span>
  );
}
