-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'READY', 'TESTING', 'WINNING', 'PAUSED');

-- CreateEnum
CREATE TYPE "AdObjective" AS ENUM ('SALES', 'MESSAGES', 'TRAFFIC', 'AWARENESS');

-- CreateEnum
CREATE TYPE "CreativeType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "objective" "AdObjective" NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,
    "city" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "creativeType" "CreativeType" NOT NULL,
    "creativeUrl" TEXT NOT NULL,
    "adCopy" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdCampaign" ADD CONSTRAINT "AdCampaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
