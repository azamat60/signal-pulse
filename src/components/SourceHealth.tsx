import type { SourceFetchResult } from "../domain/types";

type Props = {
  results: SourceFetchResult[];
};

function sourceLabel(source: SourceFetchResult["source"]): string {
  if (source === "hn") return "HN";
  if (source === "reddit") return "Reddit";
  if (source === "github") return "GitHub";
  return "arXiv";
}

export function SourceHealth({ results }: Props) {
  return (
    <div className="health-row" role="status" aria-live="polite">
      {results.map((result) => (
        <div
          key={result.source}
          className={`health-pill source-${result.source} ${result.ok ? "health-ok" : "health-fail"}`}
        >
          <strong>{sourceLabel(result.source)}</strong>
          <span>{result.ok ? `${result.items.length} items` : result.error ?? "Failed"}</span>
        </div>
      ))}
    </div>
  );
}
