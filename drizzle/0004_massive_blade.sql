CREATE TABLE `businessSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pickupAddress` varchar(500) NOT NULL,
	`pickupInstructions` varchar(500),
	`shopAddressForDistance` varchar(500) NOT NULL,
	`deliveryTiers` json NOT NULL,
	`beyondTierFee` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessSettings_id` PRIMARY KEY(`id`)
);
