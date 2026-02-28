/*
  Warnings:

  - You are about to drop the column `psychologist_profile_id` on the `AvailabilitySlot` table. All the data in the column will be lost.
  - Added the required column `psychologist_id` to the `AvailabilitySlot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AvailabilitySlot" DROP CONSTRAINT "AvailabilitySlot_psychologist_profile_id_fkey";

-- AlterTable
ALTER TABLE "AvailabilitySlot" DROP COLUMN "psychologist_profile_id",
ADD COLUMN     "psychologist_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "PsychologistProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
