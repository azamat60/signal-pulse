import type { Source, Topic } from "../domain/types";

type Props = {
  topic: Topic | null;
};

const SOURCE_LABELS: Record<Source, string> = {
  hn: "HN",
  reddit: "Reddit",
  github: "GitHub",
  arxiv: "arXiv",
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function maxTimelineCount(topic: Topic): number {
  return topic.timeline.reduce((max, b) => Math.max(max, b.count), 1);
}

export function TopicDetailPanel({ topic }: Props) {
  if (!topic) {
    return (
      <aside className="detail-panel detail-empty">
        <p>Select a topic to inspect related items, timeline, and source breakdown.</p>
      </aside>
    );
  }

  const maxCount = maxTimelineCount(topic);

  return (
    <aside className="detail-panel">
      <header>
        <h2>{topic.label}</h2>
        <p>Last updated {dateFormatter.format(topic.lastUpdated)}</p>
      </header>

      <section className="detail-block">
        <h3>Source breakdown</h3>
        <div className="source-breakdown">
          {topic.sources.map((source) => (
            <div key={`${topic.id}-${source}-score`} className={`source-${source}`}>
              <span className={`source-tag source-${source}`}>{SOURCE_LABELS[source]}</span>
              <strong>{topic.sourceBreakdown[source].toFixed(1)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="detail-block">
        <h3>Timeline of mentions</h3>
        <div className="timeline">
          {topic.timeline.map((bucket) => (
            <div key={`${topic.id}-${bucket.bucket}`} className="timeline-row">
              <span>{dateFormatter.format(new Date(bucket.bucket))}</span>
              <div className="timeline-bar-wrap">
                <div
                  className="timeline-bar"
                  style={{ width: `${Math.round((bucket.count / maxCount) * 100)}%` }}
                />
              </div>
              <strong>{bucket.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="detail-block">
        <h3>Related items</h3>
        <ul className="item-list">
          {topic.relatedItems.map((item) => (
            <li key={`${topic.id}-${item.url}`}>
              <small className={`source-tag source-${item.source}`}>{SOURCE_LABELS[item.source]}</small>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
              <span>{dateFormatter.format(item.timestamp)}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
