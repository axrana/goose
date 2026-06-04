package com.goose.android.ble
import com.goose.android.bridge.GooseRustBridge
class WhoopPacketHandler(private val bridge: GooseRustBridge) {
    fun handleEventFrame(bytes: ByteArray) {}
    fun handleDataFrame(bytes: ByteArray) {}
}
