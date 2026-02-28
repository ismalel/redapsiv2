# REDAPSI v2 — Mobile (KMM)

## 1. Overview
The REDAPSI v2 Mobile applications are built with Kotlin Multiplatform Mobile (KMM). They share logic (networking, auth, domain models) in the `shared` module and have native UIs for each platform.

- **Android App**: Jetpack Compose
- **iOS App**: SwiftUI

## 2. Prerequisites
- **Android Studio**: Ladybug or later.
- **Xcode**: 15.0 or later (macOS required for iOS).
- **JDK**: 17.0 or higher.
- **Kotlin Multiplatform Plugin**: Installed in Android Studio.

## 3. Environment Setup
The API base URL is configured per target:
- **Android Emulator**: `http://10.0.2.2:3000`
- **iOS Simulator**: `http://localhost:3000`

## 4. Running Android
1. Open the project in Android Studio.
2. Select the `androidApp` configuration.
3. Choose an emulator or physical device.
4. Click **Run**.

Note: Ensure the backend is running via Docker Compose.

## 5. Running iOS
1. Open the `iosApp/iosApp.xcworkspace` in Xcode.
2. Select the `iosApp` scheme.
3. Choose an iOS Simulator.
4. Click **Run**.

Note: Ensure the backend is running via Docker Compose.

## 6. Running Shared Tests
All shared logic tests are run using Gradle:

```bash
# Run all shared module tests
./gradlew shared:test

# Generate shared module coverage report
./gradlew shared:koverReport
```
Report will be available at `shared/build/reports/kover/html/index.html`.
