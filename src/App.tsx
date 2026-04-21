import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import "./App.css";
import { TopicDetailPanel } from "./components/TopicDetailPanel";
import { TopicTable } from "./components/TopicTable";
import { SourceHealth } from "./components/SourceHealth";
import { fetchAllSources } from "./data/sources";
import { aggregateTopics } from "./domain/aggregation";
import type { SortMode, Source, SourceFetchResult, SourceItem, Topic } from "./domain/types";

const POLL_MS = 90_000;

const LAST_UPDATED_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function applySort(topics: Topic[], mode: SortMode): Topic[] {
  const output = [...topics];
  if (mode === "growth") {
    output.sort((a, b) => b.growth - a.growth || b.score - a.score);
    return output;
  }
  if (mode === "recency") {
    output.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    return output;
  }
  output.sort((a, b) => b.score - a.score);
  return output;
}

function topicMatchesFilter(topic: Topic, filter: Set<Source>): boolean {
  return topic.sources.some((source) => filter.has(source));
}

function flattenItems(results: SourceFetchResult[]): SourceItem[] {
  return results.flatMap((result) => result.items);
}

function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [results, setResults] = useState<SourceFetchResult[]>([]);
  const [sourceFilter, setSourceFilter] = useState<Set<Source>>(
    () => new Set(["hn", "reddit", "github", "arxiv"])
  );
  const [sortMode, setSortMode] = useState<SortMode>("popularity");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previousScoreIndexRef = useRef<Record<string, number>>({});

  const refreshData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const nextResults = await fetchAllSources();
      const incomingItems = flattenItems(nextResults);

      const { topics: aggregated, nextScoreIndex } = aggregateTopics(
        incomingItems,
        previousScoreIndexRef.current
      );

      previousScoreIndexRef.current = nextScoreIndex;
      setResults(nextResults);
      setTopics(aggregated);
      setLastUpdated(new Date());
      setSelectedTopicId((prev) => {
        if (!prev) return aggregated[0]?.id ?? null;
        return aggregated.some((topic) => topic.id === prev) ? prev : aggregated[0]?.id ?? null;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unknown data loading error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
    const timer = window.setInterval(() => {
      void refreshData();
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [refreshData]);

  const filteredTopics = useMemo(() => {
    const list = topics.filter((topic) => topicMatchesFilter(topic, sourceFilter));
    return applySort(list, sortMode);
  }, [topics, sourceFilter, sortMode]);

  const selectedTopic = useMemo(
    () => filteredTopics.find((topic) => topic.id === selectedTopicId) ?? filteredTopics[0] ?? null,
    [filteredTopics, selectedTopicId]
  );

  const totalItems = useMemo(() => results.reduce((sum, result) => sum + result.items.length, 0), [results]);

  const toggleSource = (source: Source) => {
    setSourceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(source)) {
        if (next.size === 1) return next;
        next.delete(source);
        return next;
      }
      next.add(source);
      return next;
    });
  };

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">
            <span className="live-dot" />
            Realtime Internet Signals
          </p>
          <h1>Signal Pulse Dashboard</h1>
          <p className="subline">
            Topic-first intelligence from Hacker News, Reddit, GitHub, and arXiv.
          </p>
          <p className="top-author">Created by Azamat Altymyshev</p>
        </div>

        <div className="meta">
          <div className="meta-stats">
            <div className="meta-stat">
              <span className="meta-stat-label">Topics</span>
              <span className="meta-stat-value">{filteredTopics.length}</span>
            </div>
            <div className="meta-stat">
              <span className="meta-stat-label">Items</span>
              <span className="meta-stat-value">{totalItems}</span>
            </div>
          </div>
          <p className="meta-updated">
            Updated: <strong>{lastUpdated ? LAST_UPDATED_FORMATTER.format(lastUpdated) : "—"}</strong>
          </p>
          <button type="button" className="refresh" onClick={() => void refreshData()}>
            <RefreshCcw size={14} className="refresh-icon" />
            <span>Refresh now</span>
          </button>
        </div>
      </header>

      <SourceHealth results={results} />

      {errorMessage ? <p className="banner banner-error">Global refresh issue: {errorMessage}</p> : null}
      {isLoading ? <p className="banner">Loading sources...</p> : null}

      <section className="content-grid">
        <TopicTable
          topics={filteredTopics}
          activeTopicId={selectedTopic?.id ?? null}
          onSelect={setSelectedTopicId}
          sourceFilter={sourceFilter}
          onToggleSource={toggleSource}
          sortMode={sortMode}
          onSortChange={setSortMode}
        />

        <TopicDetailPanel topic={selectedTopic} />
      </section>

    </main>
  );
}

export default App;
