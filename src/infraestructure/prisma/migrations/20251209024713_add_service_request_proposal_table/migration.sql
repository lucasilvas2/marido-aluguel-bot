-- CreateTable
CREATE TABLE `ServiceRequestProposal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceRequestId` INTEGER NOT NULL,
    `professionalId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `proposalMessage` TEXT NULL,
    `proposedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceRequestProposal_serviceRequestId_idx`(`serviceRequestId`),
    INDEX `ServiceRequestProposal_professionalId_idx`(`professionalId`),
    INDEX `ServiceRequestProposal_status_idx`(`status`),
    UNIQUE INDEX `ServiceRequestProposal_serviceRequestId_professionalId_key`(`serviceRequestId`, `professionalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServiceRequestProposal` ADD CONSTRAINT `ServiceRequestProposal_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequestProposal` ADD CONSTRAINT `ServiceRequestProposal_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
