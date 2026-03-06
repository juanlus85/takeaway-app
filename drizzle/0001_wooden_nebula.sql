CREATE TABLE `callers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` int NOT NULL,
	`inUse` boolean NOT NULL DEFAULT false,
	`orderId` int,
	CONSTRAINT `callers_id` PRIMARY KEY(`id`),
	CONSTRAINT `callers_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`color` varchar(32) NOT NULL DEFAULT '#6366f1',
	`icon` varchar(64) NOT NULL DEFAULT 'utensils',
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`productName` varchar(128) NOT NULL,
	`categoryName` varchar(128) NOT NULL,
	`price` decimal(8,2) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`requiresKitchen` boolean NOT NULL DEFAULT false,
	`typeNote` varchar(256),
	`completedInKitchen` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`callerNumber` int,
	`sellerId` int NOT NULL,
	`sellerName` varchar(128) NOT NULL,
	`total` decimal(8,2) NOT NULL,
	`status` enum('pending','ready','delivered') NOT NULL DEFAULT 'pending',
	`requiresKitchen` boolean NOT NULL DEFAULT false,
	`notes` text,
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`price` decimal(8,2) NOT NULL DEFAULT '0.00',
	`fixedPrice` boolean NOT NULL DEFAULT true,
	`requiresKitchen` boolean NOT NULL DEFAULT false,
	`requiresTypeInput` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','seller','kitchen') NOT NULL DEFAULT 'seller';--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `lastSignedIn`;