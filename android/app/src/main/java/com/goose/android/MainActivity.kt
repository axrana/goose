package com.goose.android
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.*
import com.goose.android.model.GooseAppModel
import com.goose.android.ui.coach.CoachScreen
import com.goose.android.ui.health.HealthScreen
import com.goose.android.ui.home.HomeScreen
import com.goose.android.ui.more.MoreScreen
import com.goose.android.ui.shared.GooseTheme
import com.goose.android.ui.onboarding.OnboardingScreen
class MainActivity : ComponentActivity() {
    private val model: GooseAppModel by viewModels()
    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            GooseTheme {
                val onboardingComplete by model.onboardingComplete.collectAsState()
                if (!onboardingComplete) { OnboardingScreen(model) } else { MainLayout(model) }
            }
        }
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainLayout(model: GooseAppModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(icon = { Icon(Icons.Default.Home, null) }, label = { Text("Home") }, selected = currentRoute == "home", onClick = { navController.navigate("home") })
                NavigationBarItem(icon = { Icon(Icons.Default.Favorite, null) }, label = { Text("Health") }, selected = currentRoute == "health", onClick = { navController.navigate("health") })
                NavigationBarItem(icon = { Icon(Icons.Default.Chat, null) }, label = { Text("Coach") }, selected = currentRoute == "coach", onClick = { navController.navigate("coach") })
                NavigationBarItem(icon = { Icon(Icons.Default.MoreHoriz, null) }, label = { Text("More") }, selected = currentRoute == "more", onClick = { navController.navigate("more") })
            }
        }
    ) { padding ->
        NavHost(navController = navController, startDestination = "home", modifier = Modifier.padding(padding)) {
            composable("home") { HomeScreen(model) }; composable("health") { HealthScreen(model) }; composable("coach") { CoachScreen(model) }; composable("more") { MoreScreen(model) }
        }
    }
}
