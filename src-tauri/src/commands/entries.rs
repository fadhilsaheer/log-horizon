use tauri::{AppHandle, State, Manager};
use std::sync::Mutex;
use rusqlite::Connection;
use uuid::Uuid;
use chrono::Utc;

use crate::db::queries::{self, DbEntry};
use crate::fs as fs_helper;

#[derive(serde::Serialize)]
pub struct EntryMeta {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub kind: String,
}

#[derive(serde::Serialize)]
pub struct Entry {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub content: String,
    pub kind: String,
}

#[tauri::command]
pub fn list_entries(state: State<'_, Mutex<Connection>>) -> Result<Vec<EntryMeta>, String> {
    let conn = state.lock().map_err(|_| "Failed to lock database state")?;
    let db_entries = queries::list_entries(&conn).map_err(|e| e.to_string())?;
    
    let entries = db_entries
        .into_iter()
        .map(|db_entry| EntryMeta {
            id: db_entry.id,
            title: db_entry.title,
            created_at: db_entry.created_at,
            updated_at: db_entry.updated_at,
            kind: db_entry.kind,
        })
        .collect();
        
    Ok(entries)
}

#[tauri::command]
pub fn get_entry(id: String, state: State<'_, Mutex<Connection>>) -> Result<Entry, String> {
    let conn = state.lock().map_err(|_| "Failed to lock database state")?;
    let db_entry = queries::get_entry_by_id(&conn, &id).map_err(|e| e.to_string())?;
    
    let content = fs_helper::read_file(&db_entry.file_path).map_err(|_| "File not found".to_string())?;
    
    Ok(Entry {
        id: db_entry.id,
        title: db_entry.title,
        created_at: db_entry.created_at,
        updated_at: db_entry.updated_at,
        content,
        kind: db_entry.kind,
    })
}

#[tauri::command]
pub fn create_entry(kind: String, app_handle: AppHandle, state: State<'_, Mutex<Connection>>) -> Result<EntryMeta, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let created_at = now.to_rfc3339();
    let updated_at = created_at.clone();
    
    // Resolve file path using current date
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let year = now.format("%Y").to_string();
    let month = now.format("%m").to_string();
    
    let entries_dir = app_data_dir.join("journal").join("entries").join(&year).join(&month);
    std::fs::create_dir_all(&entries_dir).map_err(|e| e.to_string())?;
    
    let file_path = entries_dir.join(format!("{}.txt", id));
    let file_path_str = file_path.to_string_lossy().to_string();
    
    // Write empty .txt file based on kind
    let initial_content = if kind == "pile" { "[]" } else { "" };
    fs_helper::write_file(&file_path_str, initial_content).map_err(|e| e.to_string())?;
    
    // Insert into SQLite
    let date_title = now.format("%B %d, %Y").to_string();
    let title = format!("Log - {}", date_title);
    
    let db_entry = DbEntry {
        id: id.clone(),
        title: title.clone(),
        created_at: created_at.clone(),
        updated_at: updated_at.clone(),
        file_path: file_path_str,
        kind: kind.clone(),
    };
    
    let conn = state.lock().map_err(|_| "Failed to lock database state")?;
    queries::insert_entry(&conn, &db_entry).map_err(|e| e.to_string())?;
    
    Ok(EntryMeta {
        id,
        title,
        created_at,
        updated_at,
        kind,
    })
}

#[tauri::command]
pub fn save_entry(id: String, title: String, content: String, state: State<'_, Mutex<Connection>>) -> Result<(), String> {
    let conn = state.lock().map_err(|_| "Failed to lock database state")?;
    
    let file_path = queries::get_entry_path(&conn, &id).map_err(|e| e.to_string())?;
    fs_helper::write_file(&file_path, &content).map_err(|e| e.to_string())?;
    
    let updated_at = Utc::now().to_rfc3339();
    queries::update_entry(&conn, &id, &title, &updated_at).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn delete_entry(id: String, state: State<'_, Mutex<Connection>>) -> Result<(), String> {
    let conn = state.lock().map_err(|_| "Failed to lock database state")?;
    
    let file_path = queries::get_entry_path(&conn, &id).map_err(|e| e.to_string())?;
    // We ignore error here in case the file was already deleted externally
    let _ = fs_helper::delete_file(&file_path);
    
    queries::delete_entry(&conn, &id).map_err(|e| e.to_string())?;
    
    Ok(())
}
