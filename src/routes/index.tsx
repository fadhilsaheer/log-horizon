import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "@/components/sidebar";
import { Editor } from "@/components/editor";
import { ConfirmModal } from "@/components/confirm-modal";
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

  // Custom Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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

  const handleDelete = () => {
    console.log("delete trigger");
    if (id) {
      setDeleteTargetId(id);
    }
  };

  const handleDeleteFromSidebar = (entryId: string) => {
    setDeleteTargetId(entryId);
  };

  const executeDelete = async () => {
    console.log("delete implementation");
    if (!deleteTargetId) return;

    try {
      await invoke("delete_entry", { id: deleteTargetId });
      await refresh();
      if (id === deleteTargetId) {
        navigate({ search: {} });
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }

    setDeleteTargetId(null);
  };

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar
        entries={entries}
        activeId={id || null}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDeleteFromSidebar}
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
        onDelete={handleDelete}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={executeDelete}
        title="Delete Log"
        description="Are you sure you want to delete this entry? This action cannot be undone."
      />
    </div>
  );
}
