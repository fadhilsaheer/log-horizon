use rusqlite::{params, Connection, Result};

pub struct DbEntry {
    pub id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub file_path: String,
}

pub fn insert_entry(
    conn: &Connection,
    entry: &DbEntry,
) -> Result<()> {
    conn.execute(
        "INSERT INTO entries (id, title, created_at, updated_at, file_path)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            entry.id,
            entry.title,
            entry.created_at,
            entry.updated_at,
            entry.file_path,
        ],
    )?;
    Ok(())
}

pub fn update_entry(
    conn: &Connection,
    id: &str,
    title: &str,
    updated_at: &str,
) -> Result<()> {
    conn.execute(
        "UPDATE entries SET title = ?1, updated_at = ?2 WHERE id = ?3",
        params![title, updated_at, id],
    )?;
    Ok(())
}

pub fn delete_entry(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM entries WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn list_entries(conn: &Connection) -> Result<Vec<DbEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, created_at, updated_at, file_path
         FROM entries
         ORDER BY created_at DESC",
    )?;

    let entries_iter = stmt.query_map([], |row| {
        Ok(DbEntry {
            id: row.get(0)?,
            title: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
            file_path: row.get(4)?,
        })
    })?;

    let mut entries = Vec::new();
    for entry_result in entries_iter {
        entries.push(entry_result?);
    }

    Ok(entries)
}

pub fn get_entry_path(conn: &Connection, id: &str) -> Result<String> {
    let mut stmt = conn.prepare("SELECT file_path FROM entries WHERE id = ?1")?;
    let path: String = stmt.query_row(params![id], |row| row.get(0))?;
    Ok(path)
}
