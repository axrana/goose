package com.goose.android.ble
import android.app.*
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
class GooseBLEService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "goose_ble"
        val channel = NotificationChannel(channelId, "Goose BLE", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        val notification = NotificationCompat.Builder(this, channelId).setContentTitle("Goose").setContentText("Connected to WHOOP 5.0").setSmallIcon(android.R.drawable.stat_sys_data_bluetooth).build()
        startForeground(1, notification)
        return START_STICKY
    }
    override fun onBind(intent: Intent?): IBinder? = null
}
