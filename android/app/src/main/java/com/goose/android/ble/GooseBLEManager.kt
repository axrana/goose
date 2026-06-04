package com.goose.android.ble
import android.annotation.SuppressLint
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import no.nordicsemi.android.ble.BleManager
import java.util.*
enum class BLEConnectionState { DISCONNECTED, CONNECTING, CONNECTED, READY, RECONNECTING }
@SuppressLint("MissingPermission")
class GooseBLEManager(context: Context, private val scope: CoroutineScope, private val packetHandler: WhoopPacketHandler) : BleManager(context) {
    private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    private val _connectionState = MutableStateFlow(BLEConnectionState.DISCONNECTED)
    val connectionState = _connectionState.asStateFlow()
    private val _discoveredDevices = MutableStateFlow<List<String>>(emptyList())
    val discoveredDevices = _discoveredDevices.asStateFlow()
    fun startScan() {
        val adapter = bluetoothManager.adapter ?: return
        if (!adapter.isEnabled) return
        adapter.bluetoothLeScanner?.startScan(null, ScanSettings.Builder().build(), object : ScanCallback() {})
    }
    override fun getGattCallback(): BleManagerGattCallback = object : BleManagerGattCallback() {
        override fun isRequiredServiceSupported(gatt: BluetoothGatt): Boolean = true
        override fun initialize() {}
        override fun onServicesInvalidated() {}
    }
}
