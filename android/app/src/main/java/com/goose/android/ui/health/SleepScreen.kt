package com.goose.android.ui.health
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.goose.android.model.GooseAppModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SleepScreen(model: GooseAppModel) {
    val sleepScore by model.healthDataStore.todaySleepScoreSummary.collectAsState()
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("Sleep") }) }) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Sleep Score", style = MaterialTheme.typography.labelLarge)
            Text(text = sleepScore.ifEmpty { "—" }, style = MaterialTheme.typography.displayLarge)
        }
    }
}
