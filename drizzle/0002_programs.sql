CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`note` text,
	`status` text DEFAULT 'paused' NOT NULL,
	`started_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_programs_one_active` ON `programs` (`status`) WHERE status = 'active';--> statement-breakpoint
CREATE TABLE `program_days` (
	`program_id` text NOT NULL,
	`weekday` integer NOT NULL,
	`routine_id` text NOT NULL,
	PRIMARY KEY(`program_id`, `weekday`),
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade
);
