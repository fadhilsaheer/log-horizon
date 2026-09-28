mod crypto;
mod diary;
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?.join("journal");
            std::fs::create_dir_all(&dir)?;
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(&dir, std::fs::Permissions::from_mode(0o700))?;
            }
            let d = diary::Diary::open(&dir.join("journal.db")).map_err(std::io::Error::other)?;
            app.manage(std::sync::Mutex::new(d));
            diary::start_autolock(app.handle().clone());
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(false) = event {
                let app = window.app_handle().clone();
                let generation = app
                    .state::<diary::Shared>()
                    .lock()
                    .map(|d| d.generation)
                    .unwrap_or(0);
                let _ = window.emit("privacy-conceal", ());
                // Let the UI finish its save queue. Lock even if the webview stops responding.
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(2));
                    if let Ok(mut d) = app.state::<diary::Shared>().lock() {
                        if d.generation == generation {
                            d.lock();
                            let _ = app.emit("vault-locked", ());
                        }
                    };
                });
            }
        })
        .invoke_handler(tauri::generate_handler![
            diary::vault_status,
            diary::unlock_vault,
            diary::change_password,
            diary::lock_vault,
            diary::diary_activity,
            diary::list_entries,
            diary::get_entry,
            diary::create_entry,
            diary::save_entry,
            diary::set_private,
            diary::trash_entry,
            diary::purge_entry,
            diary::export_entry,
            diary::backup_diary,
            diary::restore_diary
        ])
        .run(tauri::generate_context!())
        .expect("error while running diary");
}
