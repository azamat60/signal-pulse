export type Source = "hn" | "reddit" | "github" | "arxiv";

export type SourceItem = {
  source: Source;
  timestamp: Date;
  title: string;
  description?: string;
  url: string;
};

export type Trend = "up" | "down" | "stable";

export type Topic = {
  id: string;
  label: string;
  score: number;
  growth: number;
  sources: Source[];
  trend: Trend;
  lastUpdated: Date;
  relatedItems: SourceItem[];
  sourceBreakdown: Record<Source, number>;
  timeline: Array<{ bucket: string; count: number }>;
};

export type SourceFetchResult = {
  source: Source;
  ok: boolean;
  items: SourceItem[];
  error?: string;
  fetchedAt: Date;
};

export type SortMode = "popularity" | "growth" | "recency";
