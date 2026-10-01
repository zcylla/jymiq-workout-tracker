package expo.modules.liverest

import android.content.Context
import org.json.JSONArray
import java.lang.ref.WeakReference

internal object LiveRestActions {
  private var observer = WeakReference<LiveRestModule>(null)

  fun preferences(context: Context) = context.getSharedPreferences("live-rest", Context.MODE_PRIVATE)

  @Synchronized
  fun startObserving(module: LiveRestModule) {
    observer = WeakReference(module)
  }

  @Synchronized
  fun stopObserving(module: LiveRestModule) {
    if (observer.get() === module) observer.clear()
  }

  @Synchronized
  fun deliver(context: Context, type: String) {
    val module = observer.get()
    if (module != null && module.appContext.hasActiveReactInstance) {
      module.sendEvent("onRestAction", mapOf("type" to type))
      return
    }
    val preferences = preferences(context)
    val pending = JSONArray(preferences.getString("actions", "[]"))
    pending.put(type)
    check(preferences.edit().putString("actions", pending.toString()).commit())
  }

  @Synchronized
  fun consume(context: Context): List<Map<String, String>> {
    val preferences = preferences(context)
    val pending = JSONArray(preferences.getString("actions", "[]"))
    val actions = (0 until pending.length()).map { mapOf("type" to pending.getString(it)) }
    check(preferences.edit().remove("actions").commit())
    return actions
  }
}
