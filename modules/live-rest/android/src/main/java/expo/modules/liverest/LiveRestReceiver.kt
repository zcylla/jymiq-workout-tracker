package expo.modules.liverest

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class LiveRestReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val type = when (intent.action) {
      "expo.modules.liverest.minus" -> "minus"
      "expo.modules.liverest.plus" -> "plus"
      "expo.modules.liverest.skip" -> "skip"
      else -> return
    }
    try {
      val options = LiveRestNotification.restore(context) ?: return
      val rest = options.rest ?: return
      val nowMs = System.currentTimeMillis()
      if (rest.endMs <= nowMs) return
      val endMs = rest.endMs + if (type == "plus") 30_000L else -30_000L
      val updated = options.copy(rest = if (type == "skip" || endMs <= nowMs) null else rest.copy(endMs = endMs))
      try {
        LiveRestNotification.show(context, updated)
      } finally {
        LiveRestActions.deliver(context, type)
      }
    } catch (exception: Exception) {
      Log.w("LiveRest", "Rest action unavailable", exception)
    }
  }
}
