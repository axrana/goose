plugins { alias(libs.plugins.android.application); alias(libs.plugins.kotlin.android) }
android {
    namespace = "com.goose.android"; compileSdk = 35
    defaultConfig { applicationId = "com.goose.android"; minSdk = 26; targetSdk = 35; versionCode = 1; versionName = "1.0" }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.10" }
    packaging { resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" } }
}
dependencies {
    implementation(libs.androidx.core.ktx); implementation(libs.androidx.lifecycle.runtime-ktx)
    implementation(libs.androidx.activity.compose); implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui); implementation(libs.androidx.material3)
    implementation(libs.androidx.navigation-compose); implementation(libs.nordic.ble)
    implementation(libs.androidx.health.connect); implementation(libs.kotlinx.coroutines-android)
    implementation(libs.jna); implementation(libs.okhttp); implementation(libs.kotlinx.serialization-json)
    implementation(libs.vico.compose.m3); implementation(libs.play.services.location); implementation(libs.androidx.work.runtime-ktx)
}
