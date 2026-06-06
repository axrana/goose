package com.goose.android
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*
import com.goose.android.ui.home.HomeScreen
import com.goose.android.ui.health.HealthScreen
import com.goose.android.ui.coach.CoachScreen
import com.goose.android.ui.more.MoreScreen
import com.goose.android.ui.onboarding.OnboardingScreen
import com.goose.android.ui.shared.GooseTheme
import com.goose.android.model.GooseAppModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val model = GooseAppModel(applicationContext)
        setContent {
            GooseTheme {
                val complete by model.onboardingComplete.collectAsState()
                if (!complete) {
                    OnboardingScreen { model.onboardingComplete.value = true }
                } else {
                    val navController = rememberNavController()
                    Scaffold(
                        bottomBar = {
                            NavigationBar {
                                NavigationBarItem(icon = { Icon(Icons.Default.Home, null) }, label = { Text("Home") }, selected = true, onClick = {})
                                NavigationBarItem(icon = { Icon(Icons.Default.Favorite, null) }, label = { Text("Health") }, selected = false, onClick = {})
                                NavigationBarItem(icon = { Icon(Icons.Default.Face, null) }, label = { Text("Coach") }, selected = false, onClick = {})
                                NavigationBarItem(icon = { Icon(Icons.Default.Menu, null) }, label = { Text("More") }, selected = false, onClick = {})
                            }
                        }
                    ) { innerPadding ->
                        NavHost(navController, startDestination = "home", modifier = Modifier.padding(innerPadding)) {
                            composable("home") { HomeScreen(model.healthDataStore) }
                            composable("health") { HealthScreen() }
                            composable("coach") { CoachScreen() }
                            composable("more") { MoreScreen() }
                        }
                    }
                }
            }
        }
    }
}
