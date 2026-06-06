package com.goose.android.ble
import java.util.UUID
object WhoopGattProfile {
    val SERVICE_UUID = UUID.fromString("61080001-8d6d-82b8-614a-1c8cb0f8dcc6")
    val CMD_TO_STRAP_UUID = UUID.fromString("61080002-8d6d-82b8-614a-1c8cb0f8dcc6")
    val EVENTS_FROM_STRAP_UUID = UUID.fromString("61080003-8d6d-82b8-614a-1c8cb0f8dcc6")
    val DATA_FROM_STRAP_UUID = UUID.fromString("61080004-8d6d-82b8-614a-1c8cb0f8dcc6")
    const val DEVICE_NAME_PREFIX = "WHOOP"
    val CMD_HELLO = byteArrayOf(0x20, 0x00, 0x00)
}
