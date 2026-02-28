/*
  Warnings:

  - You are about to drop the column `updated_at` on the `BillingPlan` table. All the data in the column will be lost.
  - You are about to drop the column `registered_by` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Therapy` table. All the data in the column will be lost.
  - Added the required column `consultant_id` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_registered_by_fkey";

-- AlterTable
ALTER TABLE "BillingPlan" DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "registered_by",
ADD COLUMN     "consultant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Therapy" DROP COLUMN "updated_at";

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
