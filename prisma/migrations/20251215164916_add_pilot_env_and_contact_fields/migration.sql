-- CreateEnum
CREATE TYPE "AppApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterEnum
ALTER TYPE "Environment" ADD VALUE 'PILOT';

-- DropForeignKey
ALTER TABLE "templates" DROP CONSTRAINT "templates_contactId_fkey";

-- AlterTable
ALTER TABLE "template_applications" ADD COLUMN     "approvalNotes" TEXT,
ADD COLUMN     "approvalStatus" "AppApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactTitle" TEXT,
ALTER COLUMN "contactId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "base_images" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "osType" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "patchLevel" TEXT,
    "computeGalleryId" TEXT,
    "imageDefinition" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "base_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "base_images_name_key" ON "base_images"("name");

-- CreateIndex
CREATE INDEX "base_images_isActive_idx" ON "base_images"("isActive");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
