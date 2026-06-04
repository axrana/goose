package com.goose.android.ui.health
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.goose.android.model.GooseAppModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StrainScreen(model: GooseAppModel) {
    val strainScore by model.healthDataStore.todayStrainScoreSummary.collectAsState()
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("Strain") }) }) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Strain Score", style = MaterialTheme.typography.labelLarge)
            Text(text = strainScore.ifEmpty { "—" }, style = MaterialTheme.typography.displayLarge)
        }
    }
}
