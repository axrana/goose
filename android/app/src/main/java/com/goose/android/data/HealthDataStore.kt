package com.goose.android.data
import com.goose.android.bridge.GooseRustBridge
import kotlinx.coroutines.flow.MutableStateFlow
import org.json.JSONObject
class HealthDataStore(private val bridge: GooseRustBridge) {
    val recoverySummary = MutableStateFlow("—")
    fun refresh() {
        val res = bridge.request("metrics.snapshot", "{}")
        if (res.isNotEmpty()) {
            val json = JSONObject(res).optJSONObject("metrics")
            json?.optJSONObject("recovery")?.let { recoverySummary.value = it.optString("score_summary", "—") }
        }
    }
}
