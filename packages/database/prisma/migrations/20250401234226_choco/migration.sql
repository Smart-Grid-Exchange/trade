/*
  Warnings:

  - Added the required column `marketId` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "marketId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("symbol") ON DELETE RESTRICT ON UPDATE CASCADE;
