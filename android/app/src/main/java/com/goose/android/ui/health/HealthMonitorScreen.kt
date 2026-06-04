package com.goose.android.ui.health
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.goose.android.model.GooseAppModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HealthMonitorScreen(model: GooseAppModel) {
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("Health Monitor") }) }) { padding ->
        Text("Health Monitor", modifier = Modifier.padding(padding))
    }
}
