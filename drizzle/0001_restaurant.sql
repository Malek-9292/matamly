CREATE TABLE IF NOT EXISTS `app_settings` (
  `key` varchar(191) NOT NULL,
  `value` longtext NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `documents` (
  `name` varchar(64) NOT NULL,
  `body` longtext NOT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_areas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `active` tinyint NOT NULL DEFAULT 1,
  `minimumOrder` decimal(10,3) NOT NULL DEFAULT 0.000,
  `deliveryFee` decimal(10,3) NOT NULL DEFAULT 0.000,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_areas_name` (`name`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `active` tinyint NOT NULL DEFAULT 1,
  `minimumOrder` decimal(10,3) NOT NULL DEFAULT 0.000,
  `deliveryFee` decimal(10,3) NOT NULL DEFAULT 0.000,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `delivery_groups_name` (`name`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `delivery_group_areas` (
  `areaId` int NOT NULL,
  `groupId` int NOT NULL,
  PRIMARY KEY (`areaId`),
  KEY `delivery_group_areas_group` (`groupId`),
  CONSTRAINT `delivery_group_areas_area` FOREIGN KEY (`areaId`) REFERENCES `delivery_areas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_group_areas_group` FOREIGN KEY (`groupId`) REFERENCES `delivery_groups` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_counters` (
  `id` int NOT NULL,
  `nextNumber` int NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `order_counters` (`id`, `nextNumber`) VALUES (1, 1);

CREATE TABLE IF NOT EXISTS `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderNumber` int NOT NULL,
  `legacyId` varchar(80) NULL,
  `clientRequestId` varchar(64) NULL,
  `customerName` varchar(100) NOT NULL,
  `customerPhone` varchar(30) NOT NULL,
  `serviceMode` enum('pickup','delivery') NOT NULL,
  `areaId` int NULL,
  `areaName` varchar(120) NOT NULL DEFAULT '',
  `address` varchar(500) NOT NULL DEFAULT '',
  `notes` varchar(500) NOT NULL DEFAULT '',
  `payment` varchar(60) NOT NULL DEFAULT '',
  `foodTotal` decimal(10,3) NOT NULL,
  `deliveryFee` decimal(10,3) NOT NULL,
  `minimumOrder` decimal(10,3) NOT NULL DEFAULT 0.000,
  `minimumMet` tinyint NOT NULL DEFAULT 1,
  `total` decimal(10,3) NOT NULL,
  `status` enum('new','processing','ready','completed','cancelled') NOT NULL DEFAULT 'new',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_number` (`orderNumber`),
  UNIQUE KEY `orders_legacy_id` (`legacyId`),
  UNIQUE KEY `orders_client_request` (`clientRequestId`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` varchar(32) NOT NULL DEFAULT '',
  `name` varchar(120) NOT NULL,
  `qty` int NOT NULL,
  `price` decimal(10,3) NOT NULL,
  `choicesJson` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order` (`orderId`),
  CONSTRAINT `order_items_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `print_jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `kind` enum('auto','manual') NOT NULL,
  `status` enum('pending','printing','printed','failed') NOT NULL DEFAULT 'pending',
  `attempts` int NOT NULL DEFAULT 0,
  `lastError` varchar(500) NOT NULL DEFAULT '',
  `claimedBy` varchar(80) NOT NULL DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `confirmedAt` datetime NULL,
  PRIMARY KEY (`id`),
  KEY `print_jobs_order` (`orderId`),
  KEY `print_jobs_status` (`status`),
  CONSTRAINT `print_jobs_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_sessions` (
  `token` varchar(64) NOT NULL,
  `role` enum('admin','cashier') NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`token`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
