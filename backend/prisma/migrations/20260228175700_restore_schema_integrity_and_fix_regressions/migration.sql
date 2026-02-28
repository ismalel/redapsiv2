/*
  Warnings:

  - You are about to drop the column `psychologist_id` on the `AvailabilitySlot` table. All the data in the column will be lost.
  - You are about to drop the column `consultant_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[event_registration_id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `psychologist_profile_id` to the `AvailabilitySlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `BillingPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registered_by` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Made the column `method` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `Therapy` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AvailabilitySlot" DROP CONSTRAINT "AvailabilitySlot_psychologist_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_consultant_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_event_id_fkey";

-- AlterTable
ALTER TABLE "AvailabilitySlot" DROP COLUMN "psychologist_id",
ADD COLUMN     "psychologist_profile_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BillingPlan" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "consultant_id",
DROP COLUMN "event_id",
ADD COLUMN     "event_registration_id" TEXT,
ADD COLUMN     "registered_by" TEXT NOT NULL,
ALTER COLUMN "method" SET NOT NULL;

-- AlterTable
ALTER TABLE "Therapy" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_event_registration_id_key" ON "Payment"("event_registration_id");

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_psychologist_profile_id_fkey" FOREIGN KEY ("psychologist_profile_id") REFERENCES "PsychologistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_event_registration_id_fkey" FOREIGN KEY ("event_registration_id") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
