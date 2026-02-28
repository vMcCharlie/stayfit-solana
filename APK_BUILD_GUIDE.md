# How to Locally Bundle an APK for Android

Since you are using Expo, you have two main ways to bundle an APK locally. Because you don't have the `android` folder generated yet, we will use the **Prebuild + Gradle** method, which is reliable on Windows.

## Prerequisites
- **Android Studio** installed and configured.
- **Java (JDK)** installed (usually comes with Android Studio).
- **Android SDK** installed.

## Step 1: Generate Native Android Project
First, we need to generate the native Android code.

Run this command in your terminal:
```powershell
npx expo prebuild
```
*When asked to specify a package name, you can press Enter to accept the default or type one (e.g., `com.stayfit.app`).*

## Step 2: Build the APK
Once the `android` folder is created, navigate into it and run the Gradle build command.

```powershell
cd android
./gradlew assembleRelease
```
*Note: On Windows PowerShell, use `.\gradlew assembleRelease` if `./gradlew` doesn't work.*

## Step 3: Locate the APK
After the build finishes successfully, your APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

---

## Alternative: EAS Build (Web-based or Docker)
If you have **Docker** installed or prefer using the cloud:
```powershell
eas build -p android --profile preview --local
```
This uses your `eas.json` configuration to build locally using Docker.
