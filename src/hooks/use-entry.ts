import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Entry } from "@/types/entry";

export function useEntry(id: string | null) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<{ id: string; title: string; content: string } | null>(null);

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
      if (saveTimeoutRef.current && pendingSaveRef.current) {
        clearTimeout(saveTimeoutRef.current);
        const { id: pendingId, title, content } = pendingSaveRef.current;
        invoke("save_entry", { id: pendingId, title, content }).catch(err => 
          console.error("Failed to background save entry:", err)
        );
        saveTimeoutRef.current = null;
        pendingSaveRef.current = null;
        setIsSaving(false);
      }
    };
  }, [id, loadEntry]);

  const save = useCallback((title: string, content: string) => {
    if (!id) return;
    
    setEntry((prev) => prev ? { ...prev, title, content } : null);
    pendingSaveRef.current = { id, title, content };

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsSaving(true);
        await Promise.all([
          invoke("save_entry", { id, title, content }),
          new Promise(resolve => setTimeout(resolve, 500)) // Ensure spinner is visible for at least 500ms
        ]);
      } catch (err) {
        console.error("Failed to save entry:", err);
      } finally {
        setIsSaving(false);
        pendingSaveRef.current = null;
        saveTimeoutRef.current = null;
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

  return { entry, loading, save, deleteEntry, isSaving };
}
