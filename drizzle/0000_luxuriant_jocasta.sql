CREATE TABLE `exercise_muscles` (
	`exercise_id` text NOT NULL,
	`muscle` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`exercise_id`, `muscle`),
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_em_muscle` ON `exercise_muscles` (`muscle`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`equipment` text NOT NULL,
	`kind` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`bar_weight_kg` real,
	`default_rest_sec` integer,
	`track_rpe` integer DEFAULT false NOT NULL,
	`description` text,
	`cues` text,
	`mistakes` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_ex_name` ON `exercises` (`name`);--> statement-breakpoint
CREATE INDEX `idx_ex_favorite` ON `exercises` (`is_favorite`);--> statement-breakpoint
CREATE TABLE `personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`category` text NOT NULL,
	`value` real NOT NULL,
	`weight_kg` real,
	`reps` integer,
	`previous_value` real,
	`set_id` text,
	`session_id` text NOT NULL,
	`achieved_at` integer NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`set_id`) REFERENCES `sets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_pr_exercise_category` ON `personal_records` (`exercise_id`,`category`,`achieved_at`);--> statement-breakpoint
CREATE INDEX `idx_pr_achieved` ON `personal_records` (`achieved_at`);--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`target_sets` integer NOT NULL,
	`target_reps` integer,
	`target_weight_kg` real,
	`rest_sec` integer,
	`note` text,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_rx_routine` ON `routine_exercises` (`routine_id`,`position`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`note` text,
	`position` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`routine_exercise_id` text,
	`position` integer NOT NULL,
	`planned_sets` integer,
	`planned_reps` integer,
	`planned_weight_kg` real,
	`rest_sec` integer NOT NULL,
	`added_mid_session` integer DEFAULT false NOT NULL,
	`removed_at` integer,
	`note` text,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`routine_exercise_id`) REFERENCES `routine_exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_sx_session` ON `session_exercises` (`session_id`,`position`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`paused_ms` integer DEFAULT 0 NOT NULL,
	`note` text,
	`rest_until` integer,
	`current_session_exercise_id` text,
	`current_set_id` text,
	`total_volume_kg` real,
	`total_sets` integer,
	`duration_sec` integer,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_started` ON `sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_status` ON `sessions` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sessions_one_live` ON `sessions` (`status`) WHERE status = 'in_progress';--> statement-breakpoint
CREATE TABLE `sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text DEFAULT 'working' NOT NULL,
	`planned_weight_kg` real,
	`planned_reps` integer,
	`weight_kg` real,
	`reps` integer,
	`rpe` real,
	`completed_at` integer,
	`e1rm_kg` real,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sets_session_exercise` ON `sets` (`session_exercise_id`,`position`);