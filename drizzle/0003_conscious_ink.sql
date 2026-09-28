CREATE TABLE `body_weights` (
	`id` text PRIMARY KEY NOT NULL,
	`measured_at` integer NOT NULL,
	`weight_kg` real NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_body_weights_measured` ON `body_weights` (`measured_at`);