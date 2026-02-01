import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.parcelize")
}

android {
    namespace = "io.sablepay.example"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.sablepay.example"
        minSdk = 29
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Read credentials from local.properties
        val localPropertiesFile = rootProject.file("local.properties")
        val localProperties = Properties()
        if (localPropertiesFile.exists()) {
            localPropertiesFile.inputStream().buffered().use { input ->
                localProperties.load(input)
            }
        }

        val apiKey = localProperties.getProperty("sablepay.apiKey", "")
        val merchantId = localProperties.getProperty("sablepay.merchantId", "")
        val baseUrl = localProperties.getProperty("sablepay.baseUrl", "https://sandbox.api.sablepay.com/api/v1/")

        buildConfigField("String", "SABLEPAY_API_KEY", "\""$apiKey\"")
        buildConfigField("String", "SABLEPAY_MERCHANT_ID", "\""$merchantId\"")
        buildConfigField("String", "SABLEPAY_BASE_URL", "\""$baseUrl\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = "11"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    // =====================================================
    // SablePay Android SDK
    // =====================================================
    implementation("io.sablepay:sdk:1.0.0")
    // =====================================================

    // Kotlin
    implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.21")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Android
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.activity:activity-ktx:1.8.1")
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2")

    // UI
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    // QR Code generation
    implementation("com.google.zxing:core:3.5.2")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
