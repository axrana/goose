package com.goose.android.bridge
import uniffi.goosecore.bridge_request
import uniffi.goosecore.get_version
import uniffi.goosecore.initialize_database
class GooseRustBridge {
    companion object {
        init { try { System.loadLibrary("goosecore") } catch (e: UnsatisfiedLinkError) {} }
    }
    fun bridgeRequest(method: String, payload: String = "{}"): String {
        return try { bridge_request(method, payload) } catch (e: Exception) { "Unavailable" }
    }
}
