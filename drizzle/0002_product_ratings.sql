CREATE TABLE IF NOT EXISTS `product_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `orderId` int NOT NULL,
  `productId` varchar(32) NOT NULL,
  `rating` tinyint NOT NULL,
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_ratings_order_product` (`orderId`, `productId`),
  KEY `product_ratings_product` (`productId`),
  CONSTRAINT `product_ratings_order_fk` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
