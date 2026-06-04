package com.goose.android.ui.health
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.goose.android.model.GooseAppModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StressScreen(model: GooseAppModel) {
    Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("Stress") }) }) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Stress Score", style = MaterialTheme.typography.labelLarge)
            Text(text = "—", style = MaterialTheme.typography.displayLarge)
        }
    }
}
