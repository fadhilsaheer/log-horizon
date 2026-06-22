import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EntryMeta } from "../types/entry";

export function useEntries() {
  const [entries, setEntries] = useState<EntryMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<EntryMeta[]>("list_entries");
      setEntries(data);
    } catch (err) {
      console.error("Failed to list entries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (): Promise<EntryMeta | null> => {
    try {
      const newEntry = await invoke<EntryMeta>("create_entry");
      await refresh();
      return newEntry;
    } catch (err) {
      console.error("Failed to create entry:", err);
      return null;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { entries, loading, refresh, createEntry };
}
