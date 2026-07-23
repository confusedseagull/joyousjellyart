ALTER TABLE `cnyOrders` ADD `orderNumber` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `orderNumber` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `cnyOrders` ADD CONSTRAINT `cnyOrders_orderNumber_unique` UNIQUE(`orderNumber`);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`);