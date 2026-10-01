package expo.modules.liverest

import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class RestOptions : Record {
  @Field val startMs: Double = 0.0
  @Field val endMs: Double = 0.0
}

class LiveRestOptions : Record {
  @Field val title: String = "Workout"
  @Field val lines: List<String> = emptyList()
  @Field val rest: RestOptions? = null
}

class LiveRestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiveRest")

    AsyncFunction("show") { options: LiveRestOptions ->
      val context = requireNotNull(appContext.reactContext).applicationContext
      val rest = options.rest?.let {
        require(it.startMs.isFinite() && it.endMs.isFinite())
        RestWindow(it.startMs.toLong(), it.endMs.toLong())
      }
      LiveRestNotification.show(context, WorkoutNotification(options.title, options.lines, rest))
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("hide") {
      val context = requireNotNull(appContext.reactContext).applicationContext
      LiveRestNotification.hide(context)
    }.runOnQueue(Queues.MAIN)
  }
}
