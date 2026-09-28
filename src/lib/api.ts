import { invoke, isTauri } from "@tauri-apps/api/core";
import type { Entry } from "@/types/entry";
export const desktop = isTauri();
export const demo =
  !desktop && new URLSearchParams(location.search).has("demo");
const now = new Date();
const day = (days: number) =>
  new Date(now.getTime() - days * 86400000).toISOString();
// The browser preview is explicitly labelled and ephemeral. It never touches a real diary.
let preview: Entry[] = demo
  ? [
      {
        id: "demo-1",
        kind: "freewrite",
        title: "A little room to think",
        content:
          "I took the longer way home today. No headphones, no particular reason to hurry.\n\nThere’s something about walking without a destination that makes a thought easier to follow. I kept coming back to the same thing: I don’t need to make something of every quiet moment.\n\nSometimes it’s enough to notice it.",
        created_at: day(0),
        updated_at: day(0),
        private: false,
        locked: false,
        deleted: false,
      },
      {
        id: "demo-2",
        kind: "pile",
        title: "Small things, lately",
        content: JSON.stringify({
          items: [
            {
              id: "a",
              text: "The first cup of coffee, before the day gets loud.",
              timestamp: now.getTime() - 86400000,
            },
            {
              id: "b",
              text: "A thought for later: make a little more space for things that don’t have an outcome.",
              timestamp: now.getTime() - 40000000,
            },
          ],
          draft: "",
        }),
        created_at: day(1),
        updated_at: day(1),
        private: false,
        locked: false,
        deleted: false,
      },
      {
        id: "demo-3",
        kind: "freewrite",
        title: "Private entry",
        content: "",
        created_at: day(3),
        updated_at: day(3),
        private: true,
        locked: true,
        deleted: false,
      },
    ]
  : [];
export async function api<T>(
  command: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (desktop) return invoke<T>(command, args);
  if (!demo)
    throw new Error("Open the desktop app to access your local diary.");
  let value: unknown;
  switch (command) {
    case "vault_status":
      value = { configured: true, unlocked: false };
      break;
    case "list_entries":
      value = preview
        .filter(
          (e) =>
            e.deleted === args.deleted &&
            (!args.query ||
              (!e.locked &&
                (e.title + e.content)
                  .toLowerCase()
                  .includes(String(args.query).toLowerCase()))),
        )
        .map((e) => ({ ...e, content: "" }));
      break;
    case "get_entry":
      value = preview.find((e) => e.id === args.id);
      break;
    case "create_entry": {
      if (args.private) throw Error("Privacy is available in the desktop app.");
      const entry: Entry = {
        id: crypto.randomUUID(),
        kind: args.kind as Entry["kind"],
        title: "",
        content: args.kind === "pile" ? '{"items":[],"draft":""}' : "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        private: false,
        locked: false,
        deleted: false,
      };
      preview = [entry, ...preview];
      value = entry;
      break;
    }
    case "save_entry":
      preview = preview.map((e) =>
        e.id === args.id
          ? { ...e, title: String(args.title), content: String(args.content) }
          : e,
      );
      break;
    case "trash_entry":
      preview = preview.map((e) =>
        e.id === args.id ? { ...e, deleted: Boolean(args.deleted) } : e,
      );
      break;
    case "purge_entry":
      preview = preview.filter((e) => e.id !== args.id);
      break;
    case "lock_vault":
    case "diary_activity":
      break;
    default:
      throw Error("This feature uses secure local storage in the desktop app.");
  }
  return structuredClone(value) as T;
}
