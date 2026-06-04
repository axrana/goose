#!/usr/bin/env bash
set -e
export ANDROID_NDK_HOME="$HOME/Android/Sdk/ndk/27.0.12077973"
if ! command -v cargo-ndk &> /dev/null; then cargo install cargo-ndk --locked; fi
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android 2>/dev/null || true
RUST_CORE_DIR="$(cd "$(dirname "$0")/../RustCore" && pwd)"
OUTPUT_DIR="$(cd "$(dirname "$0")" && pwd)/app/src/main/jniLibs"
mkdir -p "$OUTPUT_DIR"
cd "$RUST_CORE_DIR"
cargo ndk -t arm64-v8a -t armeabi-v7a -t x86_64 -t x86 -o "$OUTPUT_DIR" build --release
