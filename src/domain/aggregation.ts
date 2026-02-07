import type { Source, SourceItem, Topic, Trend } from "./types";
import { extractTerms, titleCase } from "../utils/text";

type Cluster = {
  id: string;
  labelVotes: Record<string, number>;
  score: number;
  sources: Set<Source>;
  lastUpdated: Date;
  relatedItems: SourceItem[];
  sourceBreakdown: Record<Source, number>;
  timelineBuckets: Map<string, number>;
};

const SOURCE_WEIGHT: Record<Source, number> = {
  hn: 1.1,
  reddit: 1,
  github: 1.15,
  arxiv: 1.2,
};

function buildTimelineBucket(ts: Date): string {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

function getFreshnessWeight(ts: Date): number {
  const ageHours = Math.max(0, (Date.now() - ts.getTime()) / 36e5);
  if (ageHours <= 2) return 1.4;
  if (ageHours <= 8) return 1.2;
  if (ageHours <= 24) return 1;
  return 0.8;
}

function scoreToTrend(growth: number): Trend {
  if (growth > 0.55) return "up";
  if (growth < -0.55) return "down";
  return "stable";
}

function pickLabel(votes: Record<string, number>, fallback: string): string {
  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  return ranked.length === 0 ? titleCase(fallback) : titleCase(ranked[0][0]);
}

export function aggregateTopics(
  items: SourceItem[],
  previousScores: Record<string, number>
): { topics: Topic[]; nextScoreIndex: Record<string, number> } {
  const clusters = new Map<string, Cluster>();

  items.forEach((item) => {
    const terms = extractTerms(`${item.title} ${item.description ?? ""}`);
    if (terms.length === 0) return;

    Array.from(new Set(terms))
      .slice(0, 6)
      .forEach((term, idx) => {
        const scoreDelta = SOURCE_WEIGHT[item.source] * getFreshnessWeight(item.timestamp) * (idx < 2 ? 1 : 0.6);

        if (!clusters.has(term)) {
          clusters.set(term, {
            id: term,
            labelVotes: {},
            score: 0,
            sources: new Set<Source>(),
            lastUpdated: item.timestamp,
            relatedItems: [],
            sourceBreakdown: { hn: 0, reddit: 0, github: 0, arxiv: 0 },
            timelineBuckets: new Map(),
          });
        }

        const cluster = clusters.get(term);
        if (!cluster) return;

        cluster.score += scoreDelta;
        cluster.sources.add(item.source);
        cluster.lastUpdated = cluster.lastUpdated < item.timestamp ? item.timestamp : cluster.lastUpdated;
        cluster.labelVotes[term] = (cluster.labelVotes[term] ?? 0) + 1;
        cluster.relatedItems.push(item);
        cluster.sourceBreakdown[item.source] += scoreDelta;
        const bucket = buildTimelineBucket(item.timestamp);
        cluster.timelineBuckets.set(bucket, (cluster.timelineBuckets.get(bucket) ?? 0) + 1);
      });
  });

  const topics: Topic[] = [];
  const nextScoreIndex: Record<string, number> = {};

  Array.from(clusters.values())
    .filter((cluster) => cluster.relatedItems.length >= 2)
    .forEach((cluster) => {
      const score = Number(cluster.score.toFixed(2));
      const prev = previousScores[cluster.id] ?? score;
      const growth = Number((score - prev).toFixed(2));

      nextScoreIndex[cluster.id] = score;

      topics.push({
        id: cluster.id,
        label: pickLabel(cluster.labelVotes, cluster.id),
        score,
        growth,
        sources: Array.from(cluster.sources),
        trend: scoreToTrend(growth),
        lastUpdated: cluster.lastUpdated,
        relatedItems: cluster.relatedItems
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 18),
        sourceBreakdown: {
          hn: Number(cluster.sourceBreakdown.hn.toFixed(2)),
          reddit: Number(cluster.sourceBreakdown.reddit.toFixed(2)),
          github: Number(cluster.sourceBreakdown.github.toFixed(2)),
          arxiv: Number(cluster.sourceBreakdown.arxiv.toFixed(2)),
        },
        timeline: Array.from(cluster.timelineBuckets.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-8)
          .map(([bucket, count]) => ({ bucket, count })),
      });
    });

  topics.sort((a, b) => b.score - a.score);
  return { topics: topics.slice(0, 120), nextScoreIndex };
}
