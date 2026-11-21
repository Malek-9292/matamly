ALTER TABLE `orders`
  ADD COLUMN `paymentStatus` enum('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  ADD COLUMN `paymentConfirmedAt` datetime NULL,
  ADD COLUMN `paymentConfirmedBy` varchar(80) NOT NULL DEFAULT '';
