fn main() {
    uniffi::generate_scaffolding("src/android_bridge.udl").unwrap();
}
