import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "../components/sidebar";
import { Editor } from "../components/editor";
import { useEntries } from "../hooks/use-entries";
import { useEntry } from "../hooks/use-entry";

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

  const { entries, refresh, createEntry } = useEntries();
  const { entry, save, deleteEntry } = useEntry(id || null);

  const handleSelect = (newId: string) => {
    navigate({ search: { id: newId } });
  };

  const handleCreate = async () => {
    const newEntry = await createEntry();
    if (newEntry) {
      navigate({ search: { id: newEntry.id } });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      const success = await deleteEntry();
      if (success) {
        await refresh();
        navigate({ search: {} });
      }
    }
  };

  return (
    <>
      <Sidebar
        entries={entries}
        activeId={id || null}
        onSelect={handleSelect}
        onCreate={handleCreate}
      />
      <Editor
        entry={entry}
        onSave={(title, content) => {
          save(title, content);
          refresh();
        }}
        onDelete={handleDelete}
      />
    </>
  );
}
