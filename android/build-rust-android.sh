#!/bin/bash
if [ -z "$ANDROID_NDK_HOME" ] && [ -d "$ANDROID_SDK_ROOT/ndk/27.0.12077973" ]; then export ANDROID_NDK_HOME="$ANDROID_SDK_ROOT/ndk/27.0.12077973"; fi
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
cd ../Rust/core; cargo build --release
mkdir -p ../android/app/src/main/java/com/goose/android/bridge/uniffi
# Bindgen would run here in a full environment
