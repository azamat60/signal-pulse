const STOP_WORDS = new Set([
  "a",
  "about",
  "after",
  "all",
  "also",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "being",
  "but",
  "by",
  "can",
  "could",
  "do",
  "for",
  "from",
  "get",
  "had",
  "has",
  "have",
  "how",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "just",
  "more",
  "new",
  "no",
  "not",
  "now",
  "of",
  "on",
  "or",
  "our",
  "out",
  "over",
  "s",
  "same",
  "so",
  "some",
  "than",
  "that",
  "the",
  "their",
  "there",
  "these",
  "this",
  "to",
  "up",
  "use",
  "using",
  "via",
  "was",
  "we",
  "were",
  "what",
  "when",
  "which",
  "who",
  "why",
  "will",
  "with",
  "you",
  "your",
]);

export function normalizeToken(token: string): string {
  let output = token.toLowerCase().trim();
  output = output.replace(/[^a-z0-9+#.-]/g, "");

  if (output.length <= 2 || STOP_WORDS.has(output)) {
    return "";
  }

  if (output.endsWith("ies") && output.length > 4) {
    output = `${output.slice(0, -3)}y`;
  } else if (output.endsWith("ing") && output.length > 5) {
    output = output.slice(0, -3);
  } else if (output.endsWith("ed") && output.length > 4) {
    output = output.slice(0, -2);
  } else if (output.endsWith("s") && output.length > 3) {
    output = output.slice(0, -1);
  }

  return STOP_WORDS.has(output) ? "" : output;
}

export function extractTerms(text: string): string[] {
  const raw = text
    .replace(/[()[\]{}:;!?/,]/g, " ")
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  const terms: string[] = [...raw];

  for (let i = 0; i < raw.length - 1; i += 1) {
    if (raw[i].length > 2 && raw[i + 1].length > 2) {
      terms.push(`${raw[i]} ${raw[i + 1]}`);
    }
  }

  return terms;
}

export function titleCase(input: string): string {
  return input
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
