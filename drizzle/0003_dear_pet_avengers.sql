CREATE TABLE `cnyOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(50) NOT NULL,
	`customerEmail` varchar(320),
	`deliveryMethod` enum('delivery','pickup') NOT NULL,
	`deliveryAddress` text,
	`fulfillmentDate` timestamp NOT NULL,
	`items` json NOT NULL,
	`subtotal` int NOT NULL,
	`deliveryFee` int NOT NULL,
	`total` int NOT NULL,
	`notes` text,
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cnyOrders_id` PRIMARY KEY(`id`)
);
