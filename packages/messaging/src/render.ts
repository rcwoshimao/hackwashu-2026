import { messageCopy } from "@ground-control/copy";

export function renderMessage(
  key: keyof typeof messageCopy,
  values: Readonly<Record<string, string | number>> = {},
): string {
  return messageCopy[key].replace(
    /\{([A-Za-z][A-Za-z0-9]*)\}/g,
    (_, name: string) => String(values[name] ?? ""),
  );
}

export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );
}
