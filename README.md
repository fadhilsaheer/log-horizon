# Log Horizon

A quiet, local desktop diary. Write a full page in **Freewrite**, or leave individual thoughts in **Pile**, a stream of momentary notes.

## Writing

- Optional titles, chronological entry list, content search, and an on-demand entry drawer.
- Freewrite: continuous plain text with automatic saving.
- Pile: a stationary writing line with thoughts collecting in the scrollable space above; Enter adds a thought and Shift+Enter inserts a line break. Edit or remove individual thoughts. Unfinished drafts are saved too.
- System, light, and dark appearance; system sans writing by default, with serif and locally bundled Lato alternatives; adjustable text size and optional word count.
- Trash with restore, explicit permanent deletion, and Markdown export.

## Private entries

Choose the **Make entry private** lock control, or create a **Private freewrite / Private pile**. One diary password protects selected entries, including titles and Pile drafts. Ordinary entries remain readable without a password. Dates, entry type, and the existence of private entries remain visible.

Private entries start locked. Leaving the app conceals content and flushes pending saves before locking; the native backend enforces a two-second fallback if the webview does not respond. Five minutes without activity locks the vault. The native timer also locks after a long scheduling gap such as system sleep. Use Cmd/Ctrl+L to lock immediately.

Passwords require at least 10 characters. **There is no password reset.** Changing a password does not change the password needed for older backups.

See [SECURITY.md](SECURITY.md) for the storage design and its practical limits.

## Backups and migration

Settings → **Save backup** writes a versioned `.lhbackup` file containing entries, trash, and the wrapped vault key. Private content remains encrypted; ordinary content is readable. Keep a copy outside this computer if you need protection from disk failure.

**Restore backup** imports into an empty diary without a configured password. It validates the format and imports everything in one transaction. It never overwrites an existing diary. Restore accepts files up to 256 MB; unlocked private content still needs the backup's original password.

On first launch, the previous text-file diary is imported into SQLite in a single transaction. Freewrite and Pile contents, titles, IDs, and dates are retained. If an original file cannot be read, the import rolls back and the originals remain. After successful commit, obsolete text files are removed; cleanup is retried on the next launch if interrupted. No automatic plaintext migration archive is left behind.

Storage remains in Tauri's app data directory under `journal/journal.db` (on macOS: `~/Library/Application Support/org.hyfic.log-horizon/journal/journal.db`).

## Run

Requires Bun, Rust, and the native Tauri build prerequisites for your OS.

```sh
bun install
bun run tauri dev
```

The browser alone cannot access your diary. `bun run dev` with `/?demo=1` provides an explicitly labelled, in-memory sample preview; refreshing it discards changes.

```sh
bun run build
bun test
cargo test --manifest-path src-tauri/Cargo.toml
bun run tauri build
```

## Shortcuts

| Action                      | Shortcut           |
| --------------------------- | ------------------ |
| New freewrite               | Cmd/Ctrl+N         |
| New pile                    | Cmd/Ctrl+Shift+N   |
| Find an entry               | Cmd/Ctrl+K         |
| Lock private entries        | Cmd/Ctrl+L         |
| Flush pending save          | Cmd/Ctrl+S         |
| Toggle sidebar / focus mode | Cmd/Ctrl+Backslash |

The save indicator acknowledges completed writes. Failed writes remain in memory for retry, including across a lock/unlock cycle. Closing the window waits for pending saves and stays open on failure. Force-quitting or losing power before a save is acknowledged can still lose the latest edits.

## Stack

Tauri 2 / Rust, React / TypeScript, SQLite. No account, cloud sync, analytics, AI service, or remote font loading.
