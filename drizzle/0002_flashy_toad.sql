CREATE TABLE `billingHistory` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`type` enum('charge','credit','refund') NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`description` varchar(255),
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customDomains` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`domain` varchar(255) NOT NULL,
	`status` enum('pending','verified','failed') NOT NULL DEFAULT 'pending',
	`sslStatus` enum('pending','active','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customDomains_id` PRIMARY KEY(`id`),
	CONSTRAINT `customDomains_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `deployments` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`versionId` varchar(64) NOT NULL,
	`status` enum('pending','building','deployed','failed') NOT NULL DEFAULT 'pending',
	`url` varchar(255),
	`provider` varchar(64) NOT NULL,
	`logs` text,
	`error` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deployments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceComponents` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL,
	`code` text NOT NULL,
	`preview` varchar(255),
	`createdBy` int NOT NULL,
	`downloads` int DEFAULT 0,
	`rating` decimal(3,2) DEFAULT '0',
	`isPublic` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceComponents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectFiles` (
	`id` varchar(64) NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`path` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`content` text,
	`language` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(64) NOT NULL,
	`thumbnail` varchar(255),
	`html` text NOT NULL,
	`css` text NOT NULL,
	`js` text NOT NULL,
	`isPublic` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`downloads` int DEFAULT 0,
	`rating` decimal(3,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
