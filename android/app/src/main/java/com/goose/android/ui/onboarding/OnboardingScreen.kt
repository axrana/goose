package com.goose.android.ui.onboarding
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
@Composable
fun OnboardingScreen(onComplete: () -> Unit) { Button(onClick = onComplete) { Text("Finish Onboarding") } }
