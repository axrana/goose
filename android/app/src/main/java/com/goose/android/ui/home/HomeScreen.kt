package com.goose.android.ui.home
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.goose.android.model.GooseAppModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(model: GooseAppModel) {
    val connectionState by model.bleManager.connectionState.collectAsState()
    val sleepScore by model.healthDataStore.todaySleepScoreSummary.collectAsState()
    val recoveryScore by model.healthDataStore.todayRecoveryScoreSummary.collectAsState()
    val strainScore by model.healthDataStore.todayStrainScoreSummary.collectAsState()
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("Goose") }) }) { padding ->
        LazyColumn(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item { Card { Column(modifier = Modifier.padding(16.dp)) { Text("WHOOP Status", style = MaterialTheme.typography.titleMedium); Text("State: $connectionState") } } }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ScoreCard("Sleep", sleepScore, Modifier.weight(1f))
                    ScoreCard("Recovery", recoveryScore, Modifier.weight(1f))
                    ScoreCard("Strain", strainScore, Modifier.weight(1f))
                }
            }
        }
    }
}
@Composable
fun ScoreCard(label: String, score: String, modifier: Modifier) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(8.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall)
            Text(text = score.ifEmpty { "—" }, style = MaterialTheme.typography.headlineMedium)
        }
    }
}
