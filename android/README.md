# SablePay Android SDK Example

This example demonstrates integrating the SablePay Android SDK for stablecoin payments.

## Requirements

- Android Studio Hedgehog (2023.1.1)+
- Android 10+ (API 29+) device/emulator
- SablePay merchant account

## Quick Start

### 1. Configure Credentials

`ash
cp local.properties.example local.properties
`

Edit `local.properties`:
`properties
sablepay.apiKey=sable_sk_sand_YOUR_API_KEY
sablepay.merchantId=00000000-0000-0000-0000-000000000000
`

### 2. Build & Run

`ash
./gradlew installDebug
`

Or open in Android Studio and click **Run**.

## Integration

Add to your `app/build.gradle.kts`:

`kotlin
dependencies {
    implementation("io.sablepay:sdk:1.0.0")
}
`

See the [main README](../README.md) for full integration guide.
