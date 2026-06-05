package com.goose.android.bridge
import com.goose.android.bridge.uniffi.goosecore.*
class GooseRustBridge {
    init { try { System.loadLibrary("goosecore") } catch (e: Exception) {} }
    fun request(m: String, p: String) = try { bridgeRequest(m, p) } catch (e: Exception) { "" }
}
