export type EntryKind = "freewrite" | "pile";
export interface Entry {
  id: string;
  kind: EntryKind;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  private: boolean;
  locked: boolean;
  deleted: boolean;
}
export type EntryMeta = Entry;
export interface VaultStatus {
  configured: boolean;
  unlocked: boolean;
}
export interface Thought {
  id: string;
  text: string;
  timestamp: number;
}
export interface Pile {
  items: Thought[];
  draft: string;
}
export function readPile(content: string): Pile {
  const parsed: unknown = JSON.parse(content || '{"items":[],"draft":""}');
  const value = Array.isArray(parsed)
    ? { items: parsed, draft: "" }
    : (parsed as Pile);
  if (!value || !Array.isArray(value.items) || typeof value.draft !== "string")
    throw new Error(
      "This pile could not be read. Export or restore it before making changes.",
    );
  return {
    draft: value.draft,
    items: value.items.map((item, index) => {
      if (!item || typeof item.text !== "string")
        throw new Error("This pile contains an unreadable thought.");
      return {
        id: typeof item.id === "string" ? item.id : `legacy-${index}`,
        text: item.text,
        timestamp: typeof item.timestamp === "number" ? item.timestamp : 0,
      };
    }),
  };
}
export function entryText(entry: Entry): string {
  if (entry.kind === "freewrite") return entry.content;
  try {
    const p = readPile(entry.content);
    return [...p.items.map((i) => i.text), p.draft].join("\n");
  } catch {
    return "";
  }
}
