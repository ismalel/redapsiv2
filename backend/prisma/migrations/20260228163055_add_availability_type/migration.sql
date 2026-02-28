/*
  Warnings:

  - You are about to drop the column `event_registration_id` on the `Payment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('AVAILABLE', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_event_registration_id_fkey";

-- DropIndex
DROP INDEX "Payment_event_registration_id_key";

-- AlterTable
ALTER TABLE "AvailabilitySlot" ADD COLUMN     "type" "AvailabilityType" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "event_registration_id",
ADD COLUMN     "event_id" TEXT,
ALTER COLUMN "method" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
