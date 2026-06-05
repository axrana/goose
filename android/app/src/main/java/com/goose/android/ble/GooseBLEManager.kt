package com.goose.android.ble
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import no.nordicsemi.android.ble.BleManager
import java.util.*
class GooseBLEManager(context: Context, private val packetHandler: WhoopPacketHandler) : BleManager(context) {
    val connectionState = MutableStateFlow(BLEConnectionState.Disconnected)
    val discoveredDevices = MutableStateFlow<List<DiscoveredWhoopDevice>>(emptyList())
    private var e: BluetoothGattCharacteristic? = null
    private var c: BluetoothGattCharacteristic? = null
    private var d: BluetoothGattCharacteristic? = null
    override fun getGattCallback() = object : BleManagerGattCallback() {
        override fun isRequiredServiceSupported(gatt: BluetoothGatt): Boolean {
            val s = gatt.getService(WhoopGattProfile.SERVICE_UUID)
            if (s != null) {
                c = s.getCharacteristic(WhoopGattProfile.CMD_TO_STRAP_UUID)
                e = s.getCharacteristic(WhoopGattProfile.EVENTS_FROM_STRAP_UUID)
                d = s.getCharacteristic(WhoopGattProfile.DATA_FROM_STRAP_UUID)
            }
            return c != null && e != null && d != null
        }
        override fun initialize() {
            requestMtu(512).enqueue()
            setNotificationCallback(e).with { _, data -> packetHandler.handlePacket(WhoopGattProfile.EVENTS_FROM_STRAP_UUID.toString(), data.value ?: byteArrayOf()) }
            setNotificationCallback(d).with { _, data -> packetHandler.handlePacket(WhoopGattProfile.DATA_FROM_STRAP_UUID.toString(), data.value ?: byteArrayOf()) }
            enableNotifications(e).enqueue(); enableNotifications(d).enqueue()
            connectionState.value = BLEConnectionState.Connected
        }
        override fun onServicesInvalidated() { connectionState.value = BLEConnectionState.Disconnected }
    }
    fun connectToDevice(device: BluetoothDevice) { connectionState.value = BLEConnectionState.Connecting; connect(device).retry(3, 100).enqueue() }
}
