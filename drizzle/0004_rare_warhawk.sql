CREATE TABLE `check_ins` (
	`id` text PRIMARY KEY NOT NULL,
	`at` integer NOT NULL,
	`sleep` text NOT NULL,
	`soreness` text NOT NULL,
	`energy` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_check_ins_at` ON `check_ins` (`at`);