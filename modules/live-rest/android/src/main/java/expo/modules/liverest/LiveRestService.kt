package expo.modules.liverest

import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log

class LiveRestService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private val tick = Runnable { update() }
  private var foreground = false
  private lateinit var wakeLock: PowerManager.WakeLock
  private var wakeLockEndMs: Long? = null

  override fun onCreate() {
    super.onCreate()
    wakeLock = getSystemService(PowerManager::class.java)
      .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "$packageName:LiveRest")
      .apply { setReferenceCounted(false) }
    LiveRestNotification.service = this
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    update()
    return START_NOT_STICKY
  }

  fun update() {
    handler.removeCallbacks(tick)
    val options = LiveRestNotification.current
    val endMs = options?.rest?.endMs
    val nowMs = System.currentTimeMillis()
    if (options == null || endMs == null || endMs <= nowMs) {
      if (options != null) LiveRestNotification.post(this, options)
      detachAndStop()
      return
    }
    val notification = LiveRestNotification.build(this, options)
    try {
      if (!foreground) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
          startForeground(LiveRestNotification.ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
          startForeground(LiveRestNotification.ID, notification)
        }
        foreground = true
      } else {
        LiveRestNotification.post(this, options)
      }
      if (!wakeLock.isHeld || wakeLockEndMs != endMs) {
        wakeLock.acquire(endMs - nowMs + 1000L)
        wakeLockEndMs = endMs
      }
    } catch (exception: RuntimeException) {
      if (!LiveRestNotification.isStartRestricted(exception)) throw exception
      Log.w("LiveRest", "Rest service promotion unavailable; keeping ordinary notification", exception)
      detachAndStop()
      LiveRestNotification.post(this, options)
      return
    }
    handler.postDelayed(tick, minOf(1000L, endMs - nowMs))
  }

  fun detachAndStop() {
    handler.removeCallbacks(tick)
    releaseWakeLock()
    stopForeground(STOP_FOREGROUND_DETACH)
    foreground = false
    if (LiveRestNotification.service === this) LiveRestNotification.service = null
    stopSelf()
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    LiveRestNotification.hide(this)
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    releaseWakeLock()
    if (LiveRestNotification.service === this) LiveRestNotification.service = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun releaseWakeLock() {
    if (wakeLock.isHeld) wakeLock.release()
    wakeLockEndMs = null
  }
}
