# Example app ProGuard rules
-keep class io.sablepay.example.** { *; }

# Keep SablePay SDK classes
-keep class io.sablepay.sdk.** { *; }
-keepclassmembers class io.sablepay.sdk.** { *; }

# Optimization flags for release builds
-optimizationpasses 5
-allowaccessmodification
-repackageclasses ''
