import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Entry } from "@/types/entry";

export function useEntry(id: string | null) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);

  const loadEntry = useCallback(async (entryId: string) => {
    try {
      setLoading(true);
      const data = await invoke<Entry>("get_entry", { id: entryId });
      setEntry(data);
    } catch (err) {
      console.error("Failed to get entry:", err);
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadEntry(id);
    } else {
      setEntry(null);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [id, loadEntry]);

  const save = useCallback((title: string, content: string) => {
    if (!id) return;
    
    setEntry((prev) => prev ? { ...prev, title, content } : null);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await invoke("save_entry", { id, title, content });
      } catch (err) {
        console.error("Failed to save entry:", err);
      }
    }, 1000);
  }, [id]);

  const deleteEntry = useCallback(async () => {
    if (!id) return false;
    try {
      await invoke("delete_entry", { id });
      setEntry(null);
      return true;
    } catch (err) {
      console.error("Failed to delete entry:", err);
      return false;
    }
  }, [id]);

  return { entry, loading, save, deleteEntry };
}
