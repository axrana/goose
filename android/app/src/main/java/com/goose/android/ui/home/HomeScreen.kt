package com.goose.android.ui.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Today", style = MaterialTheme.typography.headlineLarge)
        Spacer(Modifier.height(16.dp))

        LazyRow {
            item { MetricGauge("RECOVERY", "—", Color(0xFF00ADB5)) }
            item { MetricGauge("STRAIN", "—", Color(0xFF3F51B5)) }
            item { MetricGauge("SLEEP", "—", Color(0xFF673AB7)) }
        }

        Spacer(Modifier.height(24.dp))
        Text("Device Status", style = MaterialTheme.typography.titleLarge)
        Card(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("WHOOP 5.0", style = MaterialTheme.typography.titleMedium)
                Text("Disconnected", color = Color.Gray)
            }
        }
    }
}
