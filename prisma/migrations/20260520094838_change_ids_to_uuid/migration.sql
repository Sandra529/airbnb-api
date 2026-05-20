/*
  Warnings:

  - Changed the type of `type` on the `Listing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ListingType";

-- CreateIndex
CREATE INDEX "Listing_type_idx" ON "Listing"("type");
