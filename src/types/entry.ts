export interface EntryMeta {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  kind: "freewrite" | "pile";
}

export interface Entry {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  content: string;
  kind: "freewrite" | "pile";
}
