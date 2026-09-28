CREATE TABLE `sync_queue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`table_name` text NOT NULL,
	`row_key` text NOT NULL,
	`op` text NOT NULL,
	`queued_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sync_queue_row` ON `sync_queue` (`table_name`,`row_key`);
--> statement-breakpoint
CREATE TRIGGER `sync_exercises_ins` AFTER INSERT ON `exercises` FOR EACH ROW
WHEN NEW.is_custom = 1
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('exercises', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_exercises_upd` AFTER UPDATE ON `exercises` FOR EACH ROW
WHEN NEW.is_custom = 1
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('exercises', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_exercises_del` AFTER DELETE ON `exercises` FOR EACH ROW
WHEN OLD.is_custom = 1
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('exercises', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_exercise_muscles_ins` AFTER INSERT ON `exercise_muscles` FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM exercises WHERE id = NEW.exercise_id AND is_custom = 1)
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('exercise_muscles', json_array(NEW.exercise_id, NEW.muscle), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_exercise_muscles_upd` AFTER UPDATE ON `exercise_muscles` FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM exercises WHERE id = NEW.exercise_id AND is_custom = 1)
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('exercise_muscles', json_array(OLD.exercise_id, OLD.muscle), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('exercise_muscles', json_array(NEW.exercise_id, NEW.muscle), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_exercise_muscles_del` AFTER DELETE ON `exercise_muscles` FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM exercises WHERE id = OLD.exercise_id AND is_custom = 1) OR NOT EXISTS (SELECT 1 FROM exercises WHERE id = OLD.exercise_id)
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('exercise_muscles', json_array(OLD.exercise_id, OLD.muscle), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_routines_ins` AFTER INSERT ON `routines` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('routines', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_routines_upd` AFTER UPDATE ON `routines` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('routines', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_routines_del` AFTER DELETE ON `routines` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('routines', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_routine_exercises_ins` AFTER INSERT ON `routine_exercises` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('routine_exercises', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_routine_exercises_upd` AFTER UPDATE ON `routine_exercises` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('routine_exercises', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_routine_exercises_del` AFTER DELETE ON `routine_exercises` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('routine_exercises', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_programs_ins` AFTER INSERT ON `programs` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('programs', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_programs_upd` AFTER UPDATE ON `programs` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('programs', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_programs_del` AFTER DELETE ON `programs` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('programs', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_program_days_ins` AFTER INSERT ON `program_days` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('program_days', json_array(NEW.program_id, NEW.weekday), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_program_days_upd` AFTER UPDATE ON `program_days` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('program_days', json_array(OLD.program_id, OLD.weekday), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('program_days', json_array(NEW.program_id, NEW.weekday), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_program_days_del` AFTER DELETE ON `program_days` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('program_days', json_array(OLD.program_id, OLD.weekday), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_sessions_ins` AFTER INSERT ON `sessions` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('sessions', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_sessions_upd` AFTER UPDATE ON `sessions` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('sessions', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_sessions_del` AFTER DELETE ON `sessions` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('sessions', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_session_exercises_ins` AFTER INSERT ON `session_exercises` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('session_exercises', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_session_exercises_upd` AFTER UPDATE ON `session_exercises` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('session_exercises', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_session_exercises_del` AFTER DELETE ON `session_exercises` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('session_exercises', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_sets_ins` AFTER INSERT ON `sets` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('sets', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_sets_upd` AFTER UPDATE ON `sets` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('sets', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_sets_del` AFTER DELETE ON `sets` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('sets', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_personal_records_ins` AFTER INSERT ON `personal_records` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('personal_records', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_personal_records_upd` AFTER UPDATE ON `personal_records` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('personal_records', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_personal_records_del` AFTER DELETE ON `personal_records` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('personal_records', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_body_weights_ins` AFTER INSERT ON `body_weights` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('body_weights', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_body_weights_upd` AFTER UPDATE ON `body_weights` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('body_weights', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_body_weights_del` AFTER DELETE ON `body_weights` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('body_weights', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_check_ins_ins` AFTER INSERT ON `check_ins` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('check_ins', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_check_ins_upd` AFTER UPDATE ON `check_ins` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('check_ins', json_array(NEW.id), 'upsert', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
--> statement-breakpoint
CREATE TRIGGER `sync_check_ins_del` AFTER DELETE ON `check_ins` FOR EACH ROW
BEGIN
  INSERT OR REPLACE INTO sync_queue (table_name, row_key, op, queued_at) VALUES ('check_ins', json_array(OLD.id), 'delete', CAST(strftime('%s','now') AS INTEGER) * 1000);
END;
