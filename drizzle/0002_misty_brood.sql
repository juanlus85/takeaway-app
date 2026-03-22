CREATE TABLE `productModifiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`label` varchar(128) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productModifiers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orderItems` ADD `customNote` varchar(512);