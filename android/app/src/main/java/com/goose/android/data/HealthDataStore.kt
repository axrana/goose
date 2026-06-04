package com.goose.android.data
import com.goose.android.bridge.GooseRustBridge
import kotlinx.coroutines.flow.*
class HealthDataStore(private val bridge: GooseRustBridge) {
    val todaySleepScoreSummary = MutableStateFlow("—")
    val todayRecoveryScoreSummary = MutableStateFlow("—")
    val todayStrainScoreSummary = MutableStateFlow("—")
    fun refreshPacketInputs() {}
    fun loadTodaySnapshots() {}
}
