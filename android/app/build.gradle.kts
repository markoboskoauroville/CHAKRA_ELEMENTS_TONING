plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val appVersion = (project.findProperty("appVersion") as String? ?: "1").trim().toInt()

// THE VERSION IN THE ICON (MANTRA_MANIFEST version-visible.md §2, copied from MANTRA_NDI): a vector drawable has
// no text, so "vN" is drawn as seven-segment strokes under the symbol. Template: src/main/icon.
val versionIconDir = layout.buildDirectory.dir("generated/versionIcon").get().asFile
run {
    val segments = mapOf(
        'a' to "M0,0 H5", 'b' to "M5,0 V5", 'c' to "M5,5 V10", 'd' to "M0,10 H5",
        'e' to "M0,5 V10", 'f' to "M0,0 V5", 'g' to "M0,5 H5"
    )
    val digits = mapOf(
        '0' to "abcdef", '1' to "bc", '2' to "abged", '3' to "abgcd", '4' to "fgbc",
        '5' to "afgcd", '6' to "afgedc", '7' to "abc", '8' to "abcdefg", '9' to "abcdfg"
    )
    val text = "v$appVersion"
    val cell = 5.0
    val gap = 2.2
    val width = text.length * cell + (text.length - 1) * gap
    val left = 54.0 - width / 2
    val top = 64.0
    val paths = StringBuilder()
    text.forEachIndexed { i, ch ->
        val x = left + i * (cell + gap)
        val data = if (ch == 'v') "M0,4 L2.5,10 L5,4"
            else digits[ch].orEmpty().map { segments.getValue(it) }.joinToString(" ")
        val moved = Regex("([MLHV])([-0-9.]+)(,([-0-9.]+))?").replace(data) { m ->
            val cmd = m.groupValues[1]
            val a = m.groupValues[2].toDouble()
            val b = m.groupValues[4].takeIf { it.isNotEmpty() }?.toDouble()
            fun n(v: Double) = (Math.round(v * 100) / 100.0).toString()
            when (cmd) {
                "H" -> "H" + n(a + x)
                "V" -> "V" + n(a + top)
                else -> cmd + n(a + x) + "," + n((b ?: 0.0) + top)
            }
        }
        paths.append("    <path android:strokeColor=\"#E6E8EA\" android:strokeWidth=\"1.5\" ")
            .append("android:strokeLineCap=\"round\" android:strokeLineJoin=\"round\" ")
            .append("android:pathData=\"").append(moved).append("\" />\n")
    }
    val template = file("src/main/icon/ic_launcher_foreground.xml").readText()
    val out = File(versionIconDir, "drawable/ic_launcher_foreground.xml")
    out.parentFile.mkdirs()
    out.writeText(template.replace("    <!--VERSION-->\n", "    <!-- v$appVersion, generated -->\n$paths"))
}

android {
    namespace = "com.mantra.chakratoning"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.mantra.chakratoning"
        minSdk = 29
        targetSdk = 35
        versionCode = appVersion
        versionName = appVersion.toString()
    }

    sourceSets["main"].res.srcDir(versionIconDir)

    // The GitHub build signs with the saved key (secret ANDROID_DEBUG_KEYSTORE_B64 → $DEBUG_KEYSTORE), so every
    // version installs over the last one (MANTRA_MANIFEST workflows/README.md).
    System.getenv("DEBUG_KEYSTORE")?.let { ks ->
        signingConfigs.getByName("debug") {
            storeFile = file(ks); storePassword = "android"; keyAlias = "androiddebugkey"; keyPassword = "android"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    androidResources {
        // the audio is already compressed; keep it stored so ExoPlayer can read it straight from the APK
        noCompress += listOf("mp3", "ogg")
    }
    applicationVariants.all {
        outputs.all {
            (this as com.android.build.gradle.internal.api.BaseVariantOutputImpl).outputFileName =
                "$appVersion-chakra-elements-toning-v$appVersion.apk"
        }
    }
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.media3:media3-exoplayer:1.4.1")
    implementation("androidx.media3:media3-session:1.4.1")
}

kotlin { compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) } }
