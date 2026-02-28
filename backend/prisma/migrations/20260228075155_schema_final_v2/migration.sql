/*
  Warnings:

  - You are about to drop the column `psychologist_id` on the `AvailabilitySlot` table. All the data in the column will be lost.
  - Added the required column `psychologist_profile_id` to the `AvailabilitySlot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AvailabilitySlot" DROP CONSTRAINT "AvailabilitySlot_psychologist_id_fkey";

-- AlterTable
ALTER TABLE "AvailabilitySlot" DROP COLUMN "psychologist_id",
ADD COLUMN     "psychologist_profile_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_psychologist_profile_id_fkey" FOREIGN KEY ("psychologist_profile_id") REFERENCES "PsychologistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_billing_plan_id_fkey" FOREIGN KEY ("billing_plan_id") REFERENCES "BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
