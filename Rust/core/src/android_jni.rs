#[uniffi::export]
pub fn bridge_request(method: String, payload: String) -> String {
    crate::bridge::handle_bridge_request_json(&format!(
        r#"{{"schema":"goose.bridge.request.v1","request_id":"android-{}","method":"{}","args":{}}}"#,
        123,
        method,
        payload
    ))
}

#[uniffi::export]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[uniffi::export]
pub fn initialize_database(_db_path: String) {}
