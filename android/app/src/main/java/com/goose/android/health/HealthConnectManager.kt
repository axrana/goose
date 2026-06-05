package com.goose.android.health
import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
class HealthConnectManager(context: Context) {
    private val client by lazy { HealthConnectClient.getOrCreate(context) }
    val permissions = setOf(HealthPermission.getReadPermission(HeartRateRecord::class))
    suspend fun hasPerms() = client.permissionController.getGrantedPermissions().containsAll(permissions)
}
