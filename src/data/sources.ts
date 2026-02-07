import type { SourceFetchResult, SourceItem } from "../domain/types";

const REQUEST_HEADERS: HeadersInit = {
  Accept: "application/json, text/plain, */*",
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: REQUEST_HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { Accept: "application/atom+xml, application/xml, text/xml, */*" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function safeDate(input: string | number): Date {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

async function fetchHackerNews(): Promise<SourceItem[]> {
  const [frontPage, latest] = await Promise.all([
    fetchJson<{ hits: Array<{ created_at: string; title: string; url: string | null }> }>(
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30"
    ),
    fetchJson<{
      hits: Array<{ created_at: string; title: string; url: string | null; story_url: string | null }>;
    }>("https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=40"),
  ]);

  const items = [...frontPage.hits, ...latest.hits].reduce<SourceItem[]>((acc, item) => {
    const urlCandidate =
      ("story_url" in item ? item.story_url ?? item.url : item.url) as string | null;

    if (!item.title || typeof urlCandidate !== "string" || urlCandidate.length === 0) {
      return acc;
    }

    acc.push({
      source: "hn",
      timestamp: safeDate(item.created_at),
      title: item.title,
      url: urlCandidate,
    });

    return acc;
  }, []);

  return dedupeByUrl(items);
}

async function fetchReddit(): Promise<SourceItem[]> {
  const json = await fetchJson<{
    data: {
      children: Array<{
        data: { title: string; selftext: string; permalink: string; created_utc: number };
      }>;
    };
  }>("https://www.reddit.com/r/programming+technology+MachineLearning+datascience/new.json?limit=60");

  return json.data.children
    .map((child) => ({
      source: "reddit" as const,
      timestamp: safeDate(child.data.created_utc * 1000),
      title: child.data.title,
      description: child.data.selftext?.slice(0, 220),
      url: `https://www.reddit.com${child.data.permalink}`,
    }))
    .filter((item) => Boolean(item.title));
}

async function fetchGithub(): Promise<SourceItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - 10);
  const from = since.toISOString().slice(0, 10);

  const json = await fetchJson<{
    items: Array<{
      full_name: string;
      description: string | null;
      html_url: string;
      pushed_at: string;
      stargazers_count: number;
    }>;
  }>(
    `https://api.github.com/search/repositories?q=created:>${from}&sort=stars&order=desc&per_page=40`
  );

  return json.items.map((repo) => ({
    source: "github" as const,
    timestamp: safeDate(repo.pushed_at),
    title: repo.full_name,
    description: `${repo.description ?? "No description"} | stars: ${repo.stargazers_count}`,
    url: repo.html_url,
  }));
}

async function fetchArxiv(): Promise<SourceItem[]> {
  const xml = await fetchText(
    "https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL&start=0&max_results=40&sortBy=submittedDate&sortOrder=descending"
  );

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const entries = Array.from(doc.querySelectorAll("entry"));

  return entries.reduce<SourceItem[]>((acc, entry) => {
    const title = entry.querySelector("title")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const summary =
      entry.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim().slice(0, 260) ?? "";
    const updated = entry.querySelector("updated")?.textContent ?? "";
    const url = entry.querySelector("id")?.textContent ?? "";

    if (!title || !url) {
      return acc;
    }

    acc.push({
      source: "arxiv",
      timestamp: safeDate(updated),
      title,
      description: summary,
      url,
    });

    return acc;
  }, []);
}

function dedupeByUrl(items: SourceItem[]): SourceItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
}

export async function fetchAllSources(): Promise<SourceFetchResult[]> {
  const tasks: Array<Promise<SourceFetchResult>> = [
    fetchHackerNews()
      .then((items) => ({ source: "hn" as const, ok: true, items, fetchedAt: new Date() }))
      .catch((error: Error) => ({
        source: "hn" as const,
        ok: false,
        items: [],
        error: error.message,
        fetchedAt: new Date(),
      })),
    fetchReddit()
      .then((items) => ({ source: "reddit" as const, ok: true, items, fetchedAt: new Date() }))
      .catch((error: Error) => ({
        source: "reddit" as const,
        ok: false,
        items: [],
        error: error.message,
        fetchedAt: new Date(),
      })),
    fetchGithub()
      .then((items) => ({ source: "github" as const, ok: true, items, fetchedAt: new Date() }))
      .catch((error: Error) => ({
        source: "github" as const,
        ok: false,
        items: [],
        error: error.message,
        fetchedAt: new Date(),
      })),
    fetchArxiv()
      .then((items) => ({ source: "arxiv" as const, ok: true, items, fetchedAt: new Date() }))
      .catch((error: Error) => ({
        source: "arxiv" as const,
        ok: false,
        items: [],
        error: error.message,
        fetchedAt: new Date(),
      })),
  ];

  return Promise.all(tasks);
}
