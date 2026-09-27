import { ok, snapshotFail } from "./result.ts";
import type { RepositorySnapshot, Result, RunnerError } from "./types.ts";

const sourceExtension = /\.(?:js|jsx|ts|tsx)$/i;
const ignoredSegment = /(?:^|\/)(?:node_modules|dist|build)(?:\/|$)/i;
const nonCode =
  /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/[\r\n\\])+\/[dgimsuvy]*/g;

function sourcePath(path: string): boolean {
  const slashPath = path.replaceAll("\\", "/");
  return sourceExtension.test(slashPath) && !ignoredSegment.test(slashPath);
}

function maskNonCode(text: string, keepBracketStrings: boolean): string {
  return text.replace(nonCode, (match, offset: number) => {
    const quote = match[0] === "'" || match[0] === '"';
    if (
      quote &&
      keepBracketStrings &&
      /\bprocess\.env\s*\[\s*$/.test(text.slice(0, offset))
    ) {
      return match;
    }
    return match.replace(/[^\r\n]/g, " ");
  });
}

function escaped(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function declaresName(code: string, name: string): boolean {
  const token = escaped(name);
  const declaration = new RegExp(
    `\\b(?:function|class|interface|type|enum|const|let|var)\\s+${token}\\b`,
  );
  const namedExport = new RegExp(`\\bexport\\s*\\{[^}]*\\b${token}\\b[^}]*\\}`);
  const commonJs = new RegExp(
    `\\b(?:module\\.exports|exports)\\.${token}\\s*=`,
  );
  return (
    declaration.test(code) || namedExport.test(code) || commonJs.test(code)
  );
}

function readsEnvironment(code: string, name: string): boolean {
  return environmentNames(code).includes(name);
}

function environmentNames(code: string): readonly string[] {
  const pattern =
    /\b(?:process|import\.meta)\.env\.([A-Za-z_][A-Za-z0-9_]*)\b|\bprocess\.env\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g;
  const names: string[] = [];
  for (const match of code.matchAll(pattern)) {
    const offset = match.index + match[0].length;
    const suffix = code.slice(offset).trimStart();
    const prefix = code.slice(0, match.index).trimEnd();
    if (/^=(?!=|>)/.test(suffix) || /\bdelete$/.test(prefix)) continue;
    const name = match[1] ?? match[2];
    if (name !== undefined) names.push(name);
  }
  return names;
}

export function matchingSourcePaths(
  snapshot: RepositorySnapshot,
  name: string,
  kind: "code_reference" | "env_var",
): Result<readonly string[], RunnerError> {
  const listed = snapshot.trackedPaths();
  if (!listed.ok) return snapshotFail(listed.error);
  const matches: string[] = [];
  for (const path of listed.value.filter(sourcePath)) {
    const read = snapshot.readText(path);
    if (!read.ok) return snapshotFail(read.error);
    if (read.value === null) continue;
    const code = maskNonCode(read.value, kind === "env_var");
    const found =
      kind === "env_var"
        ? readsEnvironment(code, name)
        : declaresName(code, name);
    if (found) matches.push(path);
  }
  return ok(matches);
}

export function undocumentedEnvironmentVariables(
  snapshot: RepositorySnapshot,
  documented: ReadonlySet<string>,
): Result<readonly { name: string; paths: readonly string[] }[], RunnerError> {
  const listed = snapshot.trackedPaths();
  if (!listed.ok) return snapshotFail(listed.error);
  const found = new Map<string, string[]>();
  for (const path of listed.value.filter(sourcePath)) {
    const read = snapshot.readText(path);
    if (!read.ok) return snapshotFail(read.error);
    if (read.value === null) continue;
    for (const name of environmentNames(maskNonCode(read.value, true))) {
      if (documented.has(name)) continue;
      const paths = found.get(name) ?? [];
      if (!paths.includes(path)) paths.push(path);
      found.set(name, paths);
    }
  }
  return ok(
    [...found]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, paths]) => ({ name, paths })),
  );
}
