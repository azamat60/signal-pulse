import type { SortMode, Source, Topic } from "../domain/types";

type Props = {
  topics: Topic[];
  activeTopicId: string | null;
  onSelect: (topicId: string) => void;
  sourceFilter: Set<Source>;
  onToggleSource: (source: Source) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
};

const SOURCE_LABELS: Record<Source, string> = {
  hn: "HN",
  reddit: "Reddit",
  github: "GitHub",
  arxiv: "arXiv",
};

function trendGlyph(trend: Topic["trend"]): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

export function TopicTable({
  topics,
  activeTopicId,
  onSelect,
  sourceFilter,
  onToggleSource,
  sortMode,
  onSortChange,
}: Props) {
  return (
    <section className="topic-section">
      <div className="toolbar">
        <div className="source-filters" role="group" aria-label="Filter by source">
          {Object.entries(SOURCE_LABELS).map(([source, label]) => {
            const castSource = source as Source;
            const selected = sourceFilter.has(castSource);
            return (
              <button
                key={source}
                type="button"
                className={`chip chip-${castSource} ${selected ? "chip-active" : ""}`}
                onClick={() => onToggleSource(castSource)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <label className="sort-select" htmlFor="sort-mode">
          <span>Sort:</span>
          <select
            id="sort-mode"
            value={sortMode}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
          >
            <option value="popularity">Popularity</option>
            <option value="growth">Growth</option>
            <option value="recency">Recency</option>
          </select>
        </label>
      </div>

      <div className="topic-table" role="listbox" aria-label="Topics">
        <div className="topic-head">
          <span>Topic</span>
          <span>Score</span>
          <span>Growth</span>
          <span>Sources</span>
          <span>Trend</span>
        </div>

        {topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className={`topic-row ${activeTopicId === topic.id ? "topic-row-active" : ""}`}
            onClick={() => onSelect(topic.id)}
          >
            <span className="topic-label">{topic.label}</span>
            <span>{topic.score.toFixed(1)}</span>
            <span className={topic.growth > 0 ? "growth-up" : topic.growth < 0 ? "growth-down" : ""}>
              {topic.growth > 0 ? `+${topic.growth.toFixed(1)}` : topic.growth.toFixed(1)}
            </span>
            <span className="source-badges">
              {topic.sources.map((source) => (
                <small key={`${topic.id}-${source}`} className={`source-badge source-${source}`}>
                  {SOURCE_LABELS[source]}
                </small>
              ))}
            </span>
            <span className={`trend trend-${topic.trend}`}>{trendGlyph(topic.trend)}</span>
          </button>
        ))}

        {topics.length === 0 ? <p className="empty-state">No topics for selected sources.</p> : null}
      </div>
    </section>
  );
}
