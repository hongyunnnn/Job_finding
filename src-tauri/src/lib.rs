// 中国企业招聘信息平台 — Tauri Rust 后端
// 注册 shell 插件以允许前端通过 window.open() 打开外部链接

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
