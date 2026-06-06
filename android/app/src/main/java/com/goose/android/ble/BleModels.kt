package com.goose.android.ble
data class DiscoveredWhoopDevice(val name: String?, val address: String, val rssi: Int)
enum class BLEConnectionState { Disconnected, Scanning, Connecting, Connected }
