/*
  Warnings:

  - You are about to drop the column `user_id` on the `EventRegistration` table. All the data in the column will be lost.
  - You are about to drop the column `consultant_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `event_id` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[event_registration_id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[proposition_id]` on the table `TherapySession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `BillingPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultant_id` to the `EventRegistration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registered_by` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Made the column `method` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `Therapy` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EventRegistration" DROP CONSTRAINT "EventRegistration_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_consultant_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_event_id_fkey";

-- AlterTable
ALTER TABLE "BillingPlan" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "EventRegistration" DROP COLUMN "user_id",
ADD COLUMN     "consultant_id" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "consultant_id",
DROP COLUMN "event_id",
ADD COLUMN     "billing_plan_id" TEXT,
ADD COLUMN     "event_registration_id" TEXT,
ADD COLUMN     "registered_by" TEXT NOT NULL,
ALTER COLUMN "method" SET NOT NULL;

-- AlterTable
ALTER TABLE "Therapy" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TherapySession" ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "proposition_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_event_registration_id_key" ON "Payment"("event_registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "TherapySession_proposition_id_key" ON "TherapySession"("proposition_id");

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_proposition_id_fkey" FOREIGN KEY ("proposition_id") REFERENCES "ScheduleProposition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_event_registration_id_fkey" FOREIGN KEY ("event_registration_id") REFERENCES "EventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
