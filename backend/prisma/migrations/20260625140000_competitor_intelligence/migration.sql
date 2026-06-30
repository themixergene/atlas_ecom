CREATE TYPE "CompetitorAdPlatform" AS ENUM ('META', 'TIKTOK', 'GOOGLE', 'INSTAGRAM', 'OTHER');
CREATE TYPE "CompetitorCreativeType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL', 'TEXT');
CREATE TYPE "CompetitorAdStatus" AS ENUM ('SAVED', 'ANALYZED', 'USED_AS_INSPIRATION');
CREATE TYPE "CompetitionLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "facebookPageUrl" TEXT,
    "instagramUrl" TEXT,
    "tiktokUrl" TEXT,
    "niche" TEXT,
    "country" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitorAd" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "productId" INTEGER,
    "platform" "CompetitorAdPlatform" NOT NULL,
    "adUrl" TEXT,
    "creativeType" "CompetitorCreativeType" NOT NULL,
    "creativeUrl" TEXT,
    "headline" TEXT,
    "primaryText" TEXT,
    "description" TEXT,
    "callToAction" TEXT,
    "offer" TEXT,
    "priceMentioned" DOUBLE PRECISION,
    "landingPageUrl" TEXT,
    "detectedHook" TEXT,
    "detectedPainPoint" TEXT,
    "detectedAngle" TEXT,
    "trustElement" TEXT,
    "urgencyElement" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "inspirationNotes" TEXT,
    "status" "CompetitorAdStatus" NOT NULL DEFAULT 'SAVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompetitorAd_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitorInsight" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "commonHooks" TEXT NOT NULL,
    "commonOffers" TEXT NOT NULL,
    "commonCallToActions" TEXT NOT NULL,
    "pricingObservations" TEXT,
    "creativePatterns" TEXT,
    "competitorWeaknesses" TEXT,
    "recommendedPositioning" TEXT NOT NULL,
    "recommendedAdCopies" JSONB NOT NULL,
    "opportunityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "competitionLevel" "CompetitionLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompetitorInsight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Competitor_name_idx" ON "Competitor"("name");
CREATE INDEX "CompetitorAd_competitorId_idx" ON "CompetitorAd"("competitorId");
CREATE INDEX "CompetitorAd_productId_idx" ON "CompetitorAd"("productId");
CREATE INDEX "CompetitorAd_platform_idx" ON "CompetitorAd"("platform");
CREATE INDEX "CompetitorAd_status_idx" ON "CompetitorAd"("status");
CREATE UNIQUE INDEX "CompetitorInsight_productId_key" ON "CompetitorInsight"("productId");
CREATE INDEX "CompetitorInsight_competitionLevel_idx" ON "CompetitorInsight"("competitionLevel");

ALTER TABLE "CompetitorAd"
ADD CONSTRAINT "CompetitorAd_competitorId_fkey"
FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompetitorAd"
ADD CONSTRAINT "CompetitorAd_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CompetitorInsight"
ADD CONSTRAINT "CompetitorInsight_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
