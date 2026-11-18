-- Matamly Universal Print: device registry, printer assignments, audit events and job leases.
CREATE TABLE IF NOT EXISTS `print_devices` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `platform` enum('android','windows','macos','linux') NOT NULL,
  `tokenHash` char(64) NOT NULL,
  `status` enum('pending','online','offline','revoked') NOT NULL DEFAULT 'pending',
  `lastSeenAt` datetime NULL,
  `appVersion` varchar(40) NOT NULL DEFAULT '',
  `capabilitiesJson` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `print_devices_token_hash` (`tokenHash`),
  KEY `print_devices_status` (`status`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `print_printers` (
  `id` varchar(36) NOT NULL,
  `deviceId` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `model` varchar(120) NOT NULL DEFAULT '',
  `connectionType` enum('usb','network','bluetooth','system') NOT NULL,
  `address` varchar(255) NOT NULL DEFAULT '',
  `isDefault` tinyint NOT NULL DEFAULT 0,
  `enabled` tinyint NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `print_printers_device` (`deviceId`),
  CONSTRAINT `print_printers_device_fk` FOREIGN KEY (`deviceId`) REFERENCES `print_devices` (`id`) ON DELETE CASCADE
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `print_job_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `jobId` int NOT NULL,
  `deviceId` varchar(36) NULL,
  `stage` varchar(40) NOT NULL,
  `status` varchar(24) NOT NULL,
  `message` varchar(500) NOT NULL DEFAULT '',
  `createdAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `print_job_events_job` (`jobId`),
  KEY `print_job_events_device` (`deviceId`),
  CONSTRAINT `print_job_events_job_fk` FOREIGN KEY (`jobId`) REFERENCES `print_jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `print_job_events_device_fk` FOREIGN KEY (`deviceId`) REFERENCES `print_devices` (`id`) ON DELETE SET NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `print_jobs`
  ADD COLUMN `deviceId` varchar(36) NULL,
  ADD COLUMN `printerId` varchar(36) NULL,
  ADD COLUMN `idempotencyKey` varchar(100) NULL,
  ADD COLUMN `leaseUntil` datetime NULL,
  ADD COLUMN `lastStage` varchar(40) NOT NULL DEFAULT 'queued',
  ADD UNIQUE KEY `print_jobs_idempotency` (`idempotencyKey`),
  ADD KEY `print_jobs_device_status` (`deviceId`, `status`);
