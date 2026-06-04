package com.goose.android.model
import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.goose.android.ble.GooseBLEManager
import com.goose.android.ble.WhoopPacketHandler
import com.goose.android.bridge.GooseRustBridge
import com.goose.android.data.HealthDataStore
import com.goose.android.health.HealthConnectManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
class GooseAppModel(application: Application) : AndroidViewModel(application) {
    val bridge = GooseRustBridge()
    val packetHandler = WhoopPacketHandler(bridge)
    val bleManager = GooseBLEManager(application, viewModelScope, packetHandler)
    val healthConnectManager = HealthConnectManager(application)
    val healthDataStore = HealthDataStore(bridge)
    private val _onboardingComplete = MutableStateFlow(false)
    val onboardingComplete = _onboardingComplete.asStateFlow()
    init {
        viewModelScope.launch {
            healthDataStore.refreshPacketInputs()
            healthDataStore.loadTodaySnapshots()
        }
    }
    fun setOnboardingComplete(complete: Boolean) {
        _onboardingComplete.value = complete
    }
}
