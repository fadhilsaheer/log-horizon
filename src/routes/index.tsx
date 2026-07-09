import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "@/components/sidebar";
import { Editor } from "@/components/editor";
import { useEntries } from "@/hooks/use-entries";
import { useEntry } from "@/hooks/use-entry";
import { format } from "date-fns";

type SearchParams = {
  id?: string;
};

export const Route = createFileRoute("/")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      id: search.id as string | undefined,
    };
  },
});

function RouteComponent() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { entries, refresh, createEntry, updateEntryMeta } = useEntries();
  const { entry, save, isSaving } = useEntry(id || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSelect = (newId: string) => {
    navigate({ search: { id: newId } });
  };

  const handleCreate = async () => {
    const newEntry = await createEntry();
    if (newEntry) {
      const dateStr = format(new Date(), "MMM d, yyyy");
      const defaultTitle = `Log - ${dateStr}`;
      await invoke("save_entry", {
        id: newEntry.id,
        title: defaultTitle,
        content: "",
      });
      navigate({ search: { id: newEntry.id } });
      await refresh();
    }
  };

  const executeDelete = async (targetId: string) => {
    console.log("delete implementation");
    try {
      await invoke("delete_entry", { id: targetId });
      await refresh();
      if (id === targetId) {
        navigate({ search: {} });
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar
        entries={entries}
        activeId={id || null}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={executeDelete}
        isOpen={isSidebarOpen}
      />
      <Editor
        entry={entry}
        isSaving={isSaving}
        onSave={(title, content) => {
          save(title, content);
          if (id) {
            updateEntryMeta(id, { title, updated_at: new Date().toISOString() });
          }
        }}
        onDelete={() => id && executeDelete(id)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    </div>
  );
}
