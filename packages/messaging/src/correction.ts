import type { ConfluencePort } from "@ground-control/sources";
import type { AppStore, RunClaim, RunRecord } from "@ground-control/store";
import { escapeHtml, renderMessage } from "./render.ts";
import type {
  AlertRecord,
  CorrectionPort,
  FixOutcome,
  Result,
} from "./types.ts";

function confluencePageId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = /\/pages\/(\d+)(?:\/|$)/.exec(parsed.pathname);
    const id = path?.[1] ?? parsed.searchParams.get("pageId");
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function comment(run: RunRecord, claim: RunClaim, publicUrl: string): string {
  const text = renderMessage("confluenceFooter", {
    url: `${publicUrl}/runs/${encodeURIComponent(run.id)}`,
    expected: claim.expected,
    actual: claim.actual,
  });
  return `<p>${escapeHtml(text)}</p>`;
}

export class ConfluenceCorrection implements CorrectionPort {
  constructor(
    private readonly confluence: ConfluencePort,
    private readonly publicUrl: string,
  ) {}

  async fix(
    alert: AlertRecord,
    run: RunRecord,
    appStore: AppStore,
  ): Promise<Result<FixOutcome>> {
    const delivered: string[] = [];
    const unavailable: string[] = [];
    for (const sourceId of alert.sourceIds) {
      const source = appStore.getSource(sourceId);
      if (source?.kind !== "confluence") {
        unavailable.push(sourceId);
        continue;
      }
      const pageId = confluencePageId(source.url);
      const claim = run.results.find(
        (item) => item.sourceId === sourceId && item.status === "fail",
      );
      if (!pageId || !claim) {
        unavailable.push(sourceId);
        continue;
      }
      const posted = await this.confluence.postFooterComment(
        pageId,
        comment(run, claim, this.publicUrl),
      );
      if (posted.ok) delivered.push(sourceId);
      else unavailable.push(sourceId);
    }
    return {
      ok: true,
      value: {
        verified: false,
        delivered,
        unavailable,
        pullRequestUrl: null,
        passedCheckCount: 0,
      },
    };
  }
}

export class UnavailableCorrection implements CorrectionPort {
  async fix(): Promise<Result<FixOutcome>> {
    return { ok: false, error: { code: "unavailable" } };
  }
}

export class RecordingCorrection implements CorrectionPort {
  readonly calls: { alert: AlertRecord; run: RunRecord }[] = [];
  constructor(private readonly outcome: FixOutcome) {}

  async fix(
    alert: AlertRecord,
    run: RunRecord,
    _appStore: AppStore,
  ): Promise<Result<FixOutcome>> {
    this.calls.push({ alert, run });
    return { ok: true, value: this.outcome };
  }
}
