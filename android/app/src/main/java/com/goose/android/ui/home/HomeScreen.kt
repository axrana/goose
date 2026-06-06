package com.goose.android.ui.home
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import com.goose.android.data.HealthDataStore
@Composable
fun HomeScreen(ds: HealthDataStore) {
    val r by ds.recoverySummary.collectAsState()
    Text("Goose Home. Recovery: $r")
}
