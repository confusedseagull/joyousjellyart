DROP TABLE `orders`;
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(20),
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(50) NOT NULL,
	`customerEmail` varchar(320),
	`deliveryMethod` enum('delivery','pickup') NOT NULL,
	`deliveryAddress` text,
	`fulfillmentDate` timestamp NOT NULL,
	`timeRange` varchar(50),
	`items` json NOT NULL,
	`subtotal` int NOT NULL,
	`deliveryFee` int NOT NULL,
	`total` int NOT NULL,
	`notes` text,
	`paymentStatus` enum('pending','paid','failed','refunded') DEFAULT 'pending',
	`paymentId` varchar(255),
	`status` enum('pending','pending_confirmation','in_progress','completed','delivered') NOT NULL DEFAULT 'pending_confirmation',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
