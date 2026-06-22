use rusqlite::{Connection, Result as SqliteResult};
use std::fs;
use tauri::{AppHandle, Manager};

pub mod queries;

pub fn init_db(app_handle: &AppHandle) -> SqliteResult<Connection> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");

    let db_dir = app_data_dir.join("journal");
    if !db_dir.exists() {
        fs::create_dir_all(&db_dir).expect("Failed to create journal directory");
    }

    let entries_dir = db_dir.join("entries");
    if !entries_dir.exists() {
        fs::create_dir_all(&entries_dir).expect("Failed to create entries directory");
    }

    let db_path = db_dir.join("journal.db");
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS entries (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL,
            file_path   TEXT NOT NULL
        );"
    )?;

    Ok(conn)
}
