package expo.modules.liverest

import android.app.ForegroundServiceStartNotAllowedException
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

data class RestWindow(val startMs: Long, val endMs: Long, val key: String? = null)
data class WorkoutNotification(val title: String, val lines: List<String>, val rest: RestWindow?)

internal object LiveRestNotification {
  const val ID = 7401
  private const val CHANNEL = "session"
  var current: WorkoutNotification? = null
    private set
  var service: LiveRestService? = null

  fun show(context: Context, options: WorkoutNotification) {
    current = options
    val stored = JSONObject().put("title", options.title).put("lines", JSONArray(options.lines))
    options.rest?.let { rest ->
      stored.put("rest", JSONObject().put("startMs", rest.startMs).put("endMs", rest.endMs).put("key", rest.key))
    }
    if (!LiveRestActions.preferences(context).edit().putString("notification", stored.toString()).commit()) {
      Log.w("LiveRest", "Could not persist workout notification")
    }
    val rest = options.rest
    if (rest == null || rest.endMs <= System.currentTimeMillis()) {
      stopService(context)
      post(context, options)
      return
    }
    val running = service
    if (running != null) {
      running.update()
      return
    }
    post(context, options)
    val intent = Intent(context, LiveRestService::class.java)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    } catch (exception: RuntimeException) {
      if (!isStartRestricted(exception)) throw exception
      Log.w("LiveRest", "Rest service unavailable; keeping ordinary notification", exception)
    }
  }

  fun isStartRestricted(exception: RuntimeException): Boolean =
    exception is SecurityException ||
      (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
        exception is ForegroundServiceStartNotAllowedException) ||
      exception is IllegalStateException

  fun hide(context: Context) {
    current = null
    LiveRestActions.preferences(context).edit().remove("notification").commit()
    stopService(context)
    manager(context).cancel(ID)
  }

  fun restore(context: Context): WorkoutNotification? {
    current?.let { return it }
    val stored = LiveRestActions.preferences(context).getString("notification", null) ?: return null
    val options = JSONObject(stored)
    val lines = options.getJSONArray("lines")
    current = WorkoutNotification(
      options.getString("title"),
      (0 until lines.length()).map { lines.getString(it) },
      options.optJSONObject("rest")?.let {
        RestWindow(it.getLong("startMs"), it.getLong("endMs"), if (it.has("key")) it.getString("key") else null)
      }
    )
    return current
  }

  private fun stopService(context: Context) {
    val running = service
    if (running != null) {
      running.detachAndStop()
    } else {
      context.stopService(Intent(context, LiveRestService::class.java))
    }
  }

  fun post(context: Context, options: WorkoutNotification) {
    manager(context).notify(ID, build(context, options))
  }

  private fun manager(context: Context): NotificationManager =
    context.getSystemService(NotificationManager::class.java)

  @Suppress("DEPRECATION")
  fun build(context: Context, options: WorkoutNotification): Notification {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL, "Workout in progress", NotificationManager.IMPORTANCE_LOW)
      channel.setSound(null, null)
      channel.enableVibration(false)
      channel.enableLights(false)
      channel.setShowBadge(false)
      channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      manager(context).createNotificationChannel(channel)
    }
    val metadata = context.packageManager.getApplicationInfo(
      context.packageName, PackageManager.GET_META_DATA
    ).metaData
    val icon = metadata?.getInt("expo.modules.notifications.default_notification_icon", 0)
      ?.takeIf { it != 0 } ?: context.applicationInfo.icon
    val color = metadata?.getInt("expo.modules.notifications.default_notification_color", 0) ?: 0
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("jymiq:///live"))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    val tap = PendingIntent.getActivity(
      context, ID, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val nowMs = System.currentTimeMillis()
    val rest = options.rest
    val resting = rest != null && rest.endMs > nowMs
    val lines = if (rest != null && !resting) options.lines + "Rest over" else options.lines
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL)
    } else {
      Notification.Builder(context)
    }
    builder.setSmallIcon(icon)
      .setContentTitle(options.title)
      .setContentText(if (resting) "Resting" else if (rest != null) "Rest over" else lines.take(2).joinToString(" · "))
      .setStyle(Notification.BigTextStyle().bigText(lines.joinToString("\n")))
      .setContentIntent(tap)
      .setOngoing(true)
      .setAutoCancel(false)
      .setOnlyAlertOnce(true)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setPriority(Notification.PRIORITY_LOW)
      .setSound(null)
      .setVibrate(longArrayOf(0))
      .setShowWhen(resting)
      .setUsesChronometer(resting)
      .setChronometerCountDown(resting)
    if (color != 0) builder.setColor(context.getColor(color))
    if (resting) {
      val max = ((rest.endMs - rest.startMs + 999) / 1000).coerceIn(1, Int.MAX_VALUE.toLong()).toInt()
      val progress = ((nowMs - rest.startMs) / 1000).coerceIn(0, max.toLong()).toInt()
      builder.setProgress(max, progress, false).setWhen(rest.endMs)
      listOf("minus" to "−30s", "plus" to "+30s", "skip" to "Skip").forEachIndexed { index, (type, label) ->
        val action = Intent(context, LiveRestReceiver::class.java).setAction("expo.modules.liverest.$type")
        val pending = PendingIntent.getBroadcast(
          context, ID + index + 1, action, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        builder.addAction(Notification.Action.Builder(null, label, pending).build())
      }
    } else {
      builder.setProgress(0, 0, false)
    }
    return builder.build()
  }
}
