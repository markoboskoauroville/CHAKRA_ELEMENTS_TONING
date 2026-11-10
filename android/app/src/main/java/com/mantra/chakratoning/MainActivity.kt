package com.mantra.chakratoning

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import androidx.webkit.WebViewAssetLoader
import com.google.common.util.concurrent.ListenableFuture
import org.json.JSONObject

/**
 * One WebView holds the whole interface (assets/web): the guide with the MilkDrop engine (butterchurn), the five
 * element stripes, the breath pacer, the log. The sound is native (PlaybackService), the page only shows it.
 *
 * Bars (MANTRA_MANIFEST system-bars.md §0): NORMAL mode pads the root by the status bar, the navigation bar and the
 * camera cut-out, so nothing is drawn under them; FULL SCREEN (the visualizations) hides the bars, a swipe brings
 * them back for a moment.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private val main = Handler(Looper.getMainLooper())
    private var controllerFuture: ListenableFuture<MediaController>? = null

    /** Updated on the main thread every 250 ms; the page reads it from its own thread. */
    @Volatile private var snapshot: String = "{}"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val root = FrameLayout(this)
        root.setBackgroundColor(0xFF000000.toInt())
        web = WebView(this)
        root.addView(web, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)

        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val i = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            v.setPadding(i.left, i.top, i.right, i.bottom)
            WindowInsetsCompat.CONSUMED
        }

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.mediaPlaybackRequiresUserGesture = false
        web.settings.allowFileAccess = false
        web.setBackgroundColor(0xFF000000.toInt())
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)
        }
        web.addJavascriptInterface(Bridge(), "Native")
        web.loadUrl("https://appassets.androidplatform.net/assets/web/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.appBack ? window.appBack() : false") { r ->
                    if (r != "true") moveTaskToBack(true)   // the sound goes on; the notification brings it back
                }
            }
        })

        // Connecting a controller starts the service and hands it the session (lock screen, notification).
        val token = SessionToken(this, ComponentName(this, PlaybackService::class.java))
        controllerFuture = MediaController.Builder(this, token).buildAsync()

        main.post(tick)
        maybePin(intent)
    }

    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); maybePin(intent) }

    /** `am start -n com.mantra.chakratoning/.MainActivity --ez pin true` asks the launcher to put the icon on the home
     *  screen (ShortcutManager.requestPinShortcut; the launcher shows its own Add dialog). Marko 10.11.2026: "leave its
     *  icon on the desktop". Same as MPA Academy. */
    private fun maybePin(i: Intent?) {
        if (i?.getBooleanExtra("pin", false) != true) return
        val sm = getSystemService(android.content.pm.ShortcutManager::class.java) ?: return
        if (!sm.isRequestPinShortcutSupported) return
        val open = Intent(this, MainActivity::class.java).setAction(Intent.ACTION_MAIN)
        val info = android.content.pm.ShortcutInfo.Builder(this, "toning-home")
            .setShortLabel(getString(R.string.launcher_name))
            .setIcon(android.graphics.drawable.Icon.createWithResource(this, R.mipmap.ic_launcher))
            .setIntent(open).build()
        sm.requestPinShortcut(info, null)
    }

    private val tick = object : Runnable {
        override fun run() {
            val s = PlaybackService.instance
            val o = JSONObject()
            if (s != null) {
                o.put("id", s.trackId)
                o.put("playing", s.isPlaying)
                o.put("pos", s.positionMs)
                o.put("dur", s.durationMs)
                o.put("timerLeft", if (s.timerEndsAt > 0) (s.timerEndsAt - System.currentTimeMillis()).coerceAtLeast(0) else 0)
            } else {
                o.put("id", ""); o.put("playing", false); o.put("pos", 0); o.put("dur", 0); o.put("timerLeft", 0)
            }
            snapshot = o.toString()
            main.postDelayed(this, 250L)
        }
    }

    override fun onDestroy() {
        main.removeCallbacksAndMessages(null)
        controllerFuture?.let { MediaController.releaseFuture(it) }
        web.destroy()
        super.onDestroy()
    }

    private fun immersive(on: Boolean) {
        val c = WindowInsetsControllerCompat(window, window.decorView)
        if (on) {
            c.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            c.hide(WindowInsetsCompat.Type.systemBars())
        } else {
            c.show(WindowInsetsCompat.Type.systemBars())
        }
    }

    /** What the page may ask. Every call arrives on a WebView thread and is moved to the main thread. */
    inner class Bridge {
        private fun ui(block: () -> Unit) = main.post(block)
        private fun svc(block: (PlaybackService) -> Unit) = ui { PlaybackService.instance?.let(block) }

        @JavascriptInterface fun play(id: String, loop: Boolean, title: String) = svc { it.play(id, loop, title) }
        @JavascriptInterface fun pause() = svc { it.pause() }
        @JavascriptInterface fun resume() = svc { it.resume() }
        @JavascriptInterface fun stop(fadeMs: Int) = svc { it.stop(fadeMs.toLong()) }
        @JavascriptInterface fun seek(ms: Double) = svc { it.seek(ms.toLong()) }
        @JavascriptInterface fun setTimer(minutes: Int) = svc { it.setTimer(minutes) }
        @JavascriptInterface fun bell() = svc { it.ringBell() }
        @JavascriptInterface fun state(): String = snapshot
        @JavascriptInterface fun version(): String = BuildConfig.VERSION_NAME
        @JavascriptInterface fun immersive(on: Boolean) = ui { this@MainActivity.immersive(on) }
        @JavascriptInterface fun keepAwake(on: Boolean) = ui {
            if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        @JavascriptInterface fun openUrl(url: String) = ui {
            try { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (_: Exception) { }
        }
    }
}
