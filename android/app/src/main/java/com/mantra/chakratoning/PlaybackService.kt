package com.mantra.chakratoning

import android.content.Intent
import android.media.AudioAttributes as PlatformAttributes
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

/**
 * The one player of the app. It lives in a media session service, so the sound goes on with the screen off and the
 * lock screen and the notification show play / pause. The session timer, the fades and the bell live here too, so they
 * still happen when the activity is gone. The activity reaches it through [instance] (same process).
 */
class PlaybackService : MediaSessionService() {

    private var session: MediaSession? = null
    private lateinit var player: ExoPlayer
    private val main = Handler(Looper.getMainLooper())

    /** Which track is loaded: "guide", "earth", "water", "fire", "air", "ether", or "" for none. */
    var trackId: String = ""
        private set

    /** When the session timer ends (System.currentTimeMillis), 0 when no timer runs. */
    var timerEndsAt: Long = 0L
        private set

    private var fadeRunnable: Runnable? = null
    private var bell: MediaPlayer? = null

    override fun onCreate() {
        super.onCreate()
        player = ExoPlayer.Builder(this)
            .setAudioAttributes(
                AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(),
                /* handleAudioFocus = */ true
            )
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build()
        session = MediaSession.Builder(this, player).build()
        instance = this
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    override fun onTaskRemoved(rootIntent: Intent?) {
        if (!player.playWhenReady || player.mediaItemCount == 0) stopSelf()
    }

    override fun onDestroy() {
        instance = null
        main.removeCallbacksAndMessages(null)
        bell?.release(); bell = null
        session?.run { player.release(); release() }
        session = null
        super.onDestroy()
    }

    // ---- what the activity asks for -------------------------------------------------------------------------------

    fun play(id: String, loop: Boolean, title: String) {
        cancelFade()
        val file = if (id == "guide") "guide.mp3" else "$id.ogg"
        val item = MediaItem.Builder()
            .setMediaId(id)
            .setUri("asset:///web/audio/$file")
            .setMediaMetadata(
                MediaMetadata.Builder().setTitle(title).setArtist("DJ Mantra")
                    .setAlbumTitle("Chakra and Elements Toning").build()
            )
            .build()
        trackId = id
        player.setMediaItem(item)
        player.repeatMode = if (loop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
        player.volume = 0f
        player.prepare()
        player.play()
        fadeTo(1f, 3000L, null)
    }

    fun pause() { cancelFade(); player.pause(); player.volume = 1f }

    fun resume() {
        if (player.mediaItemCount == 0) return
        if (player.playbackState == Player.STATE_ENDED) player.seekTo(0)
        player.volume = 0f
        player.play()
        fadeTo(1f, 1500L, null)
    }

    /** A slow fade, then the player stops and forgets the track. */
    fun stop(fadeMs: Long) {
        fadeTo(0f, fadeMs) {
            player.stop(); player.clearMediaItems(); player.volume = 1f; trackId = ""
        }
    }

    fun seek(ms: Long) { if (player.mediaItemCount > 0) player.seekTo(ms.coerceAtLeast(0L)) }

    /** minutes = 0 cancels. At the end: a 12 s fade, the sound stops, the bell rings once. */
    fun setTimer(minutes: Int) {
        main.removeCallbacks(timerEnd)
        if (minutes <= 0) { timerEndsAt = 0L; return }
        val ms = minutes * 60_000L
        timerEndsAt = System.currentTimeMillis() + ms
        main.postDelayed(timerEnd, ms)
    }

    private val timerEnd = Runnable {
        timerEndsAt = 0L
        fadeTo(0f, 12_000L) {
            player.pause(); player.volume = 1f
            ringBell()
        }
    }

    fun ringBell() {
        try {
            bell?.release()
            val fd = assets.openFd("web/audio/bell.ogg")
            bell = MediaPlayer().apply {
                setAudioAttributes(
                    PlatformAttributes.Builder().setUsage(PlatformAttributes.USAGE_MEDIA)
                        .setContentType(PlatformAttributes.CONTENT_TYPE_MUSIC).build()
                )
                setDataSource(fd.fileDescriptor, fd.startOffset, fd.length)
                fd.close()
                setOnCompletionListener { it.release(); if (bell === it) bell = null }
                prepare()
                start()
            }
        } catch (_: Exception) { /* no bell is better than a crash */ }
    }

    val isPlaying: Boolean get() = player.isPlaying
    val positionMs: Long get() = player.currentPosition
    val durationMs: Long get() = player.duration.let { if (it == C.TIME_UNSET) 0L else it }

    // ---- fades ----------------------------------------------------------------------------------------------------

    private fun cancelFade() { fadeRunnable?.let { main.removeCallbacks(it) }; fadeRunnable = null }

    private fun fadeTo(target: Float, ms: Long, then: (() -> Unit)?) {
        cancelFade()
        val start = player.volume
        val t0 = System.currentTimeMillis()
        val r = object : Runnable {
            override fun run() {
                val k = ((System.currentTimeMillis() - t0).toFloat() / ms).coerceIn(0f, 1f)
                // an equal-power curve sounds even to the ear
                val curve = if (target > start) Math.sin(k * Math.PI / 2).toFloat() else Math.cos((1 - k) * Math.PI / 2).toFloat()
                player.volume = if (target > start) start + (target - start) * curve else target + (start - target) * (1 - curve)
                if (k < 1f) main.postDelayed(this, 40L) else { fadeRunnable = null; then?.invoke() }
            }
        }
        fadeRunnable = r
        main.post(r)
    }

    companion object {
        @Volatile var instance: PlaybackService? = null
    }
}
