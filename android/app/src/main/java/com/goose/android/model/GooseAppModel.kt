package com.goose.android.model
import android.content.Context
import androidx.lifecycle.ViewModel
import com.goose.android.bridge.GooseRustBridge
import com.goose.android.ble.*
import com.goose.android.data.HealthDataStore
import kotlinx.coroutines.flow.MutableStateFlow
class GooseAppModel(context: Context) : ViewModel() {
    val bridge = GooseRustBridge()
    val packetHandler = WhoopPacketHandler(bridge)
    val bleManager = GooseBLEManager(context, packetHandler)
    val healthDataStore = HealthDataStore(bridge)
    val onboardingComplete = MutableStateFlow(false)
}
