ALTER TABLE `orders` MODIFY COLUMN `subtotal` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `deliveryFee` decimal(10,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `total` decimal(10,2) NOT NULL;