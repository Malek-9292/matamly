-- Add exact area-name variants used by customers; preserve existing areas and fees.
INSERT IGNORE INTO `delivery_areas` (`name`, `active`, `minimumOrder`, `deliveryFee`, `createdAt`, `updatedAt`)
VALUES
  ('عبد الله مبارك', 1, 0.000, 0.000, NOW(), NOW()),
  ('غرب عبد الله مبارك', 1, 0.000, 0.000, NOW(), NOW()),
  ('الصليبخات', 1, 0.000, 0.000, NOW(), NOW());
