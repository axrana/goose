package com.goose.android.ui.health
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.goose.android.model.GooseAppModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecoveryScreen(model: GooseAppModel) {
    val recoveryScore by model.healthDataStore.todayRecoveryScoreSummary.collectAsState()
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("Recovery") }) }) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Recovery Score", style = MaterialTheme.typography.labelLarge)
            Text(text = recoveryScore.ifEmpty { "—" }, style = MaterialTheme.typography.displayLarge)
        }
    }
}
