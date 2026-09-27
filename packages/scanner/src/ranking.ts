import {
  githubSearchMaxPages,
  githubSearchPageSize,
} from "../../../config/limits.ts";
import type { PublicGitHubPort, RankedRepo } from "./github.ts";

type Language = "JavaScript" | "TypeScript";
type Cursor = {
  language: Language;
  page: number;
  queue: RankedRepo[];
  exhausted: boolean;
};

async function refill(
  github: PublicGitHubPort,
  cursor: Cursor,
  maxPages: number,
): Promise<void> {
  if (cursor.queue.length > 0 || cursor.exhausted) return;
  if (cursor.page >= maxPages) {
    cursor.exhausted = true;
    return;
  }
  cursor.page += 1;
  const response = await github.topRepos(cursor.language, cursor.page);
  if (!response.ok) throw new Error(response.error.code);
  cursor.queue.push(...response.value);
  if (response.value.length < githubSearchPageSize) cursor.exhausted = true;
}

function highestStars(cursors: readonly Cursor[]): Cursor | undefined {
  let best: Cursor | undefined;
  for (const cursor of cursors) {
    const head = cursor.queue[0];
    if (head && (!best || head.stars > (best.queue[0]?.stars ?? -1)))
      best = cursor;
  }
  return best;
}

/**
 * Yields JavaScript and TypeScript repos in descending star order, fetching a
 * search page only when that language's queue runs out. Each search result is
 * already sorted by stars, so merging the queue heads gives the global order
 * without downloading the whole ranking up front.
 */
export async function* starRanking(
  github: PublicGitHubPort,
  maxPages = githubSearchMaxPages,
): AsyncGenerator<string> {
  const cursors: Cursor[] = (["JavaScript", "TypeScript"] as const).map(
    (language) => ({ language, page: 0, queue: [], exhausted: false }),
  );
  const seen = new Set<string>();
  for (;;) {
    for (const cursor of cursors) await refill(github, cursor, maxPages);
    const entry = highestStars(cursors)?.queue.shift();
    if (!entry) return;
    if (seen.has(entry.repo)) continue;
    seen.add(entry.repo);
    yield entry.repo;
  }
}
