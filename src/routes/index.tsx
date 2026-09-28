import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { api, demo, desktop } from "@/lib/api";
import { SaveQueue } from "@/lib/save-queue";
import {
  entryText,
  type Entry,
  type EntryKind,
  type VaultStatus,
} from "@/types/entry";
import { Icon } from "@/components/icon";
import { Modal } from "@/components/modal";
import { ChoiceGroup } from "@/components/choice-group";
import { SaveStatus } from "@/components/save-status";
import { PasswordDialog, PasswordChange } from "@/components/password-dialog";
import { PileEditor } from "@/components/pile-editor";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/")({ component: DiaryApp });
const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
const entryLabel = (entry: Entry) =>
  entry.locked
    ? "Private entry"
    : entry.title.trim() || dateLabel(entry.created_at);
type AuthAction =
  | { type: "unlock" }
  | { type: "create"; kind: EntryKind }
  | { type: "protect" };
type ConfirmAction = "export" | "public" | "purge" | null;

function DiaryApp() {
  const { theme, setTheme } = useTheme();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultStatus>({
    configured: false,
    unlocked: false,
  });
  const [query, setQuery] = useState("");
  const [trash, setTrash] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [settings, setSettings] = useState(false);
  const [newMenu, setNewMenu] = useState(false);
  const [moreMenu, setMoreMenu] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [auth, setAuth] = useState<AuthAction | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [concealed, setConcealed] = useState(false);
  const [font, setFont] = useState(
    () => localStorage.getItem("diary-writing-font-v2") || "system",
  );
  const [size, setSize] = useState(() =>
    Math.max(
      16,
      Math.min(24, Number(localStorage.getItem("diary-writing-size-v2")) || 18),
    ),
  );
  useEffect(() => {
    // Apply the new typography once, including to an already-open preview.
    if (localStorage.getItem("diary-design-version") !== "quiet-notes-1") {
      setFont("system");
      setSize(18);
      localStorage.setItem("diary-design-version", "quiet-notes-1");
    }
  }, []);
  const [wordCount, setWordCount] = useState(
    () => localStorage.getItem("diary-words") === "true",
  );
  const entryRef = useRef(entry);
  entryRef.current = entry;
  const epoch = useRef(0);
  const listRequest = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const lockInFlight = useRef<Promise<void> | null>(null);
  const concealRef = useRef(false);
  const saveQueue = useRef<SaveQueue | null>(null);
  if (!saveQueue.current)
    saveQueue.current = new SaveQueue(
      (d) => api("save_entry", { ...d }),
      (state, reason) => {
        setSaveState(state);
        if (reason)
          setError(
            `Couldn’t save. ${String(reason)} Your draft is still in memory; retry before closing.`,
          );
      },
    );
  const queue = saveQueue.current;
  const refresh = useCallback(async () => {
    const version = epoch.current;
    const request = ++listRequest.current;
    const [list, status] = await Promise.all([
      api<Entry[]>("list_entries", { query, deleted: trash }),
      api<VaultStatus>("vault_status"),
    ]);
    if (version === epoch.current && request === listRequest.current) {
      setEntries(list);
      setVault(status);
    }
  }, [query, trash]);
  const fail = (reason: unknown) => setError(String(reason));
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void refresh()
        .catch((e) => {
          if (active) fail(e);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 100);
    return () => {
      active = false;
      ++listRequest.current;
      clearTimeout(timer);
    };
  }, [refresh]);
  useEffect(() => {
    localStorage.setItem("diary-writing-font-v2", font);
    localStorage.setItem("diary-writing-size-v2", String(size));
    localStorage.setItem("diary-words", String(wordCount));
  }, [font, size, wordCount]);
  useEffect(() => {
    if (textarea.current) {
      textarea.current.style.height = "auto";
      textarea.current.style.height = `${textarea.current.scrollHeight}px`;
    }
  }, [entry?.content, entry?.id, size, font]);
  useEffect(() => {
    setMoreMenu(false);
    setShowTitle(false);
  }, [selected]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };
  const select = async (id: string) => {
    await queue.flush();
    const version = ++epoch.current;
    setLoading(true);
    setSelected(id);
    try {
      const next = await api<Entry>("get_entry", { id });
      if (version === epoch.current) {
        setEntry(next);
        entryRef.current = next;
        if (window.innerWidth < 760) setSidebar(false);
      }
    } finally {
      if (version === epoch.current) setLoading(false);
    }
  };
  const create = async (kind: EntryKind, privateEntry = false) => {
    setNewMenu(false);
    await queue.flush();
    if (privateEntry && !vault.unlocked) {
      setAuth({ type: "create", kind });
      return;
    }
    const version = ++epoch.current;
    const next = await api<Entry>("create_entry", {
      kind,
      private: privateEntry,
    });
    if (version !== epoch.current || concealRef.current) return;
    setEntry(next);
    entryRef.current = next;
    setSelected(next.id);
    setTrash(false);
    setQuery("");
    const list = await api<Entry[]>("list_entries", {
      query: "",
      deleted: false,
    });
    if (version === epoch.current) setEntries(list);
    if (window.innerWidth < 760) setSidebar(false);
  };
  const edit = (updates: Partial<Pick<Entry, "title" | "content">>) => {
    const old = entryRef.current;
    if (!old || old.locked || old.deleted || concealRef.current) return;
    const next = { ...old, ...updates };
    entryRef.current = next;
    setEntry(next);
    setSaveState("saving");
    setEntries((list) =>
      list.map((e) => (e.id === next.id ? { ...e, title: next.title } : e)),
    );
    queue.enqueue({ id: next.id, title: next.title, content: next.content });
  };
  const clearPrivate = () => {
    // Re-read canonical privacy flags: protection may have committed while a UI
    // response was still in flight. Never trust an old "ordinary" flag on lock.
    const version = ++epoch.current;
    const id = entryRef.current?.id ?? selected;
    setLoading(true);
    setSettings(false);
    setQuery("");
    setAuth(null);
    setConfirm(null);
    setMoreMenu(false);
    setNewMenu(false);
    setEntries([]);
    entryRef.current = null;
    setEntry(null);
    setVault((v) => ({ ...v, unlocked: false }));
    void Promise.all([
      api<Entry[]>("list_entries", { query: "", deleted: trash }),
      id ? api<Entry>("get_entry", { id }) : Promise.resolve(null),
    ])
      .then(([list, current]) => {
        if (version !== epoch.current) return;
        const pending = queue.pendingDraft();
        // A failed ordinary draft can stay visible. Locked private drafts stay
        // solely in the retry queue until successful authentication.
        const visible =
          current && !current.locked && pending?.id === current.id
            ? { ...current, title: pending.title, content: pending.content }
            : current;
        setEntries(list);
        setEntry(visible);
        entryRef.current = visible;
        setSelected(id);
      })
      .catch(fail)
      .finally(() => {
        if (version === epoch.current) setLoading(false);
      });
  };
  const lock = async () => {
    if (lockInFlight.current) return lockInFlight.current;
    concealRef.current = true;
    ++epoch.current;
    document.documentElement.classList.add("concealing");
    setConcealed(true);
    lockInFlight.current = (async () => {
      try {
        await queue.flush();
      } catch {
        /* Keep failed draft in the queue until the next successful unlock. */
      }
      try {
        await api("lock_vault");
        clearPrivate();
      } catch (e) {
        fail(e);
      } finally {
        concealRef.current = false;
        document.documentElement.classList.remove("concealing");
        setConcealed(false);
        lockInFlight.current = null;
      }
    })();
    return lockInFlight.current;
  };
  const actionsRef = useRef({ lock, clearPrivate, create, select, refresh });
  actionsRef.current = { lock, clearPrivate, create, select, refresh };
  useEffect(() => {
    let disposed = false;
    const cleanups: (() => void)[] = [];
    const onBlur = () => {
      if (desktop) void actionsRef.current.lock();
    };
    const onVisibility = () => {
      if (document.hidden) onBlur();
    };
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    let lastActivity = 0;
    const activity = () => {
      if (desktop && Date.now() - lastActivity > 15000) {
        lastActivity = Date.now();
        void api("diary_activity").catch(() => {});
      }
    };
    document.addEventListener("keydown", activity);
    document.addEventListener("pointerdown", activity);
    const shortcuts = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (document.querySelector("dialog[open]") && e.key.toLowerCase() !== "l")
        return;
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        void actionsRef.current
          .create(e.shiftKey ? "pile" : "freewrite")
          .catch(fail);
      }
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSidebar(true);
        setTimeout(() => search.current?.focus(), 0);
      }
      if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        void actionsRef.current.lock();
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        void queue.flush().catch(fail);
      }
      if (e.key === "\\") {
        e.preventDefault();
        setSidebar((v) => !v);
      }
    };
    window.addEventListener("keydown", shortcuts);
    if (desktop) {
      void listen("privacy-conceal", () => void actionsRef.current.lock()).then(
        (fn) => (disposed ? fn() : cleanups.push(fn)),
      );
      void listen("vault-locked", () => {
        actionsRef.current.clearPrivate();
      }).then((fn) => (disposed ? fn() : cleanups.push(fn)));
      void getCurrentWindow()
        .onCloseRequested(async (event) => {
          event.preventDefault();
          try {
            await queue.flush();
            await api("lock_vault");
            await getCurrentWindow().destroy();
          } catch (e) {
            fail(e);
          }
        })
        .then((fn) => (disposed ? fn() : cleanups.push(fn)));
    }
    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("keydown", activity);
      document.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", shortcuts);
    };
  }, [queue]);
  const authenticated = async (password: string) => {
    const action = auth;
    const version = epoch.current;
    await api("unlock_vault", { password, setup: !vault.configured });
    if (version !== epoch.current || concealRef.current) return;
    setVault({ configured: true, unlocked: true });
    await queue.flush();
    setAuth(null);
    setError("");
    if (action?.type === "create") {
      const next = await api<Entry>("create_entry", {
        kind: action.kind,
        private: true,
      });
      if (version !== epoch.current || concealRef.current) return;
      setEntry(next);
      entryRef.current = next;
      setSelected(next.id);
      setTrash(false);
      setQuery("");
    } else if (action?.type === "protect" && selected) {
      await api("set_private", { id: selected, private: true });
      await select(selected);
    } else if (selected) await select(selected);
    await refresh();
  };
  const protect = async () => {
    await queue.flush();
    if (!vault.unlocked) {
      setAuth({ type: "protect" });
      return;
    }
    await api("set_private", { id: selected, private: true });
    if (selected) await select(selected);
    await refresh();
  };
  const toggleTrash = async () => {
    await queue.flush();
    ++epoch.current;
    setEntry(null);
    entryRef.current = null;
    setSelected(null);
    setTrash(!trash);
    setQuery("");
  };
  const trashCurrent = async (deleted: boolean) => {
    await queue.flush();
    await api("trash_entry", { id: selected, deleted });
    ++epoch.current;
    setEntry(null);
    entryRef.current = null;
    setSelected(null);
    setMoreMenu(false);
    await refresh();
    setNotice(
      deleted
        ? "Moved to trash. You can restore it anytime."
        : "Entry restored to your diary.",
    );
  };
  const confirmAction = async () => {
    const action = confirm;
    setConfirm(null);
    await queue.flush();
    if (action === "export") {
      if (await api<boolean>("export_entry", { id: selected }))
        setNotice("Entry exported as readable Markdown.");
    }
    if (action === "public") {
      await api("set_private", { id: selected, private: false });
      if (selected) await select(selected);
      await refresh();
    }
    if (action === "purge") {
      await api("purge_entry", { id: selected });
      setEntry(null);
      entryRef.current = null;
      setSelected(null);
      await refresh();
    }
  };
  const text = entry && !entry.locked ? entryText(entry) : "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  let month = "";
  return (
    <div
      className={`diary-shell ${sidebar ? "sidebar-open" : ""}`}
      style={
        {
          "--writing-size": `${size}px`,
          "--writing-font":
            font === "serif"
              ? 'Georgia, "Times New Roman", serif'
              : font === "system"
                ? '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
                : 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        } as CSSProperties
      }
    >
      {demo && (
        <div className="demo-banner">
          Browser preview · sample diary · changes are not saved
        </div>
      )}
      <button
        className="sidebar-scrim"
        aria-label="Close entry list"
        aria-hidden={!sidebar}
        tabIndex={sidebar ? 0 : -1}
        onClick={() => setSidebar(false)}
      />
      <aside
        className="sidebar"
        aria-label="Diary entries"
        inert={!sidebar}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setSidebar(false);
            document
              .querySelector<HTMLButtonElement>("[data-sidebar-toggle]")
              ?.focus();
          }
        }}
      >
        <div className="brand">
          <span className="brand-mark">
            <Icon name="write" size={20} />
          </span>
          <span>Your entries</span>
          <button
            className="icon-button mobile-close"
            aria-label="Close entry list"
            onClick={() => setSidebar(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="new-entry-wrap">
          <button
            className="new-entry"
            onClick={() => setNewMenu(!newMenu)}
            aria-expanded={newMenu}
            disabled={busy}
          >
            <Icon name="plus" size={17} />
            New entry<span className="key-hint">⌘ N</span>
          </button>
          {newMenu && (
            <>
              <button
                className="menu-dismiss"
                aria-label="Close new entry menu"
                onClick={() => setNewMenu(false)}
              />
              <div className="popover new-popover">
                <button onClick={() => void run(() => create("freewrite"))}>
                  <Icon name="write" />
                  Freewrite
                </button>
                <button onClick={() => void run(() => create("pile"))}>
                  <Icon name="pile" />
                  Pile
                </button>
                <div className="menu-divider" />
                <button
                  onClick={() => void run(() => create("freewrite", true))}
                >
                  <Icon name="lock" />
                  Private freewrite
                </button>
                <button onClick={() => void run(() => create("pile", true))}>
                  <Icon name="lock" />
                  Private pile
                </button>
              </div>
            </>
          )}
        </div>
        <div className="search-field">
          <Icon name="search" size={16} />
          <input
            ref={search}
            aria-label="Search diary"
            placeholder="Find an entry…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
        <div className="list-heading">
          <span>
            {trash ? "Trash" : query ? "Search results" : "Your diary"}
          </span>
          <span>{entries.length}</span>
        </div>
        <nav
          className="entry-list"
          aria-label={trash ? "Trashed entries" : "Entries"}
        >
          {loading && !entries.length ? (
            <p className="list-empty">Opening your diary…</p>
          ) : !entries.length ? (
            <p className="list-empty">
              {query
                ? "No matching entries."
                : trash
                  ? "Nothing in the trash."
                  : "No entries yet."}
            </p>
          ) : (
            entries.map((item) => {
              const group = new Date(item.created_at).toLocaleDateString(
                undefined,
                { month: "long", year: "numeric" },
              );
              const show = month !== group;
              month = group;
              return (
                <div key={item.id}>
                  {show && <p className="month-label">{group}</p>}
                  <button
                    className={`entry-item ${selected === item.id ? "active" : ""}`}
                    aria-current={selected === item.id ? "page" : undefined}
                    onClick={() => void run(() => select(item.id))}
                    disabled={busy}
                  >
                    <span className="entry-icon">
                      <Icon
                        name={
                          item.private
                            ? "lock"
                            : item.kind === "pile"
                              ? "pile"
                              : "write"
                        }
                        size={16}
                      />
                    </span>
                    <span className="entry-summary">
                      <span className="entry-title">{entryLabel(item)}</span>
                      <span className="entry-subtitle">
                        {new Date(item.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                        <span>·</span>
                        {item.kind === "pile" ? "Pile" : "Freewrite"}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </nav>
        <div className="sidebar-bottom">
          <button
            onClick={() => void run(toggleTrash)}
            className={trash ? "selected-tool" : ""}
          >
            <Icon name={trash ? "back" : "trash"} size={16} />
            {trash ? "Back to diary" : "Trash"}
          </button>
          <button onClick={() => setSettings(true)}>
            <Icon name="settings" size={16} />
            Settings
          </button>
          <div className="local-caption">
            <span className="local-dot" />
            Stored on this computer
          </div>
        </div>
      </aside>
      <main className="main-pane">
        <header className="toolbar">
          <div className="toolbar-left">
            <button
              className="icon-button"
              data-sidebar-toggle
              aria-label={sidebar ? "Hide entry list" : "Show entry list"}
              title="Toggle sidebar (⌘ \\)"
              onClick={() => setSidebar(!sidebar)}
            >
              <Icon name="panel" />
            </button>
          </div>
          <div className="toolbar-right">
            {vault.unlocked && (
              <button
                className="icon-button"
                aria-label="Lock private entries"
                onClick={() => void lock()}
                title="Lock private entries (⌘ L)"
              >
                <Icon name="lock" size={15} />
              </button>
            )}
            {entry && !entry.locked && (
              <>
                <div className="more-wrap">
                  <button
                    className="icon-button"
                    aria-label="Entry actions"
                    aria-expanded={moreMenu}
                    onClick={() => setMoreMenu(!moreMenu)}
                  >
                    <Icon name="more" />
                  </button>
                  {moreMenu && (
                    <>
                      <button
                        className="menu-dismiss"
                        aria-label="Close entry actions"
                        onClick={() => setMoreMenu(false)}
                      />
                      <div className="popover entry-popover">
                        <button
                          onClick={() => {
                            setMoreMenu(false);
                            void run(() => create("freewrite"));
                          }}
                        >
                          <Icon name="plus" size={16} />
                          New page
                        </button>
                        <button
                          onClick={() => {
                            setMoreMenu(false);
                            void run(() => create("pile"));
                          }}
                        >
                          <Icon name="pile" size={16} />
                          New pile
                        </button>
                        <button
                          onClick={() => {
                            setMoreMenu(false);
                            setSettings(true);
                          }}
                        >
                          <Icon name="settings" size={16} />
                          Writing settings
                        </button>
                        <div className="menu-divider" />
                        <button
                          disabled={busy || entry.deleted}
                          onClick={() => {
                            setMoreMenu(false);
                            entry.private
                              ? setConfirm("public")
                              : void run(protect);
                          }}
                        >
                          <Icon
                            name={entry.private ? "unlock" : "lock"}
                            size={16}
                          />
                          {entry.private
                            ? "Make entry ordinary"
                            : "Make entry private"}
                        </button>

                        <button
                          onClick={() => {
                            setShowTitle(true);
                            setMoreMenu(false);
                            setTimeout(
                              () =>
                                document
                                  .querySelector<HTMLInputElement>(
                                    ".title-input",
                                  )
                                  ?.focus(),
                              0,
                            );
                          }}
                        >
                          <Icon name="write" size={16} />
                          Edit title
                        </button>
                        <button
                          onClick={() => {
                            setMoreMenu(false);
                            setConfirm("export");
                          }}
                        >
                          <Icon name="export" size={16} />
                          Export as Markdown
                        </button>
                        {entry.deleted ? (
                          <>
                            <button
                              onClick={() =>
                                void run(() => trashCurrent(false))
                              }
                            >
                              <Icon name="back" size={16} />
                              Restore entry
                            </button>
                            <button
                              className="danger"
                              onClick={() => {
                                setMoreMenu(false);
                                setConfirm("purge");
                              }}
                            >
                              <Icon name="trash" size={16} />
                              Delete permanently
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => void run(() => trashCurrent(true))}
                          >
                            <Icon name="trash" size={16} />
                            Move to trash
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            {saveState === "error" && (
              <button
                onClick={() =>
                  void run(async () => {
                    if (
                      !vault.unlocked &&
                      entryRef.current?.private &&
                      queue.hasPending()
                    ) {
                      setAuth({ type: "unlock" });
                      return;
                    }
                    await queue.flush();
                  })
                }
              >
                Retry
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        {concealed ? (
          <div className="empty-page">
            <Icon name="lock" size={26} />
            <span className="sr-only">Locking private entries</span>
          </div>
        ) : loading && selected ? (
          <div className="empty-page">
            <p>Opening entry…</p>
          </div>
        ) : entry?.locked ? (
          <div className="empty-page locked-page">
            <Icon name="lock" size={28} />
            <h1>Private entry</h1>
            <p>
              This entry is encrypted. Unlock your private entries
              <br />
              to pick up where you left off.
            </p>
            <button
              className="primary-button"
              onClick={() => setAuth({ type: "unlock" })}
            >
              Unlock private entries
            </button>
            <small>{dateLabel(entry.created_at)}</small>
          </div>
        ) : entry ? (
          <>
            {entry.deleted && (
              <div className="trash-banner">
                <span>This entry is in the trash.</span>
                <button onClick={() => void run(() => trashCurrent(false))}>
                  Restore entry
                </button>
              </div>
            )}
            <div
              className={`writing-scroll ${entry.kind === "pile" ? "pile-scroll" : ""}`}
              key={entry.id}
            >
              <div className="writing-page">
                {(entry.title || showTitle) && (
                  <input
                    className="title-input"
                    aria-label="Entry title"
                    placeholder="Add a title"
                    value={entry.title}
                    onChange={(e) => edit({ title: e.target.value })}
                    readOnly={entry.deleted}
                  />
                )}
                {entry.kind === "freewrite" ? (
                  <textarea
                    ref={textarea}
                    className="freewrite"
                    autoFocus
                    aria-label="Write your entry"
                    placeholder="Write…"
                    value={entry.content}
                    onChange={(e) => edit({ content: e.target.value })}
                    readOnly={entry.deleted}
                    spellCheck={!entry.private}
                    autoComplete="off"
                    autoCorrect={entry.private ? "off" : "on"}
                    autoCapitalize="sentences"
                  />
                ) : (
                  <PileEditor
                    content={entry.content}
                    onChange={(content) => edit({ content })}
                    readOnly={entry.deleted}
                    privateEntry={entry.private}
                  />
                )}
              </div>
            </div>
            <footer className="editor-status">
              <SaveStatus
                state={saveState}
                onRetry={() =>
                  void run(async () => {
                    if (!vault.unlocked && entryRef.current?.private) {
                      setAuth({ type: "unlock" });
                      return;
                    }
                    await queue.flush();
                  })
                }
              />
              {wordCount && (
                <span>
                  {words.toLocaleString()} {words === 1 ? "word" : "words"}
                </span>
              )}
            </footer>
          </>
        ) : (
          <div className="empty-page">
            <div className="empty-actions">
              <button
                className="primary-button"
                onClick={() => void run(() => create("freewrite"))}
              >
                <Icon name="write" size={17} />
                Freewrite
              </button>
              <button
                className="secondary-button"
                onClick={() => void run(() => create("pile"))}
              >
                <Icon name="pile" size={17} />
                Pile
              </button>
            </div>

            {!desktop && !demo && (
              <p className="desktop-note">
                Open Log Horizon on your desktop to use your diary.
              </p>
            )}
          </div>
        )}
      </main>
      {settings && (
        <Modal title="Settings" onClose={() => setSettings(false)}>
          <div className="settings-content">
            <section>
              <h3>Writing</h3>
              <ChoiceGroup
                label="Appearance"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
              <ChoiceGroup
                label="Font"
                value={font}
                onChange={setFont}
                options={[
                  { value: "system", label: "System" },
                  { value: "sans", label: "Lato" },
                  { value: "serif", label: "Serif" },
                ]}
              />
              <div className="setting-row">
                <span id="size-label">Text size</span>
                <div
                  className="size-stepper"
                  role="group"
                  aria-labelledby="size-label"
                >
                  <button
                    className="icon-button"
                    aria-label="Decrease text size"
                    disabled={size <= 16}
                    onClick={() => setSize((s) => s - 1)}
                  >
                    <Icon name="minus" size={15} />
                  </button>
                  <output>{size}px</output>
                  <button
                    className="icon-button"
                    aria-label="Increase text size"
                    disabled={size >= 24}
                    onClick={() => setSize((s) => s + 1)}
                  >
                    <Icon name="plus" size={15} />
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <span id="word-count-label">Word count</span>
                <button
                  className="switch"
                  role="switch"
                  aria-checked={wordCount}
                  aria-labelledby="word-count-label"
                  onClick={() => setWordCount(!wordCount)}
                >
                  <span />
                </button>
              </div>
            </section>
            <section>
              <h3>Privacy</h3>
              <p>Encrypt selected entries with one password.</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setSettings(false);
                  setAuth({ type: "unlock" });
                }}
              >
                {vault.configured
                  ? "Unlock private entries"
                  : "Set a diary password"}
              </button>
              {vault.configured && (
                <PasswordChange
                  onDone={() =>
                    setNotice(
                      "Diary password changed. Older backups still use their original password.",
                    )
                  }
                />
              )}
              <details className="settings-details">
                <summary>How privacy works</summary>
                <p>
                  Private titles and writing are encrypted; dates stay visible.
                  Entries lock when you leave the app or after five minutes of
                  inactivity. There is no password reset. Earlier exports,
                  backups and system snapshots may contain readable copies.
                </p>
              </details>
            </section>
            <section>
              <h3>Your data</h3>

              <div className="data-actions">
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await queue.flush();
                      if (await api<boolean>("backup_diary"))
                        setNotice("Diary backup saved.");
                    })
                  }
                >
                  Save backup
                </button>
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await queue.flush();
                      if (await api<boolean>("restore_diary")) {
                        await refresh();
                        setNotice(
                          "Diary restored. Private entries use the backup’s password.",
                        );
                      }
                    })
                  }
                >
                  Restore backup
                </button>
              </div>
              <details className="settings-details">
                <summary>Backup and restore details</summary>
                <p>
                  Backups include entries and trash. Private entries stay
                  encrypted; ordinary entries remain readable. Restore requires
                  an empty diary without a password and never overwrites
                  existing entries.
                </p>
              </details>
            </section>
            <details className="settings-details shortcuts-details">
              <summary>Keyboard shortcuts</summary>
              <div className="shortcut-row">
                <span>New freewrite / pile</span>
                <kbd>⌘ N / ⌘ ⇧ N</kbd>
              </div>
              <div className="shortcut-row">
                <span>Find an entry</span>
                <kbd>⌘ K</kbd>
              </div>
              <div className="shortcut-row">
                <kbd>⌘ L</kbd>
              </div>
              <div className="shortcut-row">
                <span>Focus mode</span>
                <kbd>⌘ \</kbd>
              </div>
              <p className="fine-print">
                Use Ctrl instead of ⌘ on Windows and Linux.
              </p>
            </details>
          </div>
        </Modal>
      )}
      {auth && (
        <PasswordDialog
          setup={!vault.configured}
          onClose={() => setAuth(null)}
          onSubmit={authenticated}
        />
      )}
      {confirm && (
        <Modal
          title={
            confirm === "export"
              ? "Export a readable copy?"
              : confirm === "public"
                ? "Remove encryption?"
                : "Delete this entry permanently?"
          }
          onClose={() => setConfirm(null)}
        >
          <p className="dialog-description">
            {confirm === "export"
              ? "The exported Markdown file will not be encrypted. Anyone who can open that file can read it."
              : confirm === "public"
                ? "This entry will become readable without your diary password. Its title and writing will be stored unencrypted."
                : "This cannot be undone. Any copies in your backups will remain."}
          </p>
          <div className="dialog-actions">
            <button
              className="secondary-button"
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              onClick={() => void run(confirmAction)}
            >
              {confirm === "export"
                ? "Export copy"
                : confirm === "public"
                  ? "Make ordinary"
                  : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
