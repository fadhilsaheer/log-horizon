use crate::crypto::{self, Key};
use chrono::Utc;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::{
    path::{Path, PathBuf},
    sync::Mutex,
    time::{Duration, Instant},
};
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;
use zeroize::Zeroizing;

type R<T> = Result<T, String>;
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
const VAULT_CONTEXT: &[u8] = b"log-horizon/vault/v1";

pub struct Diary {
    pub conn: Connection,
    pub key: Option<Key>,
    pub activity: Instant,
    pub generation: u64,
}
pub type Shared = Mutex<Diary>;
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct Body {
    pub title: String,
    pub content: String,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct Entry {
    pub id: String,
    pub kind: String,
    pub created_at: String,
    pub updated_at: String,
    pub private: bool,
    pub deleted: bool,
    pub locked: bool,
    pub title: String,
    pub content: String,
}
#[derive(Serialize)]
pub struct Status {
    configured: bool,
    unlocked: bool,
}
#[derive(Serialize, Deserialize)]
struct Stored {
    id: String,
    kind: String,
    created_at: String,
    updated_at: String,
    private: bool,
    deleted: bool,
    payload: Vec<u8>,
}
#[derive(Serialize, Deserialize)]
struct Vault {
    salt: Vec<u8>,
    wrapped: Vec<u8>,
}
#[derive(Serialize, Deserialize)]
struct Backup {
    format: String,
    version: u32,
    vault: Option<Vault>,
    entries: Vec<Stored>,
}

impl Diary {
    pub fn open(path: &Path) -> R<Self> {
        let mut conn = Connection::open(path).map_err(err)?;
        let version: i64 = conn
            .query_row("PRAGMA user_version", [], |r| r.get(0))
            .map_err(err)?;
        if version > 1 {
            return Err(
                "This diary was created by a newer app version. Update Log Horizon to open it."
                    .into(),
            );
        }

        conn.execute_batch("PRAGMA secure_delete=ON; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;
          CREATE TABLE IF NOT EXISTS diary_entries(id TEXT PRIMARY KEY, kind TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, private INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, payload BLOB NOT NULL);
          CREATE TABLE IF NOT EXISTS vault(id INTEGER PRIMARY KEY CHECK(id=1), salt BLOB NOT NULL, wrapped BLOB NOT NULL);").map_err(err)?;
        // Import all old files in one transaction; leave originals untouched if any read fails.
        let legacy: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='entries')",
                [],
                |r| r.get(0),
            )
            .map_err(err)?;
        if legacy {
            let rows: Vec<(String, String, String, String, String, String)> = {
                let mut stmt = conn
                    .prepare("SELECT id,kind,created_at,updated_at,title,file_path FROM entries")
                    .map_err(err)?;
                let rows = stmt
                    .query_map([], |r| {
                        Ok((
                            r.get(0)?,
                            r.get(1)?,
                            r.get(2)?,
                            r.get(3)?,
                            r.get(4)?,
                            r.get(5)?,
                        ))
                    })
                    .map_err(err)?;
                rows.collect::<Result<_, _>>().map_err(err)?
            };
            let tx = conn.transaction().map_err(err)?;
            tx.execute_batch("CREATE TABLE IF NOT EXISTS legacy_cleanup(path TEXT PRIMARY KEY);")
                .map_err(err)?;
            for (id, kind, created, updated, title, file) in rows {
                let content = std::fs::read_to_string(&file).map_err(|_| "Migration stopped: an existing entry file could not be read. Your original diary has not been changed.".to_string())?;
                let payload = serde_json::to_vec(&Body { title, content }).map_err(err)?;
                tx.execute(
                    "INSERT INTO diary_entries VALUES(?1,?2,?3,?4,0,0,?5)",
                    params![id, kind, created, updated, payload],
                )
                .map_err(err)?;
                tx.execute("INSERT OR IGNORE INTO legacy_cleanup VALUES(?1)", [&file])
                    .map_err(err)?;
            }
            tx.execute_batch("DROP TABLE entries;").map_err(err)?;
            tx.commit().map_err(err)?;
        }
        let mut diary = Self {
            conn,
            key: None,
            activity: Instant::now(),
            generation: 0,
        };
        diary.cleanup_legacy()?;
        diary
            .conn
            .pragma_update(None, "user_version", 1)
            .map_err(err)?;
        if legacy {
            diary.conn.execute_batch("VACUUM;").map_err(err)?;
        }
        Ok(diary)
    }
    fn cleanup_legacy(&mut self) -> R<()> {
        self.conn
            .execute_batch("CREATE TABLE IF NOT EXISTS legacy_cleanup(path TEXT PRIMARY KEY)")
            .map_err(err)?;
        let paths: Vec<String> = {
            let mut s = self
                .conn
                .prepare("SELECT path FROM legacy_cleanup")
                .map_err(err)?;
            let rows = s.query_map([], |r| r.get(0)).map_err(err)?;
            rows.collect::<Result<_, _>>().map_err(err)?
        };
        for path in paths {
            match std::fs::remove_file(&path) {
                Ok(()) => (), Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                Err(_) => return Err("Imported your entries, but could not remove a legacy plaintext file. Close the app and check diary folder permissions before using privacy.".into()),
            }
            self.conn
                .execute("DELETE FROM legacy_cleanup WHERE path=?1", [&path])
                .map_err(err)?;
        }
        Ok(())
    }
    pub fn lock(&mut self) {
        self.key = None;
        self.generation += 1;
    }
    fn touch(&mut self) {
        self.activity = Instant::now();
    }
    fn stored(&self, id: &str) -> R<Stored> {
        self.conn.query_row("SELECT id,kind,created_at,updated_at,private,deleted,payload FROM diary_entries WHERE id=?1", [id], row).map_err(err)
    }
    fn body(&self, e: &Stored) -> R<Body> {
        let bytes = if e.private {
            crypto::decrypt(
                self.key.as_ref().ok_or("Unlock private entries first")?,
                &e.payload,
                e.id.as_bytes(),
            )?
        } else {
            Zeroizing::new(e.payload.clone())
        };
        serde_json::from_slice(&bytes).map_err(|_| "Entry data is damaged".into())
    }
    fn present(&self, e: Stored, content: bool) -> R<Entry> {
        let locked = e.private && self.key.is_none();
        let body = if locked {
            Body {
                title: "Private entry".into(),
                content: String::new(),
            }
        } else {
            self.body(&e)?
        };
        Ok(Entry {
            id: e.id,
            kind: e.kind,
            created_at: e.created_at,
            updated_at: e.updated_at,
            private: e.private,
            deleted: e.deleted,
            locked,
            title: body.title,
            content: if content { body.content } else { String::new() },
        })
    }
    fn put(&mut self, e: &Stored, body: &Body, private: bool) -> R<()> {
        let bytes = Zeroizing::new(serde_json::to_vec(body).map_err(err)?);
        let payload = if private {
            crypto::encrypt(
                self.key.as_ref().ok_or("Unlock private entries first")?,
                &bytes,
                e.id.as_bytes(),
            )?
        } else {
            bytes.to_vec()
        };
        self.conn
            .execute(
                "UPDATE diary_entries SET payload=?1,private=?2,updated_at=?3 WHERE id=?4",
                params![payload, private, Utc::now().to_rfc3339(), e.id],
            )
            .map_err(err)?;
        self.touch();
        Ok(())
    }
}
fn row(r: &rusqlite::Row<'_>) -> rusqlite::Result<Stored> {
    Ok(Stored {
        id: r.get(0)?,
        kind: r.get(1)?,
        created_at: r.get(2)?,
        updated_at: r.get(3)?,
        private: r.get(4)?,
        deleted: r.get(5)?,
        payload: r.get(6)?,
    })
}
fn vault(d: &Diary) -> R<Option<Vault>> {
    use rusqlite::OptionalExtension;
    d.conn
        .query_row("SELECT salt,wrapped FROM vault WHERE id=1", [], |r| {
            Ok(Vault {
                salt: r.get(0)?,
                wrapped: r.get(1)?,
            })
        })
        .optional()
        .map_err(err)
}
fn unwrap(d: &Diary, password: &str) -> R<Key> {
    let v = vault(d)?.ok_or("No diary password has been set")?;
    let derived = crypto::derive(password, &v.salt)?;
    let raw = crypto::decrypt(&derived, &v.wrapped, VAULT_CONTEXT)?;
    let bytes: [u8; 32] = raw.as_slice().try_into().map_err(|_| "Invalid vault key")?;
    Ok(Zeroizing::new(bytes))
}
fn wrap(d: &Diary, password: &str, key: &Key) -> R<()> {
    if password.chars().count() < 10 {
        return Err("Use at least 10 characters for your diary password".into());
    }
    let salt = crypto::salt();
    let derived = crypto::derive(password, &salt)?;
    let wrapped = crypto::encrypt(&derived, &**key, VAULT_CONTEXT)?;
    d.conn
        .execute(
            "INSERT OR REPLACE INTO vault VALUES(1,?1,?2)",
            params![salt.to_vec(), wrapped],
        )
        .map_err(err)?;
    Ok(())
}
#[tauri::command]
pub fn vault_status(state: State<Shared>) -> R<Status> {
    let d = state.lock().map_err(err)?;
    Ok(Status {
        configured: vault(&d)?.is_some(),
        unlocked: d.key.is_some(),
    })
}
#[tauri::command]
pub fn unlock_vault(password: String, setup: bool, state: State<Shared>) -> R<()> {
    let password = Zeroizing::new(password);
    let mut d = state.lock().map_err(err)?;
    let key = if setup {
        if vault(&d)?.is_some() {
            return Err("A diary password is already configured".into());
        }
        let k = crypto::random_key();
        wrap(&d, &password, &k)?;
        k
    } else {
        unwrap(&d, &password)?
    };
    d.key = Some(key);
    d.generation += 1;
    d.touch();
    Ok(())
}
#[tauri::command]
pub fn change_password(current: String, password: String, state: State<Shared>) -> R<()> {
    let current = Zeroizing::new(current);
    let password = Zeroizing::new(password);
    let d = state.lock().map_err(err)?;
    let key = unwrap(&d, &current)?;
    wrap(&d, &password, &key)
}
#[tauri::command]
pub fn lock_vault(state: State<Shared>) -> R<()> {
    state.lock().map_err(err)?.lock();
    Ok(())
}
#[tauri::command]
pub fn diary_activity(state: State<Shared>) -> R<()> {
    state.lock().map_err(err)?.touch();
    Ok(())
}
#[tauri::command]
pub fn list_entries(query: String, deleted: bool, state: State<Shared>) -> R<Vec<Entry>> {
    let d = state.lock().map_err(err)?;
    let mut stmt = d.conn.prepare("SELECT id,kind,created_at,updated_at,private,deleted,payload FROM diary_entries WHERE deleted=?1 ORDER BY created_at DESC,id DESC").map_err(err)?;
    let rows = stmt.query_map([deleted], row).map_err(err)?;
    let mut out = Vec::new();
    let q = query.to_lowercase();
    for r in rows {
        let entry = d.present(r.map_err(err)?, !q.is_empty())?;
        if q.is_empty()
            || (!entry.locked
                && (entry.title.to_lowercase().contains(&q)
                    || entry.content.to_lowercase().contains(&q)))
        {
            out.push(Entry {
                content: String::new(),
                ..entry
            });
        }
    }
    Ok(out)
}
#[tauri::command]
pub fn get_entry(id: String, state: State<Shared>) -> R<Entry> {
    let mut d = state.lock().map_err(err)?;
    let e = d.stored(&id)?;
    d.touch();
    d.present(e, true)
}
#[tauri::command]
pub fn create_entry(kind: String, private: bool, state: State<Shared>) -> R<Entry> {
    if kind != "freewrite" && kind != "pile" {
        return Err("Unknown writing mode".into());
    }
    let mut d = state.lock().map_err(err)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let body = Body {
        title: String::new(),
        content: if kind == "pile" {
            "{\"items\":[],\"draft\":\"\"}".into()
        } else {
            String::new()
        },
    };
    let bytes = Zeroizing::new(serde_json::to_vec(&body).map_err(err)?);
    let payload = if private {
        crypto::encrypt(
            d.key.as_ref().ok_or("Unlock private entries first")?,
            &bytes,
            id.as_bytes(),
        )?
    } else {
        bytes.to_vec()
    };
    d.conn
        .execute(
            "INSERT INTO diary_entries VALUES(?1,?2,?3,?3,?4,0,?5)",
            params![id, kind, now, private, payload],
        )
        .map_err(err)?;
    d.touch();
    d.present(d.stored(&id)?, true)
}
#[tauri::command]
pub fn save_entry(id: String, title: String, content: String, state: State<Shared>) -> R<()> {
    let mut d = state.lock().map_err(err)?;
    let e = d.stored(&id)?;
    if e.deleted {
        return Err("Restore this entry before editing".into());
    }
    d.put(&e, &Body { title, content }, e.private)
}
#[tauri::command]
pub fn set_private(id: String, private: bool, state: State<Shared>) -> R<()> {
    let mut d = state.lock().map_err(err)?;
    let e = d.stored(&id)?;
    let body = d.body(&e)?;
    d.put(&e, &body, private)?;
    // DELETE journal mode and secure_delete prevent old SQLite cells from retaining the title/body.
    d.conn.execute_batch("VACUUM").map_err(err)?;
    Ok(())
}
#[tauri::command]
pub fn trash_entry(id: String, deleted: bool, state: State<Shared>) -> R<()> {
    let d = state.lock().map_err(err)?;
    let e = d.stored(&id)?;
    if e.private && d.key.is_none() {
        return Err("Unlock private entries first".into());
    }
    d.conn
        .execute(
            "UPDATE diary_entries SET deleted=?1 WHERE id=?2",
            params![deleted, id],
        )
        .map_err(err)?;
    Ok(())
}
#[tauri::command]
pub fn purge_entry(id: String, state: State<Shared>) -> R<()> {
    let d = state.lock().map_err(err)?;
    let e = d.stored(&id)?;
    if !e.deleted {
        return Err("Move the entry to trash first".into());
    }
    if e.private && d.key.is_none() {
        return Err("Unlock private entries first".into());
    }
    d.conn
        .execute("DELETE FROM diary_entries WHERE id=?1", [id])
        .map_err(err)?;
    Ok(())
}
fn file_path(path: tauri_plugin_dialog::FilePath) -> R<PathBuf> {
    path.into_path().map_err(err)
}
fn write_new(path: &Path, bytes: &[u8]) -> R<()> {
    use std::io::Write;
    // Write beside the destination and rename only after the complete file is synced.
    let temp = path.with_extension(format!("{}.tmp", Uuid::new_v4()));
    let result = (|| {
        let mut options = std::fs::OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut f = options.open(&temp).map_err(err)?;
        f.write_all(bytes).map_err(err)?;
        f.sync_all().map_err(err)?;
        std::fs::rename(&temp, path).map_err(err)
    })();
    if result.is_err() {
        let _ = std::fs::remove_file(temp);
    }
    result
}
#[tauri::command]
pub async fn export_entry(id: String, app: tauri::AppHandle, state: State<'_, Shared>) -> R<bool> {
    let body = {
        let d = state.lock().map_err(err)?;
        let e = d.stored(&id)?;
        let b = d.body(&e)?;
        if e.kind == "pile" {
            let v: serde_json::Value = serde_json::from_str(&b.content).map_err(err)?;
            let items = v
                .as_array()
                .or_else(|| v.get("items").and_then(|x| x.as_array()))
                .ok_or("Invalid pile")?;
            let mut text = format!("{}\n\n", b.title);
            for item in items {
                text.push_str(item.get("text").and_then(|v| v.as_str()).unwrap_or(""));
                text.push_str("\n\n");
            }
            if let Some(draft) = v
                .get("draft")
                .and_then(|x| x.as_str())
                .filter(|s| !s.is_empty())
            {
                text.push_str(&format!("Unsent thought:\n{draft}\n"));
            }
            text
        } else {
            format!("{}\n\n{}\n", b.title, b.content)
        }
    };
    let path = app
        .dialog()
        .file()
        .set_file_name("diary-entry.md")
        .add_filter("Markdown", &["md"])
        .blocking_save_file();
    if let Some(path) = path {
        write_new(&file_path(path)?, body.as_bytes())?;
        Ok(true)
    } else {
        Ok(false)
    }
}
#[tauri::command]
pub async fn backup_diary(app: tauri::AppHandle, state: State<'_, Shared>) -> R<bool> {
    let bytes = {
        let d = state.lock().map_err(err)?;
        let mut s = d
            .conn
            .prepare(
                "SELECT id,kind,created_at,updated_at,private,deleted,payload FROM diary_entries",
            )
            .map_err(err)?;
        let rows = s.query_map([], row).map_err(err)?;
        let entries = rows.collect::<Result<Vec<_>, _>>().map_err(err)?;
        serde_json::to_vec(&Backup {
            format: "log-horizon".into(),
            version: 1,
            vault: vault(&d)?,
            entries,
        })
        .map_err(err)?
    };
    let path = app
        .dialog()
        .file()
        .set_file_name(format!("diary-{}.lhbackup", Utc::now().format("%Y-%m-%d")))
        .add_filter("Diary backup", &["lhbackup"])
        .blocking_save_file();
    if let Some(path) = path {
        write_new(&file_path(path)?, &bytes)?;
        Ok(true)
    } else {
        Ok(false)
    }
}
fn restore(d: &mut Diary, data: &[u8]) -> R<()> {
    let b: Backup = serde_json::from_slice(data).map_err(|_| "This is not a valid diary backup")?;
    if b.format != "log-horizon" || b.version != 1 {
        return Err("Unsupported backup version".into());
    }
    let count: i64 = d
        .conn
        .query_row("SELECT COUNT(*) FROM diary_entries", [], |r| r.get(0))
        .map_err(err)?;
    if count != 0 || vault(d)?.is_some() {
        return Err("Restore is available only in an empty diary without a password. Your current diary has not been changed.".into());
    }
    if let Some(v) = &b.vault {
        if v.salt.len() != 16 || v.wrapped.len() != 72 {
            return Err("Invalid vault in backup".into());
        }
    }
    for e in &b.entries {
        if Uuid::parse_str(&e.id).is_err()
            || !["freewrite", "pile"].contains(&e.kind.as_str())
            || chrono::DateTime::parse_from_rfc3339(&e.created_at).is_err()
            || chrono::DateTime::parse_from_rfc3339(&e.updated_at).is_err()
        {
            return Err("Invalid entry in backup".into());
        }
        if e.private {
            if b.vault.is_none() || e.payload.len() < 40 {
                return Err("Backup is missing encrypted entry data".into());
            }
        } else {
            serde_json::from_slice::<Body>(&e.payload)
                .map_err(|_| "Invalid entry content in backup")?;
        }
    }
    let tx = d.conn.transaction().map_err(err)?;
    if let Some(v) = b.vault {
        tx.execute(
            "INSERT INTO vault VALUES(1,?1,?2)",
            params![v.salt, v.wrapped],
        )
        .map_err(err)?;
    }
    for e in b.entries {
        tx.execute(
            "INSERT INTO diary_entries VALUES(?1,?2,?3,?4,?5,?6,?7)",
            params![
                e.id,
                e.kind,
                e.created_at,
                e.updated_at,
                e.private,
                e.deleted,
                e.payload
            ],
        )
        .map_err(err)?;
    }
    tx.commit().map_err(err)?;
    d.lock();
    Ok(())
}
#[tauri::command]
pub async fn restore_diary(app: tauri::AppHandle, state: State<'_, Shared>) -> R<bool> {
    let path = app
        .dialog()
        .file()
        .add_filter("Diary backup", &["lhbackup"])
        .blocking_pick_file();
    if let Some(path) = path {
        let path = file_path(path)?;
        if std::fs::metadata(&path).map_err(err)?.len() > 256 * 1024 * 1024 {
            return Err("Backup exceeds the 256 MB restore limit".into());
        }
        let bytes = std::fs::read(path).map_err(err)?;
        restore(&mut *state.lock().map_err(err)?, &bytes)?;
        Ok(true)
    } else {
        Ok(false)
    }
}
pub fn start_autolock(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut previous = std::time::SystemTime::now();
        loop {
            std::thread::sleep(Duration::from_secs(1));
            let now = std::time::SystemTime::now();
            // A long timer gap also locks on resume after system sleep.
            let resumed = now
                .duration_since(previous)
                .map(|gap| gap > Duration::from_secs(5))
                .unwrap_or(true);
            previous = now;
            let state = app.state::<Shared>();
            if let Ok(mut d) = state.lock() {
                if d.key.is_some() && (resumed || d.activity.elapsed() >= Duration::from_secs(300))
                {
                    d.lock();
                    use tauri::Emitter;
                    let _ = app.emit("vault-locked", ());
                }
            };
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    fn db() -> Diary {
        Diary::open(Path::new(":memory:")).unwrap()
    }
    fn insert(d: &Diary, id: &str) {
        d.conn
            .execute(
                "INSERT INTO diary_entries VALUES(?1,'freewrite',?2,?2,0,0,?3)",
                params![
                    id,
                    Utc::now().to_rfc3339(),
                    serde_json::to_vec(&Body {
                        title: "secret title".into(),
                        content: "secret text".into()
                    })
                    .unwrap()
                ],
            )
            .unwrap();
    }
    #[test]
    fn private_roundtrip_and_lock() {
        let mut d = db();
        insert(&d, "test");
        let key = crypto::random_key();
        wrap(&d, "a long test password", &key).unwrap();
        d.key = Some(key);
        let e = d.stored("test").unwrap();
        d.put(&e, &d.body(&e).unwrap(), true).unwrap();
        let payload = d.stored("test").unwrap().payload;
        assert!(!String::from_utf8_lossy(&payload).contains("secret"));
        d.lock();
        assert!(d.body(&d.stored("test").unwrap()).is_err());
        assert!(d.present(d.stored("test").unwrap(), true).unwrap().locked);
        assert!(unwrap(&d, "wrong password").is_err());
        d.key = Some(unwrap(&d, "a long test password").unwrap());
        assert_eq!(
            d.body(&d.stored("test").unwrap()).unwrap().content,
            "secret text"
        );
        wrap(&d, "a changed password", d.key.as_ref().unwrap()).unwrap();
        assert!(unwrap(&d, "a long test password").is_err());
        assert!(unwrap(&d, "a changed password").is_ok());
    }
    #[test]
    fn backup_restore_is_atomic_and_preserves_ciphertext() {
        let mut d = db();
        let id = Uuid::new_v4().to_string();
        insert(&d, &id);
        let key = crypto::random_key();
        wrap(&d, "a long test password", &key).unwrap();
        d.key = Some(key);
        let e = d.stored(&id).unwrap();
        d.put(&e, &d.body(&e).unwrap(), true).unwrap();
        let bytes = serde_json::to_vec(&Backup {
            format: "log-horizon".into(),
            version: 1,
            vault: vault(&d).unwrap(),
            entries: vec![d.stored(&id).unwrap()],
        })
        .unwrap();
        let mut target = db();
        restore(&mut target, &bytes).unwrap();
        assert!(target.key.is_none());
        target.key = Some(unwrap(&target, "a long test password").unwrap());
        assert_eq!(
            target.body(&target.stored(&id).unwrap()).unwrap().title,
            "secret title"
        );
        assert!(restore(&mut target, &bytes).is_err());
    }
    #[test]
    fn migration_preserves_piles_and_removes_plaintext_files() {
        let dir = std::env::temp_dir().join(Uuid::new_v4().to_string());
        std::fs::create_dir(&dir).unwrap();
        let path = dir.join("journal.db");
        let file = dir.join("old.txt");
        std::fs::write(&file, "[{\"text\":\"hello\"}]").unwrap();
        let conn = Connection::open(&path).unwrap();
        conn.execute_batch("CREATE TABLE entries(id TEXT,kind TEXT,created_at TEXT,updated_at TEXT,title TEXT,file_path TEXT)").unwrap();
        conn.execute(
            "INSERT INTO entries VALUES('old','pile','2026-01-01','2026-01-01','old title',?1)",
            [file.to_str().unwrap()],
        )
        .unwrap();
        drop(conn);
        let d = Diary::open(&path).unwrap();
        assert_eq!(
            d.body(&d.stored("old").unwrap()).unwrap().content,
            "[{\"text\":\"hello\"}]"
        );
        assert!(!file.exists());
        drop(d);
        assert!(Diary::open(&path).is_ok());
        std::fs::remove_dir_all(dir).unwrap();
    }
    #[test]
    fn commands_enforce_privacy_and_trash_boundaries() {
        let app = tauri::test::mock_app();
        app.manage(Mutex::new(db()));
        assert!(create_entry("pile".into(), true, app.state()).is_err());
        unlock_vault("a diary test password".into(), true, app.state()).unwrap();
        let entry = create_entry("pile".into(), true, app.state()).unwrap();
        save_entry(
            entry.id.clone(),
            "private title".into(),
            "[{\"text\":\"hidden thought\"}]".into(),
            app.state(),
        )
        .unwrap();
        assert_eq!(
            list_entries("hidden".into(), false, app.state())
                .unwrap()
                .len(),
            1
        );
        lock_vault(app.state()).unwrap();
        let redacted = get_entry(entry.id.clone(), app.state()).unwrap();
        assert!(redacted.locked);
        assert_eq!(redacted.title, "Private entry");
        assert!(redacted.content.is_empty());
        assert!(list_entries("hidden".into(), false, app.state())
            .unwrap()
            .is_empty());
        assert!(save_entry(entry.id.clone(), "leak".into(), "leak".into(), app.state()).is_err());
        assert!(set_private(entry.id.clone(), false, app.state()).is_err());
        assert!(trash_entry(entry.id.clone(), true, app.state()).is_err());
        unlock_vault("a diary test password".into(), false, app.state()).unwrap();
        trash_entry(entry.id.clone(), true, app.state()).unwrap();
        assert!(save_entry(entry.id.clone(), "edit".into(), "edit".into(), app.state()).is_err());
        assert_eq!(list_entries("".into(), true, app.state()).unwrap().len(), 1);
        trash_entry(entry.id.clone(), false, app.state()).unwrap();
        assert!(purge_entry(entry.id.clone(), app.state()).is_err());
        assert_eq!(
            get_entry(entry.id, app.state()).unwrap().title,
            "private title"
        );
    }
    #[test]
    fn failed_restore_rolls_back_every_entry() {
        let d = db();
        let id = Uuid::new_v4().to_string();
        insert(&d, &id);
        let bytes = serde_json::to_vec(&Backup {
            format: "log-horizon".into(),
            version: 1,
            vault: None,
            entries: vec![d.stored(&id).unwrap(), d.stored(&id).unwrap()],
        })
        .unwrap();
        let mut target = db();
        assert!(restore(&mut target, &bytes).is_err());
        assert_eq!(
            target
                .conn
                .query_row("SELECT COUNT(*) FROM diary_entries", [], |r| r
                    .get::<_, i64>(0))
                .unwrap(),
            0
        );
    }
    #[test]
    fn failed_migration_keeps_original_entries() {
        let dir = std::env::temp_dir().join(Uuid::new_v4().to_string());
        std::fs::create_dir(&dir).unwrap();
        let path = dir.join("journal.db");
        let file = dir.join("old.txt");
        std::fs::write(&file, "keep me").unwrap();
        let conn = Connection::open(&path).unwrap();
        conn.execute_batch("CREATE TABLE entries(id TEXT,kind TEXT,created_at TEXT,updated_at TEXT,title TEXT,file_path TEXT)").unwrap();
        conn.execute(
            "INSERT INTO entries VALUES('one','freewrite','date','date','title',?1)",
            [file.to_str().unwrap()],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO entries VALUES('two','freewrite','date','date','title',?1)",
            [dir.join("missing.txt").to_str().unwrap()],
        )
        .unwrap();
        drop(conn);
        assert!(Diary::open(&path).is_err());
        assert_eq!(std::fs::read_to_string(file).unwrap(), "keep me");
        let conn = Connection::open(&path).unwrap();
        assert_eq!(
            conn.query_row("SELECT COUNT(*) FROM entries", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
        assert_eq!(
            conn.query_row("SELECT COUNT(*) FROM diary_entries", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            0
        );
        drop(conn);
        std::fs::remove_dir_all(dir).unwrap();
    }
}
