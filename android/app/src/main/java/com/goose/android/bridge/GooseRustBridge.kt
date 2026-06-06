package com.goose.android.bridge
import com.goose.android.bridge.uniffi.goose_core.*
class GooseRustBridge {
    init { try { System.loadLibrary("goose_core") } catch (e: Exception) {} }
    fun request(m: String, p: String) = try { bridgeRequest(m, p) } catch (e: Exception) { "" }
}
