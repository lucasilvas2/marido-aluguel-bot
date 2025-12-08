-- CreateTable
CREATE TABLE `ServiceRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `professionalId` INTEGER NULL,
    `specialtyId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `description` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `requestedDate` DATETIME(3) NULL,
    `completedDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceRequest_clientId_idx`(`clientId`),
    INDEX `ServiceRequest_professionalId_idx`(`professionalId`),
    INDEX `ServiceRequest_specialtyId_idx`(`specialtyId`),
    INDEX `ServiceRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_specialtyId_fkey` FOREIGN KEY (`specialtyId`) REFERENCES `Specialty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
