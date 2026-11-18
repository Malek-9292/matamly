CREATE TABLE customer_accounts (
 id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
 name varchar(100) NOT NULL,
 email varchar(320) NOT NULL,
 passwordHash varchar(255) NOT NULL,
 phone varchar(30) NOT NULL,
 createdAt datetime NOT NULL,
 updatedAt datetime NOT NULL,
 UNIQUE KEY customer_accounts_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE customer_sessions (
 tokenHash char(64) NOT NULL PRIMARY KEY,
 accountId int NOT NULL,
 expiresAt datetime NOT NULL,
 createdAt datetime NOT NULL,
 KEY customer_sessions_account_idx (accountId),
 CONSTRAINT customer_sessions_account_fk FOREIGN KEY (accountId) REFERENCES customer_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE customer_session_events (
 id bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
 accountId int NOT NULL,
 eventType varchar(20) NOT NULL,
 createdAt datetime NOT NULL,
 KEY customer_session_events_account_idx (accountId),
 KEY customer_session_events_type_idx (eventType),
 CONSTRAINT customer_session_events_account_fk FOREIGN KEY (accountId) REFERENCES customer_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE customer_addresses (
 id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
 accountId int NOT NULL,
 label varchar(60) NOT NULL,
 areaId int NULL,
 areaName varchar(120) NOT NULL DEFAULT '',
 block varchar(80) NOT NULL DEFAULT '',
 street varchar(120) NOT NULL DEFAULT '',
 avenue varchar(120) NOT NULL DEFAULT '',
 floor varchar(40) NOT NULL DEFAULT '',
 apartment varchar(40) NOT NULL DEFAULT '',
 house varchar(40) NOT NULL DEFAULT '',
 isDefault tinyint NOT NULL DEFAULT 0,
 createdAt datetime NOT NULL,
 updatedAt datetime NOT NULL,
 KEY customer_addresses_account_idx (accountId),
 CONSTRAINT customer_addresses_account_fk FOREIGN KEY (accountId) REFERENCES customer_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE orders ADD COLUMN customerAccountId int NULL;
ALTER TABLE orders ADD KEY orders_customer_account_idx (customerAccountId);
ALTER TABLE orders ADD CONSTRAINT orders_customer_account_fk FOREIGN KEY (customerAccountId) REFERENCES customer_accounts(id) ON DELETE SET NULL;